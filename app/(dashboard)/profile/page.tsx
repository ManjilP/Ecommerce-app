"use client";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import { User, Mail, Shield, Calendar, Clock, KeyRound } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: "admin" | "customer";
  date_joined: string;
  last_login: string | null;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--text-2)" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "2px" }}>{label}</p>
        <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--text)" }}>{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((r) => setUser(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--text-3)", fontSize: "16px" }}>Loading...</p>;
  if (!user) return <p style={{ color: "var(--red)", fontSize: "16px" }}>Failed to load profile.</p>;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Profile</h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>Your account information</p>
      </div>

      {/* Avatar + name card */}
      <div style={{ borderRadius: "20px", padding: "28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "99px", background: `linear-gradient(135deg, var(--accent), rgba(16,185,129,0.5))`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}>{initials}</span>
        </div>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{user.username}</h2>
          <span style={{ fontSize: "13px", fontWeight: 600, padding: "3px 12px", borderRadius: "99px", background: user.role === "admin" ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", color: user.role === "admin" ? "#f59e0b" : "var(--accent)" }}>
            {user.role === "admin" ? "Administrator" : "Customer"}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div style={{ borderRadius: "20px", padding: "8px 24px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", marginBottom: "16px" }}>
        <InfoRow icon={<User size={17} />} label="Username" value={user.username} />
        <InfoRow icon={<Mail size={17} />} label="Email address" value={user.email} />
        <InfoRow icon={<Shield size={17} />} label="Role" value={user.role === "admin" ? "Administrator" : "Customer"} />
        <InfoRow icon={<Calendar size={17} />} label="Member since" value={new Date(user.date_joined).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
        <div style={{ borderBottom: "none" }}>
          <InfoRow icon={<Clock size={17} />} label="Last login" value={user.last_login ? new Date(user.last_login).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
        </div>
      </div>

      {/* Actions */}
      {user.role !== "admin" && (
        <Link href="/change-password" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 24px", borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", textDecoration: "none", color: "var(--text)", transition: "border-color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <KeyRound size={17} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>Change Password</p>
            <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>Update your account password</p>
          </div>
        </Link>
      )}
    </div>
  );
}
