"use client"

import { useState, useRef } from "react"
import { X, Upload, Loader2, FileImage, CheckCircle } from "lucide-react"
import { uploadPrescription } from "@/lib/api"

interface Props {
  orderId: number
  onDone: () => void
  onClose: () => void
}

export default function PrescriptionUpload({ orderId, onDone, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (f: File | null) => {
    setError("")
    if (!f) { setFile(null); return }
    if (!["image/jpeg", "image/png", "image/gif"].includes(f.type)) {
      setError("Only JPEG, PNG, or GIF images are allowed.")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.")
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      await uploadPrescription(orderId, file)
      setSuccess(true)
      setTimeout(onDone, 1200)
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, unknown> } }
      const detail = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Upload failed. Please try again."
      setError(detail || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)" }}>
      <div style={{ width: "100%", maxWidth: "420px", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Prescription required</h2>
            <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>Order #{orderId} contains a prescription-only item</p>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: "10px" }}>
            <CheckCircle size={40} className="text-primary" />
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Prescription uploaded</p>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />

            <button
              onClick={() => inputRef.current?.click()}
              style={{ width: "100%", padding: "24px", borderRadius: "16px", border: "1.5px dashed var(--border-strong)", background: "var(--card-2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
            >
              <FileImage size={24} color="var(--text-3)" />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>
                {file ? file.name : "Choose prescription image"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>JPEG, PNG, or GIF — max 5MB</span>
            </button>

            {error && (
              <p style={{ color: "var(--red)", fontSize: "13px", textAlign: "center", marginTop: "14px" }}>{error}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "48px", borderRadius: "99px", fontSize: "14px", fontWeight: 700, color: "#fff", background: !file || uploading ? "var(--border-strong)" : "var(--accent)", border: "none", cursor: !file || uploading ? "not-allowed" : "pointer", marginTop: "16px" }}
            >
              {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Upload prescription"}
            </button>

            <button
              onClick={onClose}
              style={{ width: "100%", textAlign: "center", marginTop: "10px", fontSize: "12px", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}
            >
              I'll upload this later from My Orders
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
