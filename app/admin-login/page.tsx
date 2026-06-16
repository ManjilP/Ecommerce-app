﻿"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";
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
      const { data } = await adminLogin(username, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("is_admin", "true");
      localStorage.removeItem("orders_cache");
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
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "99px", background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "450px", height: "450px", borderRadius: "99px", background: "radial-gradient(circle, rgba(14,116,144,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 16px" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <ShieldCheck size={24} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Admin Portal</h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Restricted to admin accounts only</p>
        </div>

        <div style={{ borderRadius: "24px", padding: "28px", background: "var(--card)", border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
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
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "50px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: loading ? "rgba(217,119,6,0.6)" : "#d97706", border: "none", cursor: "pointer", marginTop: "8px", boxShadow: loading ? "none" : "0 0 24px rgba(217,119,6,0.3)" }}
            >
              <LogIn size={18} />
              {loading ? "Signing in..." : "Admin Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-3)" }}>
            Not an admin?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>User login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

