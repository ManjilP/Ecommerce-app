"use client"

import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"

export default function EsewaFailurePage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px", borderRadius: "24px", padding: "40px 32px", background: "var(--bg-elevated)", border: "1px solid var(--border)", textAlign: "center" }}>
        <XCircle size={56} style={{ margin: "0 auto 20px", color: "var(--red)" }} />
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Payment failed</h1>
        <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "24px" }}>Your payment was not completed.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => router.back()} style={{ width: "100%", height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "#60BB46", border: "none", cursor: "pointer" }}>
            Try again
          </button>
          <button onClick={() => router.push("/")} style={{ width: "100%", height: "44px", borderRadius: "99px", fontSize: "14px", color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer" }}>
            Back to shop
          </button>
        </div>
      </div>
    </div>
  )
}

