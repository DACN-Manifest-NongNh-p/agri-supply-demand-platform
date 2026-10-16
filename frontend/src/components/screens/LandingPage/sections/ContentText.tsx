import { Fragment } from "react";

/** Text with "\n" shown as line breaks (titles an admin edits). */
export function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/** First line as is, the rest in a <span> (titles whose second line is styled differently). */
export function TwoLine({ text }: { text: string }) {
  const [first, ...rest] = text.split("\n");
  return (
    <>
      {first}
      {rest.length > 0 && <span>{rest.join(" ")}</span>}
    </>
  );
}
