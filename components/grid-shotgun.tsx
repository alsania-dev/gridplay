"use client"

import { cn } from "@/lib/utils"
import type { BoardSquare } from "@/lib/types"

interface GridShotgunProps {
  squares: BoardSquare[]
  columnNumbers: number[]
  onSquareClick: (index: number) => void
  isLocked: boolean
  quarterLabels: string[]
}

export function GridShotgun({
  squares,
  columnNumbers,
  onSquareClick,
  isLocked,
  quarterLabels,
}: GridShotgunProps) {
  // Shotgun: 2 rows of 10
  const halftimeSquares = squares.slice(0, 10)
  const finalSquares = squares.slice(10, 20)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Halftime Row */}
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {quarterLabels[1] || "Halftime"}
        </p>
        <div className="flex gap-1">
          {halftimeSquares.map((square, i) => (
            <div key={`ht-${i}`} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-7 w-full items-center justify-center rounded-t-md bg-[var(--gp-surface)] text-[10px] font-bold text-muted-foreground sm:text-xs">
                {columnNumbers[i]}
              </div>
              <button
                onClick={() => !isLocked && onSquareClick(i)}
                disabled={isLocked && !square.isSelected}
                className={cn(
                  "grid-square aspect-square w-full rounded-b-md border border-border/50 text-[10px] sm:text-xs",
                  square.isWinner &&
                    "animate-winner border-[var(--gp-winner)] bg-[var(--gp-winner)] text-background",
                  !square.isWinner &&
                    square.isSelected &&
                    "border-[var(--gp-neon)] bg-[var(--gp-neon)]/20 text-[color:var(--gp-neon)]",
                  !square.isWinner &&
                    !square.isSelected &&
                    "bg-card hover:bg-[var(--gp-surface-hover)]",
                  isLocked &&
                    !square.isSelected &&
                    "cursor-default opacity-50"
                )}
                aria-label={`Halftime square ${columnNumbers[i]}${square.isSelected ? ", selected" : ""}${square.isWinner ? ", winner" : ""}`}
              >
                {square.isWinner
                  ? "W"
                  : square.owner
                    ? square.owner.slice(0, 2)
                    : ""}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Final Row */}
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {quarterLabels[3] || "Final"}
        </p>
        <div className="flex gap-1">
          {finalSquares.map((square, i) => {
            const idx = i + 10
            return (
              <div key={`fn-${i}`} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-7 w-full items-center justify-center rounded-t-md bg-[var(--gp-surface)] text-[10px] font-bold text-muted-foreground sm:text-xs">
                  {columnNumbers[i]}
                </div>
                <button
                  onClick={() => !isLocked && onSquareClick(idx)}
                  disabled={isLocked && !square.isSelected}
                  className={cn(
                    "grid-square aspect-square w-full rounded-b-md border border-border/50 text-[10px] sm:text-xs",
                    square.isWinner &&
                      "animate-winner border-[var(--gp-winner)] bg-[var(--gp-winner)] text-background",
                    !square.isWinner &&
                      square.isSelected &&
                      "border-[var(--gp-neon)] bg-[var(--gp-neon)]/20 text-[color:var(--gp-neon)]",
                    !square.isWinner &&
                      !square.isSelected &&
                      "bg-card hover:bg-[var(--gp-surface-hover)]",
                    isLocked &&
                      !square.isSelected &&
                      "cursor-default opacity-50"
                  )}
                  aria-label={`Final square ${columnNumbers[i]}${square.isSelected ? ", selected" : ""}${square.isWinner ? ", winner" : ""}`}
                >
                  {square.isWinner
                    ? "W"
                    : square.owner
                      ? square.owner.slice(0, 2)
                      : ""}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
