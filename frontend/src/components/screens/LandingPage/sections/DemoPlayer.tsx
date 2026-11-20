// A short, looping "screen recording" of the app, drawn in code: a browser frame, a cursor that moves
// and clicks, a title card per step, and named step tabs that work like a video's chapters. Plays while on
// screen, pauses off screen, and shows a still final frame when the visitor prefers reduced motion.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play, type LucideIcon } from "lucide-react";
import "../styles/Demo.css";

export type DemoStep = {
  /** Short name of the step, shown on its tab and on the title card (2–3 words). */
  title: string;
  /** How long this step stays on screen. */
  ms: number;
  /** What happens, shown under the frame like a subtitle. */
  caption: string;
  /** Cursor position in % of the screen area. */
  cursor?: [number, number];
  /** Show a click ripple when the cursor arrives. */
  click?: boolean;
};

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Props = {
  url: string;
  steps: DemoStep[];
  render: (step: number) => ReactNode;
  label: string;
  /** Name of the demo, shown in the frame so each video is recognisable at a glance. */
  name: string;
  icon: LucideIcon;
  /** Accent colour of this demo: tag, title cards, active tab, spotlight. */
  accent: string;
};

export function DemoPlayer({ url, steps, render, label, name, icon: Icon, accent }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(() => (reducedMotion() ? steps.length - 1 : 0));
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(() => reducedMotion());
  const playing = visible && !paused;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % steps.length), steps[step].ms);
    return () => window.clearTimeout(timer);
  }, [playing, step, steps]);

  const current = steps[step];
  const cursor = current.cursor ?? steps.slice(0, step).reverse().find((item) => item.cursor)?.cursor ?? [50, 50];

  return (
    <figure ref={ref} className="demo" aria-label={label} style={{ "--demo-accent": accent } as CSSProperties}>
      <div className="demo-frame">
        <div className="demo-chrome" aria-hidden="true">
          <span className="demo-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="demo-url">farmora.vn{url}</span>
          <span className="demo-name">
            <Icon size={13} /> {name}
          </span>
        </div>
        <div className="demo-screen" data-step={step}>
          {render(step)}
          <span key={step} className="demo-scene" aria-hidden="true">
            <b>{step + 1}</b> {current.title}
          </span>
          <span className="demo-cursor" style={{ left: `${cursor[0]}%`, top: `${cursor[1]}%` }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.3 13.6 L17.5 13.6 Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            {current.click && <span key={step} className="demo-click" />}
          </span>
        </div>
      </div>

      <figcaption className="demo-bar">
        <div className="demo-steps" role="tablist" aria-label="Steps">
          <button type="button" className="demo-play" onClick={() => setPaused(!paused)} aria-label={paused ? "Play" : "Pause"}>
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          {steps.map((item, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === step}
              className={index < step ? "demo-step is-done" : index === step ? "demo-step is-now" : "demo-step"}
              onClick={() => setStep(index)}
              title={item.title}
              aria-label={`Step ${index + 1}: ${item.title}`}
            >
              <span className="demo-step-label">
                <b>{index + 1}</b>
                {index === step && <span className="demo-step-text">{item.title}</span>}
              </span>
              <span className="demo-step-track">
                {index === step && <span key={`${step}-${playing}`} style={{ animationDuration: `${item.ms}ms`, animationPlayState: playing ? "running" : "paused" }} />}
              </span>
            </button>
          ))}
        </div>
        <p className="demo-caption" aria-live="polite">
          {current.caption}
        </p>
      </figcaption>
    </figure>
  );
}

/** Text that types itself while `active`, and stays complete afterwards. */
export function Typed({ text, active, done }: { text: string; active: boolean; done: boolean }) {
  if (done) return <span className="demo-typed">{text}</span>;
  if (!active) return <span className="demo-typed" />;
  return <TypingRun key={text} text={text} />;
}

function TypingRun({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setCount((value) => (value >= text.length ? value : value + 1)), 70);
    return () => window.clearInterval(timer);
  }, [text]);
  return (
    <span className="demo-typed">
      {text.slice(0, count)}
      <i className="demo-caret" />
    </span>
  );
}

/** A live-looking countdown that runs while its step is on screen and restarts each time. */
export function Countdown({ from, active }: { from: number; active: boolean }) {
  return active ? <CountdownRun from={from} /> : <span className="demo-countdown">{clock(from)}</span>;
}

function CountdownRun({ from }: { from: number }) {
  const [left, setLeft] = useState(from);
  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className="demo-countdown">{clock(left)}</span>;
}

function clock(seconds: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}
