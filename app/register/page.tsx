"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await register(form.username, form.password, form.email);
      if (data.tokens) {
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
        document.cookie = `access_token=${data.tokens.access}; path=/`;
        localStorage.setItem("is_admin", "false");
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

        <p className="text-sm text-center mt-5" style={{ color: "var(--text-3)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--text-2)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
