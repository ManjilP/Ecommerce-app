"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileImage, Upload, X, CheckCircle2, Loader2 } from "lucide-react"
import { uploadPrescription } from "@/lib/api"

interface Props {
  orderId: number
  onDone: () => void
  onClose: () => void
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024

export default function PrescriptionUpload({ orderId, onDone, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (f: File | null) => {
    setError("")
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Only JPEG, PNG, or GIF images are allowed.")
      return
    }
    if (f.size > MAX_SIZE) {
      setError("Image must be under 5MB.")
      return
    }
    setFile(f)
  }

  const handleRemove = () => {
    setFile(null)
    setError("")
    if (inputRef.current) inputRef.current.value = ""
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 backdrop-blur-md p-4">
      <div className="sm:mx-auto sm:max-w-lg flex items-center justify-center p-8 w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prescription required</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Order #{orderId} contains a prescription-only item</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="h-8 w-8 shrink-0">
              <X className="size-4" />
            </Button>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden={true} />
              <p className="text-sm font-medium text-foreground">Prescription uploaded</p>
            </div>
          ) : !file ? (
            <>
              <div className="mt-4 flex justify-center space-x-4 rounded-md border border-dashed border-input px-6 py-10">
                <div className="sm:flex sm:items-center sm:gap-x-3">
                  <Upload
                    className="mx-auto h-8 w-8 text-muted-foreground sm:mx-0 sm:h-6 sm:w-6"
                    aria-hidden={true}
                  />
                  <div className="mt-4 flex text-sm leading-6 text-foreground sm:mt-0">
                    <Label
                      htmlFor="prescription-upload-input"
                      className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                    >
                      <span> Drag and drop or choose file to upload </span>
                      <input
                        ref={inputRef}
                        id="prescription-upload-input"
                        name="prescription-upload-input"
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        className="sr-only"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      />
                    </Label>
                  </div>
                </div>
              </div>
              <p className="mt-2 flex items-center justify-between text-xs leading-5 text-muted-foreground">
                Recommended max. size: 5 MB, Accepted file types: JPEG, PNG, GIF.
              </p>
            </>
          ) : (
            <div className="relative mt-8 rounded-lg bg-muted p-3">
              <div className="absolute right-1 top-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-sm p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Remove"
                  onClick={handleRemove}
                >
                  <X className="size-4 shrink-0" aria-hidden={true} />
                </Button>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-background shadow-sm ring-1 ring-inset ring-input">
                  <FileImage className="size-5 text-foreground" aria-hidden={true} />
                </span>
                <div className="w-full min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="mt-0.5 flex justify-between text-xs text-muted-foreground">
                    <span>{file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`}</span>
                    <span>{uploading ? "Uploading…" : "Ready"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          {!success && (
            <div className="mt-8 flex items-center justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                I&apos;ll upload later
              </Button>
              <Button type="button" variant="default" disabled={!file || uploading} onClick={handleUpload}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : "Upload"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
