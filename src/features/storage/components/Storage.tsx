import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { DriveFile, Role } from "../../../shared/types/lms";

type SortMode = "NEWEST" | "OLDEST" | "NAME_ASC" | "NAME_DESC" | "SIZE_DESC";

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
  if (msg.includes("Forbidden")) {
    return "You do not have permission for this action.";
  }
  return msg;
}

function getExtension(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

function getFileTypeLabel(file: DriveFile) {
  const ext = getExtension(String(file.name || ""));
  const mime = String(file.mimeType || "");
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "Image";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Video";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Archive";
  if (["doc", "docx", "txt", "rtf", "odt", "ppt", "pptx"].includes(ext)) return "Document";
  return "File";
}

function supportsPreview(file: DriveFile) {
  const ext = getExtension(String(file.name || ""));
  const mime = String(file.mimeType || "");
  if (mime.startsWith("image/")) return true;
  if (mime === "application/pdf") return true;
  if (mime.startsWith("video/")) return true;
  return ["png", "jpg", "jpeg", "gif", "webp", "pdf", "mp4", "webm", "mov"].includes(ext);
}

function toBytes(size: string | null | undefined) {
  const n = Number(size || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatSize(size: string | null | undefined) {
  const bytes = toBytes(size);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function FileTypeIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  if (type === "Image") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M21 16l-5-5-7 7" />
      </svg>
    );
  }
  if (type === "PDF" || type === "Document") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    );
  }
  if (type === "Spreadsheet") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h8M12 7v10" />
      </svg>
    );
  }
  if (type === "Video") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="M17 10l4-2v8l-4-2z" />
      </svg>
    );
  }
  if (type === "Archive") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function Storage({
  api,
  headers,
  setMessage,
  userRole,
}: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  userRole: Role;
}) {
  const [linked, setLinked] = useState(false);
  const [mode, setMode] = useState<"oauth" | "service_account" | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "note">("file");
  const [name, setName] = useState("notes.txt");
  const [content, setContent] = useState("My notes");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canUpload = true;
  const canManage =
    userRole === "INSTRUCTOR" ||
    userRole === "ADMIN" ||
    userRole === "REGISTRAR" ||
    userRole === "DEAN";

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
    setLoading(true);
    try {
      const status = await api("/storage/google/status", { headers });
      setLinked(Boolean(status.linked));
      setMode((status.mode || null) as "oauth" | "service_account" | null);
      if (status.linked) {
        const rows = await api("/storage/google/files", { headers });
        setFiles(rows || []);
      } else {
        setFiles([]);
      }
    } catch (e) {
      setMessage(toUserMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = files.filter((file) =>
      !q ? true : String(file.name || "").toLowerCase().includes(q),
    );
    rows = [...rows].sort((a, b) => {
      const aName = String(a.name || "").toLowerCase();
      const bName = String(b.name || "").toLowerCase();
      const aTime = new Date(String(a.modifiedTime || 0)).getTime();
      const bTime = new Date(String(b.modifiedTime || 0)).getTime();
      const aSize = toBytes(a.size);
      const bSize = toBytes(b.size);
      if (sortMode === "NAME_ASC") return aName.localeCompare(bName);
      if (sortMode === "NAME_DESC") return bName.localeCompare(aName);
      if (sortMode === "OLDEST") return aTime - bTime;
      if (sortMode === "SIZE_DESC") return bSize - aSize;
      return bTime - aTime;
    });
    return rows;
  }, [files, search, sortMode]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search, sortMode]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleUploadSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!canUpload) return;
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
      setShowUploadModal(false);
      await load();
    } catch (er) {
      setMessage(toUserMessage(er));
    }
  }

  function openFile(file: DriveFile) {
    if (supportsPreview(file)) {
      setPreviewFile(file);
      return;
    }
    const url = file.webViewLink || file.webContentLink;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadFile(file: DriveFile) {
    const url = file.webContentLink || file.webViewLink;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function deleteFile(file: DriveFile) {
    if (!canManage) return;
    const fileId = String(file.id || "");
    if (!fileId) return;
    const ok = confirm(`Delete "${file.name}"?`);
    if (!ok) return;
    try {
      await api(`/storage/google/files/${fileId}`, {
        method: "DELETE",
        headers,
      });
      await load();
      setMessage("File deleted.");
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  const previewUrl = previewFile?.webViewLink || previewFile?.webContentLink || "";
  const previewMime = String(previewFile?.mimeType || "");
  const previewName = String(previewFile?.name || "File");

  return (
    <section className="space-y-4">
      <article className="rounded-md border border-slate-200 bg-white p-3">
        {!linked && (
          <button
            onClick={async () => {
              try {
                const data = await api("/storage/google/connect-url", { headers });
                window.location.href = data.url;
              } catch (e) {
                setMessage(toUserMessage(e));
              }
            }}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Link Google Account
          </button>
        )}
        {linked && mode === "oauth" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                await api("/storage/google/disconnect", { method: "DELETE", headers });
                await load();
              }}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Disconnect
            </button>
            <button
              onClick={load}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        )}
        {linked && mode === "service_account" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              Service Account Connected
            </span>
            <button
              onClick={load}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        )}
      </article>

      {linked && (
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!canUpload}
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Upload File
            </button>
            <button
              disabled
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500"
              title="Folder support is planned for a future release."
            >
              Create Folder
            </button>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search files"
              className="h-9 min-w-[220px] rounded-md border border-slate-300 px-3 text-sm"
            />
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as SortMode);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-300 px-3 text-sm"
            >
              <option value="NEWEST">Sort: Newest</option>
              <option value="OLDEST">Sort: Oldest</option>
              <option value="NAME_ASC">Sort: Name A-Z</option>
              <option value="NAME_DESC">Sort: Name Z-A</option>
              <option value="SIZE_DESC">Sort: Largest</option>
            </select>
          </div>
        </article>
      )}

      {linked && (
        <article className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Uploaded Date</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedFiles.map((file) => {
                const type = getFileTypeLabel(file);
                return (
                  <tr key={file.id || `${file.name}`} className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 text-slate-900">
                        <FileTypeIcon type={type} />
                        <button
                          onClick={() => openFile(file)}
                          className="truncate text-left hover:underline"
                          title={String(file.name || "")}
                        >
                          {file.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{type}</td>
                    <td className="px-3 py-2 text-slate-600">{formatSize(file.size)}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openFile(file)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          Download
                        </button>
                        {canManage && (
                          <button
                            onClick={() => deleteFile(file)}
                            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredFiles.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                    {loading ? "Loading files..." : "No files found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!!filteredFiles.length && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>
                Showing {(safePage - 1) * pageSize + 1}-
                {Math.min(safePage * pageSize, filteredFiles.length)} of{" "}
                {filteredFiles.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </article>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleUploadSubmit}
            className="w-full max-w-lg rounded-md bg-white p-4 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Upload Resource</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`rounded px-3 py-1 text-sm ${
                  uploadMode === "file" ? "bg-blue-700 text-white" : "bg-slate-100"
                }`}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("note")}
                className={`rounded px-3 py-1 text-sm ${
                  uploadMode === "note" ? "bg-blue-700 text-white" : "bg-slate-100"
                }`}
              >
                Quick Note
              </button>
            </div>

            {uploadMode === "file" ? (
              <>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select file
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
                  className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                  placeholder="Filename (e.g. notes.txt)"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                  rows={5}
                  placeholder="Write your note"
                />
              </>
            )}
            <div className="flex justify-end">
              <button
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                data-keep-action-text="true"
              >
                {uploadMode === "file" ? "Upload File" : "Upload Note"}
              </button>
            </div>
          </form>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl rounded-md bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="truncate text-base font-semibold text-slate-900">{previewName}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>
            {!previewUrl && (
              <p className="text-sm text-slate-500">Preview is not available for this file.</p>
            )}
            {!!previewUrl && previewMime.startsWith("image/") && (
              <div className="max-h-[70vh] overflow-auto rounded border border-slate-200 p-2">
                <img src={previewUrl} alt={previewName} className="mx-auto max-h-[66vh] object-contain" />
              </div>
            )}
            {!!previewUrl && previewMime === "application/pdf" && (
              <iframe
                title={previewName}
                src={previewUrl}
                className="h-[70vh] w-full rounded border border-slate-200"
              />
            )}
            {!!previewUrl && previewMime.startsWith("video/") && (
              <video
                controls
                src={previewUrl}
                className="max-h-[70vh] w-full rounded border border-slate-200"
              />
            )}
            {!!previewUrl &&
              !previewMime.startsWith("image/") &&
              previewMime !== "application/pdf" &&
              !previewMime.startsWith("video/") && (
                <div className="rounded border border-slate-200 p-3 text-sm text-slate-600">
                  Preview is not supported for this file type. Use Download.
                </div>
              )}
          </div>
        </div>
      )}
    </section>
  );
}
