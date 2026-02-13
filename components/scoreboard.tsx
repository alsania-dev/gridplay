"use client"

import { cn } from "@/lib/utils"
import type { QuarterScore } from "@/lib/types"

interface ScoreboardProps {
  homeTeam: string
  awayTeam: string
  scores: QuarterScore[]
  currentQuarter: number
  quarterLabels: string[]
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  scores,
  currentQuarter,
  quarterLabels,
}: ScoreboardProps) {
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null

  return (
    <div className="flex flex-col gap-4">
      {/* Main scoreboard */}
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Away
          </span>
          <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold sm:text-xl">
            {awayTeam}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-border bg-[var(--gp-surface)] font-[family-name:var(--font-space-grotesk)] text-2xl font-bold sm:h-16 sm:w-20 sm:text-3xl">
            {latestScore?.away ?? 0}
          </div>
          <span className="text-lg font-bold text-muted-foreground">-</span>
          <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-border bg-[var(--gp-surface)] font-[family-name:var(--font-space-grotesk)] text-2xl font-bold sm:h-16 sm:w-20 sm:text-3xl">
            {latestScore?.home ?? 0}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Home
          </span>
          <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold sm:text-xl">
            {homeTeam}
          </span>
        </div>
      </div>

      {/* Quarter breakdown */}
      {scores.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {scores.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center rounded-lg border px-3 py-2 text-center sm:px-4",
                i === currentQuarter - 1
                  ? "border-[var(--gp-neon)]/50 bg-[var(--gp-neon)]/5"
                  : "border-border bg-card"
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {quarterLabels[i] || `Q${i + 1}`}
              </span>
              <span className="font-[family-name:var(--font-space-grotesk)] text-xs font-bold">
                {s.away}-{s.home}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
