import { useState, useRef } from "react";
import {
  File, FileText, FileSpreadsheet, FileImage, FileVideo, FileAudio, FileArchive,
  Presentation, CloudUpload, Trash2, ExternalLink, Download, Loader2, FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLeadActivitiesQueryKey } from "@workspace/api-client-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_BASE = `${BASE_URL}/api`;
const STORAGE_BASE = `${BASE_URL}/api/storage`;

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeMeta(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): { Icon: LucideIcon; className: string; label: string } {
  const mime = (mimeType || "").toLowerCase();
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";

  if (mime === "application/pdf" || ext === "pdf")
    return { Icon: FileText, className: "ft-pdf", label: "PDF document" };
  if (mime.includes("word") || mime.includes("msword") || ["doc", "docx", "rtf", "odt"].includes(ext))
    return { Icon: FileText, className: "ft-doc", label: "Word document" };
  if (mime.includes("sheet") || mime.includes("excel") || mime === "text/csv" || ["xls", "xlsx", "csv", "ods"].includes(ext))
    return { Icon: FileSpreadsheet, className: "ft-sheet", label: "Spreadsheet" };
  if (mime.includes("presentation") || mime.includes("powerpoint") || ["ppt", "pptx", "odp"].includes(ext))
    return { Icon: Presentation, className: "ft-slides", label: "Presentation" };
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext))
    return { Icon: FileImage, className: "ft-image", label: "Image" };
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv"].includes(ext))
    return { Icon: FileVideo, className: "ft-video", label: "Video" };
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext))
    return { Icon: FileAudio, className: "ft-audio", label: "Audio" };
  if (mime.includes("zip") || mime.includes("archive") || mime.includes("compressed") || ["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return { Icon: FileArchive, className: "ft-archive", label: "Archive" };
  return { Icon: File, className: "ft-file", label: "File" };
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
  const queryClient = useQueryClient();

  // Keep the Timeline tab and any cached documents queries in sync
  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: getGetLeadActivitiesQueryKey(leadId) });
    queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/documents`] });
  };

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

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
      invalidateRelated();
    }
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
        invalidateRelated();
      } else {
        toast.error("Failed to delete document");
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
          title="Upload files to this lead"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {uploading ? <Loader2 size={14} className="spin" /> : <CloudUpload size={15} />}
          {uploading ? "Uploading…" : "Upload Files"}
        </button>
        {/* Context chips — what stage/status will be tagged on uploaded files */}
        {(leadStageName || leadStatusName) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {leadStageName && (
              <span className="docs-context-chip is-stage">📍 {leadStageName}</span>
            )}
            {leadStatusName && (
              <span className="docs-context-chip is-status">📌 {leadStatusName}</span>
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
        <div className="docs-list">
          {docs.map((doc) => {
            const { Icon, className, label } = getFileTypeMeta(doc.mimeType, doc.fileName);
            return (
              <div key={doc.id} className="docs-row">
                <span className={`docs-file-icon ${className}`} title={label} aria-label={label}>
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <div className="docs-info">
                  <div className="docs-name" title={doc.fileName}>{doc.fileName}</div>
                  <div className="docs-sub">
                    {doc.stage && (
                      <span className="docs-chip is-stage">📍 {doc.stage}</span>
                    )}
                    {doc.status && (
                      <span className="docs-chip is-status">📌 {doc.status}</span>
                    )}
                    {(doc.stage || doc.status) && doc.fileSize && (
                      <span className="docs-dot">·</span>
                    )}
                    {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                    <span className="docs-dot">·</span>
                    <span>{format(new Date(doc.uploadedAt), "d MMM yyyy, h:mm a")}</span>
                    {doc.uploaderName && (
                      <>
                        <span className="docs-dot">·</span>
                        <span>{doc.uploaderName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="docs-actions">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="docs-action-btn"
                    title="View Document"
                    aria-label={`View ${doc.fileName}`}
                  >
                    <ExternalLink size={15} />
                  </a>
                  <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    className="docs-action-btn"
                    title="Download Document"
                    aria-label={`Download ${doc.fileName}`}
                  >
                    <Download size={15} />
                  </a>
                  <button
                    className="docs-action-btn is-danger"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    title="Delete Document"
                    aria-label={`Delete ${doc.fileName}`}
                    type="button"
                  >
                    {deletingId === doc.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
