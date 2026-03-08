import { useEffect, useRef, useState } from "react";
import type { DriveFile } from "../types/lms";

export function Storage({
  api,
  headers,
  setMessage,
}: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
}) {
  function toUserMessage(error: unknown) {
    const msg = (error as Error)?.message || "Request failed";
    if (msg.includes("Google Drive not linked")) {
      return "Google Drive is not linked yet. Click 'Link Google Account' first.";
    }
    if (msg.includes("Service account uploads require")) {
      return "Upload is disabled in service-account mode. Switch to OAuth user linking.";
    }
    if (msg.includes("Uploaded file is too large")) {
      return "File is too large. Please upload a smaller file.";
    }
    return msg;
  }

  const [linked, setLinked] = useState(false);
  const [mode, setMode] = useState<"oauth" | "service_account" | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [name, setName] = useState("notes.txt");
  const [content, setContent] = useState("My notes");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "note">("file");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async function load() {
    try {
      const s = await api("/storage/google/status", { headers });
      setLinked(s.linked);
      setMode((s.mode || null) as "oauth" | "service_account" | null);
      setFiles(s.linked ? await api("/storage/google/files", { headers }) : []);
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-3">
      <article className="rounded-md border border-slate-200 p-3">
        {!linked && (
          <button
            onClick={async () => {
              try {
                const d = await api("/storage/google/connect-url", { headers });
                window.location.href = d.url;
              } catch (e) {
                setMessage(toUserMessage(e));
              }
            }}
            className="rounded bg-blue-700 px-3 py-2 text-white"
          >
            Link Google Account
          </button>
        )}
        {linked && mode === "oauth" && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await api("/storage/google/disconnect", {
                  method: "DELETE",
                  headers,
                });
                await load();
              }}
              className="rounded bg-slate-900 px-3 py-2 text-white"
            >
              Disconnect
            </button>
            <button
              onClick={load}
              className="rounded border border-slate-300 px-3 py-2"
            >
              Refresh
            </button>
          </div>
        )}
        {linked && mode === "service_account" && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
              Service Account Connected
            </span>
            <button
              onClick={load}
              className="rounded border border-slate-300 px-3 py-2"
            >
              Refresh
            </button>
          </div>
        )}
      </article>
      {linked && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (uploadMode === "file") {
                if (!selectedFile) {
                  setMessage("Please select a file first.");
                  return;
                }
                const base64 = await toBase64(selectedFile);
                await api("/storage/google/upload", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    name: selectedFile.name,
                    contentBase64: base64,
                    mimeType: selectedFile.type || "application/octet-stream",
                  }),
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              } else {
                if (!name.trim() || !content.trim()) {
                  setMessage("Please provide both note filename and content.");
                  return;
                }
              await api("/storage/google/upload", {
                method: "POST",
                headers,
                body: JSON.stringify({
                  name: name.trim(),
                  content: content.trim(),
                  mimeType: "text/plain",
                }),
              });
              }
              await load();
            } catch (er) {
              setMessage(toUserMessage(er));
            }
          }}
          className="rounded-md border border-slate-200 p-3"
        >
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`rounded px-3 py-1 text-sm ${uploadMode === "file" ? "bg-blue-700 text-white" : "bg-slate-100"}`}
            >
              File Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("note")}
              className={`rounded px-3 py-1 text-sm ${uploadMode === "note" ? "bg-blue-700 text-white" : "bg-slate-100"}`}
            >
              Quick Note
            </button>
          </div>

          {uploadMode === "file" ? (
            <>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Upload File (documents, images, PDFs, etc.)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
          />
          {selectedFile && (
            <p className="mb-2 text-xs text-slate-600">
              Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
            </p>
          )}
            </>
          ) : (
            <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 p-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 p-2"
            rows={4}
          />
            </>
          )}
          <button
            data-keep-action-text="true"
            className="rounded bg-slate-900 px-3 py-2 text-white"
          >
            {uploadMode === "file" ? "Upload File" : "Upload Note"}
          </button>
        </form>
      )}
      <div className="space-y-2">
        {files.map((f) => (
          <article
            key={f.id || `${Math.random()}`}
            className="rounded border border-slate-200 bg-slate-50 p-2 text-sm"
          >
            <p className="font-medium">{f.name}</p>
            {f.webViewLink && (
              <a
                href={f.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
