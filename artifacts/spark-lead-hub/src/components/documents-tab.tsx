import { useState, useRef } from "react";
import { FileText, Upload, Trash2, ExternalLink, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_BASE = `${BASE_URL}/api`;
const STORAGE_BASE = `${BASE_URL}/api/storage`;

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mimeType: string | null | undefined): string {
  if (!mimeType) return "📎";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📊";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "🗜️";
  return "📎";
}

interface Document {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedAt: string;
  uploadedBy?: string | null;
  uploaderName?: string | null;
  stage?: string | null;
  status?: string | null;
  noteId?: string | null;
}

interface DocumentsTabProps {
  leadId: string;
  leadStageName?: string | null;
  leadStatusName?: string | null;
  token: string;
}

function useLeadDocuments(leadId: string, token: string) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  return { docs, setDocs, loading, loaded, fetchDocs };
}

export function DocumentsTab({ leadId, leadStageName, leadStatusName, token }: DocumentsTabProps) {
  const { docs, setDocs, loading, loaded, fetchDocs } = useLeadDocuments(leadId, token);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch on first render
  if (!loaded && !loading) {
    fetchDocs();
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      try {
        // Step 1: Get presigned URL
        const urlRes = await fetch(`${STORAGE_BASE}/uploads/request-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });

        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath } = await urlRes.json();

        // Step 2: Upload to GCS
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        // Step 3: Save document record
        const serveUrl = `${STORAGE_BASE}${objectPath}`;
        const docRes = await fetch(`${API_BASE}/leads/${leadId}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: serveUrl,
            fileSize: file.size,
            mimeType: file.type || null,
            stage: leadStageName || null,
            status: leadStatusName || null,
          }),
        });

        if (!docRes.ok) throw new Error("Failed to save document");
        const newDoc = await docRes.json();
        setDocs((prev) => [newDoc, ...prev]);
        successCount++;
      } catch (err) {
        console.error("Upload error:", err);
        errorCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
    if (errorCount > 0) toast.error(`${errorCount} file${errorCount > 1 ? "s" : ""} failed to upload`);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Document deleted");
      }
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>

      {/* Upload button */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
          accept="*/*"
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          type="button"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? "Uploading…" : "Upload Files"}
        </button>
        {/* Context chips — what stage/status will be tagged on uploaded files */}
        {(leadStageName || leadStatusName) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {leadStageName && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600,
                background: "hsl(258 65% 55% / 0.12)",
                color: "hsl(258 80% 75%)",
                border: "1px solid hsl(258 65% 55% / 0.25)",
                borderRadius: 6, padding: "3px 9px",
              }}>
                📍 {leadStageName}
              </span>
            )}
            {leadStatusName && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600,
                background: "hsl(172 75% 48% / 0.10)",
                color: "var(--teal)",
                border: "1px solid hsl(172 75% 48% / 0.25)",
                borderRadius: 6, padding: "3px 9px",
              }}>
                📌 {leadStatusName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Document list */}
      {loading && !loaded ? (
        <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={16} className="spin" style={{ marginBottom: 4 }} />
          <div>Loading documents…</div>
        </div>
      ) : docs.length === 0 ? (
        <div style={{
          padding: "var(--sp-10)", textAlign: "center",
          color: "var(--text-muted)", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "var(--sp-3)",
        }}>
          <FolderOpen size={32} style={{ opacity: 0.22 }} />
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>No documents uploaded yet</div>
          <div style={{ fontSize: "var(--text-xs)", maxWidth: 240, lineHeight: 1.5 }}>
            Upload proposals, agreements, or supporting files for this lead.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex", alignItems: "center", gap: "var(--sp-3)",
                padding: "var(--sp-3) var(--sp-4)",
                background: "hsl(222, 20%, 12% / 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{getMimeIcon(doc.mimeType)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {doc.fileName}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  {doc.stage && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: "hsl(258 65% 55% / 0.12)", color: "hsl(258 80% 78%)",
                      border: "1px solid hsl(258 65% 55% / 0.22)",
                      borderRadius: 5, padding: "1px 7px", fontWeight: 600, fontSize: "10px",
                    }}>
                      📍 {doc.stage}
                    </span>
                  )}
                  {doc.status && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: "hsl(172 75% 48% / 0.10)", color: "var(--teal)",
                      border: "1px solid hsl(172 75% 48% / 0.22)",
                      borderRadius: 5, padding: "1px 7px", fontWeight: 600, fontSize: "10px",
                    }}>
                      📌 {doc.status}
                    </span>
                  )}
                  {(doc.stage || doc.status) && doc.fileSize && (
                    <span style={{ color: "hsl(222 15% 45%)" }}>·</span>
                  )}
                  {doc.fileSize && (
                    <span style={{ color: "hsl(222 15% 55%)", fontWeight: 500 }}>{formatFileSize(doc.fileSize)}</span>
                  )}
                  <span style={{ color: "hsl(222 15% 45%)" }}>·</span>
                  <span style={{ color: "hsl(222 15% 55%)" }}>{format(new Date(doc.uploadedAt), "d MMM yyyy, h:mm a")}</span>
                  {doc.uploaderName && (
                    <><span style={{ color: "hsl(222 15% 45%)" }}>·</span>
                    <span style={{ color: "hsl(222 15% 60%)", fontWeight: 500 }}>{doc.uploaderName}</span></>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--sp-1)", flexShrink: 0 }}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 8px" }}
                  title="View / Download"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 8px", color: "hsl(0 70% 60%)" }}
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  title="Delete"
                  type="button"
                >
                  {deletingId === doc.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
