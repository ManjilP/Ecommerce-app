"use client"

import { useState } from "react"

interface RankedBarRowProps {
  label: string
  value: number
  max: number
  color: string
  valueLabel: string
}

/** Single row in a ranked horizontal bar list — magnitude compared across categories. */
export function RankedBarRow({ label, value, max, color, valueLabel }: RankedBarRowProps) {
  const [hover, setHover] = useState(false)
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "99px",
            height: "8px",
            background: "var(--border-strong)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${pct}%`,
              borderRadius: "99px",
              background: color,
              opacity: hover ? 1 : 0.85,
              transition: "width 0.3s ease, opacity 0.15s ease",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-3)", width: "38px", textAlign: "right", flexShrink: 0 }}>
          {Math.round(pct)}%
        </span>
      </div>

      {hover && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            background: "var(--text)",
            color: "var(--bg)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 9px",
            borderRadius: "8px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {label}: {valueLabel}
        </div>
      )}
    </div>
  )
}

interface TrendBarChartPoint {
  label: string
  value: number
}

interface TrendBarChartProps {
  data: TrendBarChartPoint[]
  color: string
  height?: number
  formatValue?: (v: number) => string
}

/** Vertical bar chart for a value trending over time, with per-bar hover tooltip. */
export function TrendBarChart({ data, color, height = 120, formatValue }: TrendBarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  const fmt = formatValue ?? ((v: number) => v.toLocaleString())

  if (data.length === 0) return null

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: `${height}px` }}>
        {data.map((d, i) => {
          const h = Math.max(3, Math.round((d.value / max) * height))
          const isHover = hoverIdx === i
          return (
            <div
              key={`${d.label}-${i}`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", position: "relative", cursor: "default" }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${h}px`,
                  borderRadius: "4px 4px 0 0",
                  background: color,
                  opacity: hoverIdx === null || isHover ? 1 : 0.45,
                  transition: "opacity 0.15s ease, height 0.3s ease",
                }}
              />
              {isHover && (
                <div
                  role="tooltip"
                  style={{
                    position: "absolute",
                    bottom: `calc(${h}px + 8px)`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--text)",
                    color: "var(--bg)",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: "8px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {d.label}
                  <span style={{ opacity: 0.7, marginLeft: "6px" }}>{fmt(d.value)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
