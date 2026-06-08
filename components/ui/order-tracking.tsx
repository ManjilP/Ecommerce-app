"use client"

import * as React from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OrderTrackingProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    name: string
    timestamp: string
    isCompleted: boolean
  }[]
}

const OrderTracking = React.forwardRef<HTMLDivElement, OrderTrackingProps>(
  ({ steps = [], className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full max-w-md", className)} {...props}>
        {steps.length > 0 ? (
          <div>
            {steps.map((step, index) => (
              <div key={index} className="flex">
                <div className="flex flex-col items-center">
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: "#34d399" }} />
                  ) : (
                    <Circle className="h-6 w-6 shrink-0" style={{ color: "var(--border-strong)" }} />
                  )}
                  {index < steps.length - 1 && (
                    <div
                      className={cn("w-[1.5px] grow my-1")}
                      style={{
                        background: steps[index + 1].isCompleted ? "#34d39960" : "var(--border)",
                        minHeight: "24px",
                      }}
                    />
                  )}
                </div>
                <div className="ml-4 pb-5">
                  <p className="text-sm font-semibold" style={{ color: step.isCompleted ? "var(--text)" : "var(--text-3)" }}>
                    {step.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    {step.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No tracking information available.
          </p>
        )}
      </div>
    )
  }
)
OrderTracking.displayName = "OrderTracking"

export { OrderTracking }
