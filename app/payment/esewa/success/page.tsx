"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { confirmPayment } from "@/lib/api"
import { CheckCircle, XCircle, Loader2, ArrowRight, Package } from "lucide-react"
import Image from "next/image"

function EsewaSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying")
  const [transactionId, setTransactionId] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const encodedData = searchParams.get("data")
    if (!encodedData) { setErrorMsg("No payment data received."); setState("error"); return }

    try {
      const decoded = JSON.parse(atob(encodedData))
      const txId = decoded.transaction_code
      const orderId = decoded.transaction_uuid?.split("-")[0]
      setTransactionId(txId)
      confirmPayment(Number(orderId), txId)
        .then(() => setState("success"))
        .catch(() => {
          setErrorMsg(`Payment received (transaction ${txId}) but we couldn't confirm your order automatically. Please contact support with this transaction ID.`)
          setState("error")
        })
    } catch {
      setErrorMsg("Failed to read payment response.")
      setState("error")
    }
  }, [searchParams])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-border p-10 text-center"
    >
      {/* eSewa logo */}
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center p-1.5">
          <Image src="/esewa.png" alt="eSewa" width={44} height={44} className="object-contain" />
        </div>
      </div>

      {state === "verifying" && (
        <>
          <Loader2 size={40} className="mx-auto mb-4 text-primary animate-spin" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Verifying payment…</h1>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we confirm your eSewa payment.</p>
        </>
      )}

      {state === "success" && (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
            <CheckCircle size={52} className="mx-auto mb-4 text-primary" />
          </motion.div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Payment successful!</h1>
          <p className="text-sm text-muted-foreground mb-6">Your eSewa payment has been confirmed.</p>
          {transactionId && (
            <div className="bg-muted rounded-2xl p-4 mb-6 text-left">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transaction ID</p>
              <p className="text-sm font-semibold text-foreground font-mono">{transactionId}</p>
            </div>
          )}
          <button
            onClick={() => router.push("/my-orders")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <Package size={16} /> View my orders <ArrowRight size={15} />
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <XCircle size={52} className="mx-auto mb-4 text-destructive" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/landing")}
            className="w-full py-3.5 rounded-xl border border-border bg-muted text-foreground font-semibold text-sm hover:bg-border transition-colors"
          >
            Back to shop
          </button>
        </>
      )}
    </motion.div>
  )
}

export default function EsewaSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Suspense fallback={<Loader2 size={40} className="text-primary animate-spin" />}>
        <EsewaSuccessContent />
      </Suspense>
    </div>
  )
}
