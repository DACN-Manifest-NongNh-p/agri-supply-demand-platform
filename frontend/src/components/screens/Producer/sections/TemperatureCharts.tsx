import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts/core";
import { GaugeChart, LineChart } from "echarts/charts";
import { GridComponent, MarkAreaComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

// Register only what these two charts use, to keep the bundle small.
echarts.use([GaugeChart, LineChart, GridComponent, MarkAreaComponent, TooltipComponent, CanvasRenderer]);

const INK = "#1d2820";
const MUTED = "#687269";
const GREEN = "#3d7a4e";
const RED = "#bf3a2b";
const TRACK = "#eceee9";
const SAFE = "#cfe5cf";
const FONT = "system-ui, 'Segoe UI', Roboto, sans-serif";

/** Mounts an ECharts instance on a div, keeps it sized to its container and applies `option`. */
function useEChart(option: EChartsCoreOption) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return containerRef;
}

type Range = { min: number; max: number };

/** Arc gauge: safe band highlighted on the track, needle at the current reading. */
export function TemperatureGauge({ value, range, caption }: { value: number; range: Range; caption: string }) {
  const option = useMemo<EChartsCoreOption>(() => {
    const low = Math.min(0, Math.floor(value - 1));
    const high = Math.max(12, Math.ceil(value + 1));
    const at = (celsius: number) => (celsius - low) / (high - low);
    const out = value < range.min || value > range.max;
    return {
      textStyle: { fontFamily: FONT },
      series: [
        {
          type: "gauge",
          min: low,
          max: high,
          splitNumber: (high - low) / 2,
          startAngle: 210,
          endAngle: -30,
          radius: "96%",
          center: ["50%", "56%"],
          axisLine: {
            roundCap: true,
            lineStyle: { width: 14, color: [[at(range.min), TRACK], [at(range.max), SAFE], [1, TRACK]] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            distance: -34,
            color: MUTED,
            fontSize: 11,
            formatter: (tick: number) => (tick === range.min || tick === range.max ? `${tick}°` : ""),
          },
          pointer: { length: "58%", width: 4, itemStyle: { color: out ? RED : INK } },
          anchor: { show: true, size: 12, itemStyle: { color: out ? RED : INK, borderColor: "#fff", borderWidth: 3 } },
          title: { offsetCenter: [0, "62%"], color: MUTED, fontSize: 12 },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, "38%"],
            formatter: (reading: number) => `${reading.toFixed(1)}°`,
            color: INK,
            fontSize: 30,
            fontWeight: 600,
          },
          data: [{ value, name: caption }],
        },
      ],
    };
  }, [value, range.min, range.max, caption]);

  const ref = useEChart(option);
  return <div ref={ref} className="ph-gauge-chart" role="img" aria-label={`${caption} ${value.toFixed(1)} °C`} />;
}

/** Readings over time with the safe band shaded; hover shows each reading. */
export function TemperatureTrend({ readings, range }: { readings: { time: string; celsius: number }[]; range: Range }) {
  const option = useMemo<EChartsCoreOption>(() => {
    const values = readings.map((reading) => reading.celsius);
    const isOut = (celsius: number) => celsius < range.min || celsius > range.max;
    return {
      textStyle: { fontFamily: FONT },
      grid: { left: 36, right: 16, top: 12, bottom: 26 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#e4e7e1",
        textStyle: { color: INK, fontSize: 13 },
        formatter: (params: { name: string; value: number }[]) => {
          const [point] = params;
          const note = isOut(point.value) ? `<br/><span style="color:${RED}">Outside the safe range</span>` : "";
          return `${point.name}<br/><b>${point.value.toFixed(1)} °C</b>${note}`;
        },
      },
      xAxis: {
        type: "category",
        data: readings.map((reading) => reading.time),
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: MUTED, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        // Even bounds with a 2° step, so the 2° and 8° safe limits land on gridlines.
        min: Math.floor(Math.min(range.min - 1, ...values) / 2) * 2,
        max: Math.ceil(Math.max(range.max + 1, ...values) / 2) * 2,
        interval: 2,
        axisLabel: { color: MUTED, fontSize: 11, formatter: "{value}°" },
        splitLine: { lineStyle: { color: "#f0f1ee" } },
      },
      series: [
        {
          type: "line",
          smooth: 0.3,
          // Every reading is a real sensor value; don't let ECharts thin out the dots.
          showAllSymbol: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { color: INK, width: 2.5 },
          itemStyle: { color: "#fff", borderColor: INK, borderWidth: 2 },
          data: values.map((celsius) =>
            isOut(celsius) ? { value: celsius, symbolSize: 10, itemStyle: { color: RED, borderColor: RED } } : celsius,
          ),
          markArea: {
            silent: true,
            itemStyle: { color: "rgba(61, 122, 78, 0.10)" },
            label: { show: true, position: "insideTopLeft", color: GREEN, fontSize: 11, fontWeight: 600 },
            data: [[{ yAxis: range.min, name: `Safe ${range.min}–${range.max} °C` }, { yAxis: range.max }]],
          },
        },
      ],
    };
  }, [readings, range.min, range.max]);

  const ref = useEChart(option);
  return <div ref={ref} className="ph-trend-chart" role="img" aria-label="Temperature over time with the safe range shaded" />;
}
