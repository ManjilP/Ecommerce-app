"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react"

function KhaltiSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying")
  const [transactionId, setTransactionId] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const pidx = searchParams.get("pidx")
    const status = searchParams.get("status")
    const orderId = searchParams.get("purchase_order_id")

    if (!pidx || status !== "Completed") {
      setErrorMsg("Payment was not completed.")
      setState("error")
      return
    }

    fetch("/api/payment/khalti/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidx, orderId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactionId(data.transaction_id)
          setState("success")
        } else {
          setErrorMsg("Payment verification failed.")
          setState("error")
        }
      })
      .catch(() => {
        setState("success")
      })
  }, [searchParams])

  return (
    <div style={{ width: "100%", maxWidth: "440px", borderRadius: "24px", padding: "40px 32px", background: "var(--bg-elevated)", border: "1px solid var(--border)", textAlign: "center" }}>

      {state === "verifying" && (
        <>
          <Loader2 size={48} style={{ margin: "0 auto 20px", color: "#5C2D91", animation: "spin 1s linear infinite" }} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>Verifying payment…</h1>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle size={56} style={{ margin: "0 auto 20px", color: "var(--green)" }} />
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Payment successful!</h1>
          <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "24px" }}>Your Khalti payment is confirmed.</p>
          {transactionId && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--card-2)", border: "1px solid var(--border)", marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", marginBottom: "4px" }}>Transaction ID</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", fontFamily: "monospace" }}>{transactionId}</p>
            </div>
          )}
          <button onClick={() => router.push("/orders")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "#5C2D91", border: "none", cursor: "pointer" }}>
            View my orders <ArrowRight size={16} />
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <XCircle size={56} style={{ margin: "0 auto 20px", color: "var(--red)" }} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Something went wrong</h1>
          <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "24px" }}>{errorMsg}</p>
          <button onClick={() => router.push("/")} style={{ width: "100%", height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer" }}>
            Back to shop
          </button>
        </>
      )}
    </div>
  )
}

export default function KhaltiSuccessPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
      <Suspense fallback={<Loader2 size={48} style={{ color: "#5C2D91", animation: "spin 1s linear infinite" }} />}>
        <KhaltiSuccessContent />
      </Suspense>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
