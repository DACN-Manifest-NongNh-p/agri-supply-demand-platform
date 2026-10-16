import { useNow } from "./useNow";
import "./orders.css";

/** Under this many seconds the timer turns red. */
const URGENT_SECONDS = 120;

/** Live mm:ss until `expiresAt` (epoch ms), ticking every second; red in the last two minutes. */
export function Countdown({ expiresAt, large = false }: { expiresAt: number; large?: boolean }) {
  const now = useNow();
  const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const hours = Math.floor(left / 3600);
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  const text =
    hours > 0 ? `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
  const className = ["ord-timer", large && "ord-timer--large", left <= URGENT_SECONDS && "is-urgent"].filter(Boolean).join(" ");
  return (
    <time className={className} dateTime={`PT${minutes}M${seconds}S`} aria-label={`${minutes} minutes ${seconds} seconds left`}>
      {text}
    </time>
  );
}
