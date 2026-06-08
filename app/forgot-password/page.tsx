"use client";
import { useState } from "react";
import { forgotPassword } from "@/lib/api";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Something went wrong. Please try again.");
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
            <Mail size={24} color="#0e7490" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>Forgot password</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px", textAlign: "center" }}>Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "12px 0", textAlign: "center" }}>
              <CheckCircle size={40} color="#059669" />
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Check your email</p>
              <p style={{ fontSize: "14px", color: "var(--text-2)" }}>If an account exists for <strong>{email}</strong>, a password reset link has been sent.</p>
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
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={loading} style={{ height: "50px", borderRadius: "99px", fontSize: "16px", fontWeight: 600, color: "#fff", background: loading ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: loading ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                  onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}>
                  {loading ? "Sending..." : "Send reset link"}
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
