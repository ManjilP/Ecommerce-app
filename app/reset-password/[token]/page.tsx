"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, form.password, form.confirm_password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "99px", background: "radial-gradient(circle, rgba(14,116,144,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "450px", height: "450px", borderRadius: "99px", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "380px", padding: "0 20px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "linear-gradient(135deg, rgba(14,116,144,0.15), rgba(14,116,144,0.05))", border: "1px solid rgba(14,116,144,0.2)" }}>
            <KeyRound size={24} color="#0e7490" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>Set new password</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Choose a strong password</p>
        </div>

        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "12px 0", textAlign: "center" }}>
              <CheckCircle size={40} color="#059669" />
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Password reset!</p>
              <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--red)", fontSize: "14px" }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>New password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Confirm password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="••••••••" required style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ height: "50px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: loading ? "rgba(14,116,144,0.6)" : "var(--accent)", border: "none", cursor: "pointer", boxShadow: loading ? "none" : "0 4px 14px rgba(14,116,144,0.35)", transition: "all 0.15s" }}>
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-3)" }}>
          <Link href="/login" style={{ fontWeight: 600, color: "var(--text-2)", textDecoration: "none" }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
