﻿"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { vendorLogin } from "@/lib/api";
import { ShieldCheck, AlertCircle, LogIn } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await vendorLogin(username, password);
      sessionStorage.setItem("access_token", data.access);
      sessionStorage.setItem("refresh_token", data.refresh);
      sessionStorage.setItem("is_admin", "true");
      sessionStorage.setItem("username", username);
      if (data.store?.slug) sessionStorage.setItem("tenant_slug", data.store.slug);
      sessionStorage.removeItem("orders_cache");
      document.cookie = `access_token=${data.access}; path=/`;
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "99px", background: "radial-gradient(circle, var(--orange) 0%, transparent 70%)", opacity: 0.08, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "450px", height: "450px", borderRadius: "99px", background: "radial-gradient(circle, var(--blue) 0%, transparent 70%)", opacity: 0.06, filter: "blur(40px)" }} />
      </div>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 16px" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "var(--card-2)", border: "1px solid var(--border-strong)" }}>
            <ShieldCheck size={24} color="var(--orange)" />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Vendor Portal</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Sign in to your vendor account</p>
        </div>

        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
          {error && (
            <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--red)", fontSize: "15px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "50px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "var(--card)", background: "var(--orange)", opacity: loading ? 0.6 : 1, border: "none", cursor: "pointer", marginTop: "8px" }}
            >
              <LogIn size={18} />
              {loading ? "Signing in..." : "Vendor Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-3)" }}>
            Not a vendor?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

