﻿"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { Eye, EyeOff, AlertCircle, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", city: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [cityPopup, setCityPopup] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [pendingGoogleToken, setPendingGoogleToken] = useState("");

  const finishGoogleSignup = async (accessToken: string, city: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Google sign up failed");
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.removeItem("orders_cache");
      localStorage.setItem("is_admin", "false");
      if (city) localStorage.setItem("delivery_city", city);
      document.cookie = `access_token=${data.access}; path=/`;
      router.push("/landing");
    } catch {
      setError("Google sign up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
      setCityPopup(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setPendingGoogleToken(tokenResponse.access_token);
      setCityInput("");
      setCityPopup(true);
    },
    onError: () => setError("Google sign up failed. Please try again."),
  });

  const handleRegister = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await register(form.username, form.password, form.email, form.city);
      if (data.tokens) {
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
        document.cookie = `access_token=${data.tokens.access}; path=/`;
        localStorage.setItem("is_admin", "false");
        if (form.city) localStorage.setItem("delivery_city", form.city);
        router.push("/orders");
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setError(msg ? Object.values(msg).flat().join(" ") : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "500px", height: "500px", borderRadius: "99px", background: "radial-gradient(circle, rgba(14,116,144,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "450px", height: "450px", borderRadius: "99px", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="w-full max-w-sm px-4 relative">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(14,116,144,0.3), rgba(14,116,144,0.1))", border: "1px solid rgba(14,116,144,0.3)", boxShadow: "0 0 40px rgba(14,116,144,0.15)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Create account</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-2)" }}>Inventory Manager</p>
        </div>

        <div className="rounded-3xl p-7" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
          {error && (
            <div className="mb-5 text-sm rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{ paddingRight: "40px" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>Delivery City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Kathmandu"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", height: "50px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: loading ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: loading ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-3)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <button
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading}
          style={{ marginTop: "12px", width: "100%", height: "50px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "var(--text)", background: "var(--card)", border: "1px solid var(--border)", cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s", opacity: googleLoading ? 0.7 : 1 }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = "var(--card-2)"; }}
          onMouseLeave={e => { if (!googleLoading) e.currentTarget.style.background = "var(--card)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleLoading ? "Signing up..." : "Continue with Google"}
        </button>

        <p className="text-sm text-center mt-5" style={{ color: "var(--text-3)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--text-2)" }}>Sign in</Link>
        </p>
      </div>

      {cityPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "380px", borderRadius: "24px", padding: "32px 28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)", margin: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,113,227,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={20} color="#0071E3" />
              </div>
              <button onClick={() => { setCityPopup(false); finishGoogleSignup(pendingGoogleToken, ""); }} style={{ width: "28px", height: "28px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)" }}><X size={14} /></button>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "6px", marginTop: "16px" }}>Set delivery location</h2>
            <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "20px" }}>Which city do you want your orders delivered to?</p>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="e.g. Kathmandu"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter" && cityInput.trim()) finishGoogleSignup(pendingGoogleToken, cityInput.trim()); }}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", background: "var(--card-2)", color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
            />
            <button
              onClick={() => finishGoogleSignup(pendingGoogleToken, cityInput.trim())}
              disabled={googleLoading}
              style={{ width: "100%", height: "46px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: googleLoading ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "none", cursor: googleLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {googleLoading ? "Creating account..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

