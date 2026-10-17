import { initials } from "./profileStore";

/** Round photo, or the person's initials on green when there is no photo. */
export function Avatar({ name, photo, size = 34 }: { name: string; photo: string | null; size?: number }) {
  return (
    <span className="pf-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initials(name)}
    </span>
  );
}
