﻿"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { Eye, EyeOff, AlertCircle, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [cityPopup, setCityPopup] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [pendingGoogleToken, setPendingGoogleToken] = useState("");

  const finishGoogleLogin = async (accessToken: string, city: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Google login failed");
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.removeItem("orders_cache");
      if (city) localStorage.setItem("delivery_city", city);
      document.cookie = `access_token=${data.access}; path=/`;
      try {
        const payload = JSON.parse(atob(data.access.split(".")[1]));
        const isAdmin = !!(payload.is_staff || payload.is_superuser);
        localStorage.setItem("is_admin", String(isAdmin));
        router.push(isAdmin ? "/dashboard" : "/landing");
      } catch {
        localStorage.setItem("is_admin", "false");
        router.push("/");
      }
    } catch {
      setError("Google login failed. Please try again.");
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
    onError: () => setError("Google login failed. Please try again."),
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(username, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("username", username);
      localStorage.removeItem("orders_cache");
      document.cookie = `access_token=${data.access}; path=/`;
      let isAdmin = false;
      try {
        const payload = JSON.parse(atob(data.access.split(".")[1]));
        isAdmin = !!(payload.is_staff || payload.is_superuser);
        localStorage.setItem("is_admin", String(isAdmin));
      } catch { localStorage.setItem("is_admin", "false"); }
      router.push(isAdmin ? "/dashboard" : "/landing");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* Background blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "99px", background: "radial-gradient(circle, rgba(14,116,144,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "450px", height: "450px", borderRadius: "99px", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: "300px", height: "300px", borderRadius: "99px", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "380px", padding: "0 20px", position: "relative" }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "linear-gradient(135deg, rgba(14,116,144,0.15), rgba(14,116,144,0.05))", border: "1px solid rgba(14,116,144,0.2)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>Sign in</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Inventory Manager</p>
        </div>

        {/* Card "” lighter shadow */}
        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
          {error && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--red)", fontSize: "14px" }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ height: "50px", borderRadius: "99px", fontSize: "16px", fontWeight: 600, color: "#fff", background: loading ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: loading ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: loading ? "not-allowed" : "pointer", marginTop: "4px", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}>
              {loading ? "Signing in..." : "Sign in"}
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
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--text-3)" }}>
            No account?{" "}
            <Link href="/register" style={{ fontWeight: 600, color: "var(--text-2)", textDecoration: "none" }}>Create one</Link>
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-3)" }}>
            <Link href="/forgot-password" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Forgot password?</Link>
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-3)" }}>
            Admin?{" "}
            <Link href="/admin-login" style={{ fontWeight: 600, color: "#f59e0b", textDecoration: "none" }}>Admin login</Link>
          </p>
        </div>
      </div>
      {cityPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "380px", borderRadius: "24px", padding: "32px 28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)", margin: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,113,227,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={20} color="#0071E3" />
              </div>
              <button onClick={() => { setCityPopup(false); finishGoogleLogin(pendingGoogleToken, ""); }} style={{ width: "28px", height: "28px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)" }}><X size={14} /></button>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "6px", marginTop: "16px" }}>Set delivery location</h2>
            <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "20px" }}>Which city do you want your orders delivered to?</p>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="e.g. Kathmandu"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter" && cityInput.trim()) finishGoogleLogin(pendingGoogleToken, cityInput.trim()); }}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", background: "var(--card-2)", color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
            />
            <button
              onClick={() => finishGoogleLogin(pendingGoogleToken, cityInput.trim())}
              disabled={googleLoading}
              style={{ width: "100%", height: "46px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: googleLoading ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "none", cursor: googleLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {googleLoading ? "Signing in..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

