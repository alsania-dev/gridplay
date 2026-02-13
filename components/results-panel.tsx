"use client"

import { Trophy, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuarterScore, BoardType } from "@/lib/types"
import { PAYOUT_STRUCTURE, calculatePotTotal, calculatePayout } from "@/lib/game"

interface ResultsPanelProps {
  scores: QuarterScore[]
  winningQuarters: number[]
  boardType: BoardType
  squarePrice: number
  quarterLabels: string[]
}

export function ResultsPanel({
  scores,
  winningQuarters,
  boardType,
  squarePrice,
  quarterLabels,
}: ResultsPanelProps) {
  const potTotal = calculatePotTotal(boardType, squarePrice)
  const houseCut = potTotal * PAYOUT_STRUCTURE.house

  if (scores.length === 0) return null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[color:var(--gp-winner)]" />
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
          Results
        </h3>
      </div>

      {/* Pot info */}
      <div className="flex items-center justify-between rounded-lg bg-[var(--gp-surface)] px-4 py-3">
        <span className="text-sm text-muted-foreground">Total Pot</span>
        <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[color:var(--gp-neon)]">
          ${potTotal.toFixed(2)}
        </span>
      </div>

      {/* Quarter results */}
      <div className="flex flex-col gap-2">
        {scores.map((score, i) => {
          const isWinner = winningQuarters.includes(i)
          const payout = calculatePayout(potTotal, i, PAYOUT_STRUCTURE)
          const label = quarterLabels[i] || `Q${i + 1}`

          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3",
                isWinner
                  ? "border-[var(--gp-winner)]/30 bg-[var(--gp-winner)]/5"
                  : "border-border bg-background"
              )}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
                <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold">
                  {score.away} - {score.home}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isWinner && (
                  <span className="rounded-full bg-[var(--gp-winner)]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--gp-winner)]">
                    You Won
                  </span>
                )}
                <div className="flex items-center gap-0.5 text-sm font-semibold text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  {payout.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* House cut */}
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>House cut ({(PAYOUT_STRUCTURE.house * 100).toFixed(0)}%)</span>
        <span>${houseCut.toFixed(2)}</span>
      </div>
    </div>
  )
}
