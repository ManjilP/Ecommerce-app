"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { XCircle, RotateCcw, ShoppingBag } from "lucide-react"
import Image from "next/image"

export default function EsewaFailurePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
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

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
          <XCircle size={52} className="mx-auto mb-4 text-destructive" />
        </motion.div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Payment failed</h1>
        <p className="text-sm text-muted-foreground mb-8">Your eSewa payment was not completed. Please try again.</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <RotateCcw size={15} /> Try again
          </button>
          <button
            onClick={() => router.push("/landing")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted text-foreground font-semibold text-sm hover:bg-border transition-colors"
          >
            <ShoppingBag size={15} /> Back to shop
          </button>
        </div>
      </motion.div>
    </div>
  )
}
