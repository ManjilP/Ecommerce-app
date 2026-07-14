"use client"

import { useState } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"

interface Props {
  orderId: number
  amount: number
  onClose: () => void
}

export default function KhaltiPayment({ orderId, amount, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePay = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payment/khalti/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, orderId }),
      })
      const data = await res.json()

      if (!res.ok || !data.payment_url) throw new Error("Failed to initiate payment")

      window.location.href = data.payment_url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to initiate payment")
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)" }}>
      <div style={{ width: "100%", maxWidth: "400px", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/khalti.png" alt="Khalti" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Pay with Khalti</h2>
              <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Rs. {amount.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--red)", fontSize: "14px", textAlign: "center", padding: "8px 0" }}>{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "52px", borderRadius: "99px", fontSize: "15px", fontWeight: 700, color: "#fff", background: "#E63946", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 20px rgba(230,57,70,0.35)" }}
        >
          {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <ExternalLink size={16} />}
          {loading ? "Redirecting…" : "Continue to Khalti"}
        </button>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
