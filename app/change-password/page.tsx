"use client";
import { useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (form.new_password !== form.confirm_password) { setError("New passwords do not match."); return; }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password/", form);
      setSuccess(true);
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Failed to change password.");
    } finally { setSaving(false); }
  };

  const fields = [
    { key: "old_password" as const, label: "Current Password", show: showOld, toggle: () => setShowOld(!showOld) },
    { key: "new_password" as const, label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
    { key: "confirm_password" as const, label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "400px", height: "400px", borderRadius: "99px", background: "radial-gradient(circle, rgba(14,116,144,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "350px", height: "350px", borderRadius: "99px", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "400px", padding: "0 16px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "linear-gradient(135deg,rgba(14,116,144,0.15),rgba(14,116,144,0.05))", border: "1px solid rgba(14,116,144,0.2)" }}>
            <KeyRound size={22} color="#0e7490" />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Change Password</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Update your account password</p>
        </div>

        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {success && (
            <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", color: "var(--green)", fontSize: "15px" }}>
              <CheckCircle size={16} /> Password changed successfully.
            </div>
          )}
          {error && (
            <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--red)", fontSize: "15px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {fields.map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={show ? "text" : "password"}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: "44px" }}
                  />
                  <button type="button" onClick={toggle} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={saving} style={{ height: "50px", borderRadius: "99px", fontSize: "16px", fontWeight: 600, color: "#fff", background: saving ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: saving ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: saving ? "not-allowed" : "pointer", marginTop: "4px", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
              onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}>
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-3)" }}>
          <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: 500 }}>← Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
