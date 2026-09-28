import { useEffect, useMemo } from "react";
import { ImagePlus, X } from "lucide-react";

/** Multi-image picker for product photos (files: File[]). */
export default function ImagePicker({ files, onChange, max = 5, existing = [] }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const add = (e) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    onChange([...files, ...picked].slice(0, max));
    e.target.value = "";
  };

  const showing = files.length ? urls : existing;
  return (
    <div className="img-strip">
      {showing.map((src, i) => (
        <div className="item" key={src}>
          <img src={src} alt={`Photo ${i + 1}`} />
          {files.length > 0 && (
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
              <X />
            </button>
          )}
        </div>
      ))}
      {files.length < max && (
        <label className="add">
          <ImagePlus aria-hidden="true" />
          {existing.length && !files.length ? "Replace photos" : "Add photo"}
          <input type="file" accept="image/*" multiple onChange={add} />
        </label>
      )}
    </div>
  );
}

/** Single-document picker with preview, used for KYC. */
export function DocPicker({ label, file, onChange, current }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const src = url || current;
  return (
    <div className="field">
      <span className="label">{label}</span>
      <label className={`drop ${src ? "has" : ""}`}>
        {src ? (
          <>
            <img src={src} alt={`${label} preview`} />
            <span className="replace">Replace</span>
          </>
        ) : (
          <>
            <ImagePlus aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>Upload a photo</span>
            <span className="small faint">Clear, flat, all four corners visible</span>
          </>
        )}
        <input type="file" accept="image/*" aria-label={label} onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
      </label>
    </div>
  );
}
