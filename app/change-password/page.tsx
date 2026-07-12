"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { KeyRound, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"
import api from "@/lib/api"

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    if (form.new_password !== form.confirm_password) { setError("New passwords do not match."); return }
    setSaving(true)
    try {
      await api.post("/api/auth/change-password/", form)
      setSuccess(true)
      setForm({ old_password: "", new_password: "", confirm_password: "" })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      setError(data ? Object.values(data).flat().join(" ") : "Failed to change password.")
    } finally { setSaving(false) }
  }

  const fields = [
    { key: "old_password" as const, label: "Current Password", show: showOld, toggle: () => setShowOld(!showOld) },
    { key: "new_password" as const, label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
    { key: "confirm_password" as const, label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
            <KeyRound size={24} className="text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Change Password</h1>
          <p className="text-muted-foreground text-sm mt-2">Update your account password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-7">
          {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-accent border border-primary/20 text-primary text-sm font-medium">
              <CheckCircle size={16} className="flex-shrink-0" /> Password changed successfully.
            </div>
          )}
          {error && (
            <div className="mb-5 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {fields.map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 44px 11px 14px",
                      borderRadius: "12px",
                      border: "1px solid #d4e8d4",
                      background: "#ffffff",
                      color: "#1a1a1a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {saving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

        <div className="text-center mt-5">
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to shop
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
