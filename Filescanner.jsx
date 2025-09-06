import React, { useState, useRef } from "react"; // Single-file React component: Clean modern file viewer // - Supports: PDF, Excel (xls/xlsx/csv), images, text, audio, video // - Uses Tailwind for styling (no imports needed) // - Uses SheetJS (xlsx) for Excel parsing (dynamically imported)

export default function FileViewerApp() { const [files, setFiles] = useState([]); // {id, name, type, url, preview, meta} const [dragOver, setDragOver] = useState(false); const fileInputRef = useRef(null);

const supported = { pdf: ".pdf", excel: ".xls,.xlsx,.csv", image: "image/", text: ".txt,.md,.csv", audio: "audio/", video: "video/*", };

function uid() { return Math.random().toString(36).slice(2, 9); }

async function handleFiles(list) { const arr = Array.from(list); const newFiles = await Promise.all( arr.map(async (f) => { const url = URL.createObjectURL(f); const lower = f.name.toLowerCase(); let preview = null; let meta = {};

if (lower.endsWith(".pdf")) {
      preview = { kind: "pdf", url };
    } else if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) {
      // parse Excel using SheetJS if available
      try {
        const XLSX = await import("xlsx");
        const arrayBuffer = await f.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        meta = { sheetName, rows: json.length, cols: json[0] ? json[0].length : 0, previewRows: json.slice(0, 10) };
        preview = { kind: "excel", json: meta.previewRows };
      } catch (e) {
        preview = { kind: "file", url };
        meta.error = "Failed to parse - SheetJS missing or parse error";
      }
    } else if (f.type.startsWith("image/")) {
      preview = { kind: "image", url };
    } else if (f.type.startsWith("text/") || lower.endsWith(".md") || lower.endsWith(".txt")) {
      const text = await f.text();
      preview = { kind: "text", text };
    } else if (f.type.startsWith("audio/")) {
      preview = { kind: "audio", url };
    } else if (f.type.startsWith("video/")) {
      preview = { kind: "video", url };
    } else {
      preview = { kind: "file", url };
    }

    return {
      id: uid(),
      name: f.name,
      size: f.size,
      type: f.type,
      url,
      preview,
      meta,
    };
  })
);

setFiles((s) => [...newFiles, ...s]);

}

function onDrop(e) { e.preventDefault(); setDragOver(false); const dt = e.dataTransfer; if (dt && dt.files && dt.files.length) { handleFiles(dt.files); } }

function onFileInputChange(e) { const input = e.target; if (input.files && input.files.length) handleFiles(input.files); input.value = null; }

function removeFile(id) { setFiles((s) => s.filter((f) => f.id !== id)); }

function clearAll() { // revoke object URLs files.forEach((f) => URL.revokeObjectURL(f.url)); setFiles([]); }

return ( <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6"> <div className="w-full max-w-6xl"> <header className="flex items-center justify-between mb-6"> <div> <h1 className="text-2xl font-semibold">Universal File Viewer</h1> <p className="text-sm text-gray-500">Open PDFs, Excel, images, text, audio, and video — clean & modern UI.</p> </div> <div className="flex gap-2 items-center"> <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md text-sm" > Upload Files </button> <button onClick={clearAll} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm"> Clear All </button> </div> </header>

<div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-6 transition ${dragOver ? "border-blue-400 bg-white" : "border-gray-200 bg-transparent"}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileInputChange}
        className="hidden"
        accept={`${supported.excel},${supported.pdf},${supported.image},${supported.text},${supported.audio},${supported.video}`}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Drag & drop files here</h2>
          <p className="text-sm text-gray-500">Supported: PDF, XLS/XLSX, CSV, PNG/JPG, TXT, MD, MP3, MP4...</p>
        </div>
        <div className="text-sm text-gray-400">Tip: You can upload multiple files at once</div>
      </div>
    </div>

    {/* file list & preview */}
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-1">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Files ({files.length})</h3>
          {files.length === 0 && <div className="text-sm text-gray-400">No files yet — add some to preview.</div>}

          <ul className="space-y-3 mt-3">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 text-sm font-medium">
                  {f.name.split(".").pop()?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB • {f.type || "unknown"}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <a href={f.url} download={f.name} className="text-xs px-3 py-1 border rounded">Download</a>
                      <button onClick={() => removeFile(f.id)} className="text-xs px-3 py-1 border rounded">Remove</button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <h4 className="font-semibold">Quick Actions</h4>
          <div className="flex gap-2 mt-3">
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="flex-1 px-3 py-2 border rounded">Upload</button>
            <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(window.location.href)} className="flex-1 px-3 py-2 border rounded">Copy Link</button>
          </div>
        </div>
      </div>

      <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Preview</h3>
        {files.length === 0 && <div className="text-sm text-gray-400">Upload a file to see a live preview here.</div>}

        <div className="space-y-4">
          {files.map((f) => (
            <div key={f.id} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-gray-400">{f.meta && f.meta.sheetName ? `${f.meta.sheetName} • ${f.meta.rows} rows` : ""}</div>
              </div>

              <div className="max-h-96 overflow-auto bg-gray-50 p-3 rounded">
                {f.preview.kind === "pdf" && (
                  <object data={f.preview.url} type="application/pdf" width="100%" height="500">PDF preview not supported — <a href={f.url}>download</a></object>
                )}

                {f.preview.kind === "image" && <img src={f.preview.url} alt={f.name} className="max-w-full rounded" />}

                {f.preview.kind === "text" && (
                  <pre className="whitespace-pre-wrap text-sm">{f.preview.text}</pre>
                )}

                {f.preview.kind === "audio" && (
                  <audio controls src={f.preview.url} className="w-full" />
                )}

                {f.preview.kind === "video" && (
                  <video controls src={f.preview.url} className="w-full max-h-96" />
                )}

                {f.preview.kind === "excel" && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Excel preview (first 10 rows)</div>
                    <div className="overflow-auto">
                      <table className="min-w-full text-sm table-auto border-collapse">
                        <tbody>
                          {f.preview.json.map((r, i) => (
                            <tr key={i} className="border-t">
                              {r.map((c, j) => (
                                <td key={j} className="px-2 py-1 border">{String(c ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {f.preview.kind === "file" && (
                  <div className="text-sm">Cannot render this file type. <a href={f.url} className="underline">Download</a></div>
                )}

                {f.meta && f.meta.error && <div className="text-xs text-red-500 mt-2">{f.meta.error}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <footer className="mt-6 text-xs text-gray-400">Built for quick previews. For heavy files, download to your device or use a dedicated viewer.</footer>
  </div>
</div>

); }

