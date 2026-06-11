"use client"

import { useState, useEffect, useRef } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"



const ESEWA_URL = process.env.NEXT_PUBLIC_ESEWA_URL!;


interface Props {
  orderId: number
  amount: number
  onClose: () => void
}

export default function EsewaPayment({ orderId, amount, onClose }: Props) {
  const [fields, setFields] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    fetch("/api/payment/esewa/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, orderId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setFields(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [amount, orderId])

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)" }}>
      <div style={{ width: "100%", maxWidth: "400px", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/esewa.png" alt="eSewa" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Pay with eSewa</h2>
              <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Rs. {amount.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0", color: "var(--text-2)", gap: "10px" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span>Preparing payment…</span>
          </div>
        )}

        {error && (
          <p style={{ color: "var(--red)", fontSize: "14px", textAlign: "center", padding: "16px 0" }}>{error}</p>
        )}

        {!loading && !error && fields && (
          <>
            <form ref={formRef} action={ESEWA_URL} method="POST" style={{ display: "none" }}>
              {Object.entries(fields).map(([key, val]) => (
                <input key={key} type="hidden" name={key} value={val} />
              ))}
            </form>

            <button
              onClick={() => formRef.current?.submit()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "52px", borderRadius: "99px", fontSize: "15px", fontWeight: 700, color: "#fff", background: "#60BB46", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(96,187,70,0.35)" }}
            >
              <ExternalLink size={16} /> Continue to eSewa
            </button>

            <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "12px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Sandbox test account</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>📱 9711111111</span>
                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>🔑 Nepal@123 / MPIN: 1122</span>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
