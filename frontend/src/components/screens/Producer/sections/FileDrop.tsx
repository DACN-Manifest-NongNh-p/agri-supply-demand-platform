import { useRef, useState, type DragEvent } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { ACCEPTED_FILES } from "@/lib/spreadsheet";

type Props = {
  onFile: (file: File) => void;
  onTemplate: () => void;
  /** Name of the file being read or last read. */
  fileName?: string;
  busy?: boolean;
};

/** Drop zone for an .xlsx or .csv file, with a link to a sample file. Shared by buyer and producer imports. */
export function FileDrop({ onFile, onTemplate, fileName, busy = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="ph-filedrop-wrap">
      <label
        className={over ? "ph-filedrop is-over" : "ph-filedrop"}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILES}
          className="ph-sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            // Picking the same file again after fixing it should read it again.
            event.target.value = "";
          }}
        />
        <span className="ph-filedrop-icon" aria-hidden="true">
          {fileName ? <FileSpreadsheet size={22} /> : <Upload size={22} />}
        </span>
        <span className="ph-filedrop-text">
          <strong>{busy ? "Reading…" : fileName ? fileName : "Drop an Excel or CSV file here"}</strong>
          <small>{fileName ? "Drop another file or click to replace it" : "or click to choose a file · .xlsx or .csv"}</small>
        </span>
      </label>
      <button type="button" className="ph-link-btn ph-filedrop-template" onClick={onTemplate}>
        <Download size={14} /> Download a sample file
      </button>
    </div>
  );
}
