"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"
import type { BoardSquare } from "@/lib/types"

interface Grid5x5Props {
  squares: BoardSquare[]
  columnNumbers: number[]
  rowNumbers: number[]
  homeTeam: string
  awayTeam: string
  onSquareClick: (index: number) => void
  isLocked: boolean
}

export function Grid5x5({
  squares,
  columnNumbers,
  rowNumbers,
  homeTeam,
  awayTeam,
  onSquareClick,
  isLocked,
}: Grid5x5Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Home team label */}
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--gp-neon)]">
        {homeTeam} &rarr;
      </p>

      <div className="flex gap-2">
        {/* Away team label */}
        <div className="flex items-center">
          <span
            className="text-xs font-semibold uppercase tracking-wider text-[color:var(--gp-neon)]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {awayTeam}
          </span>
        </div>

        {/* Grid */}
        <div className="mx-auto w-full max-w-md">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `minmax(40px, 56px) repeat(5, 1fr)`,
            }}
          >
            {/* Top-left corner */}
            <div className="grid-square-header aspect-square rounded-tl-lg bg-[var(--gp-surface)] text-xs">
              V/H
            </div>

            {/* Column headers */}
            {columnNumbers.map((num, i) => (
              <div
                key={`col-${i}`}
                className="grid-square-header aspect-square bg-[var(--gp-surface)] text-sm font-bold"
              >
                {String(num).padStart(2, "0")}
              </div>
            ))}

            {/* Grid rows */}
            {Array.from({ length: 5 }).map((_, row) => (
              <Fragment key={`row-${row}`}>
                <div
                  className="grid-square-header aspect-square bg-[var(--gp-surface)] text-sm font-bold"
                >
                  {String(rowNumbers[row]).padStart(2, "0")}
                </div>

                {Array.from({ length: 5 }).map((_, col) => {
                  const idx = row * 5 + col
                  const square = squares[idx]
                  if (!square) return null

                  return (
                    <button
                      key={`cell-${idx}`}
                      onClick={() => !isLocked && onSquareClick(idx)}
                      disabled={isLocked && !square.isSelected}
                      className={cn(
                        "grid-square aspect-square rounded-md border border-border/50 text-sm",
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
                      aria-label={`Square row ${rowNumbers[row]} column ${columnNumbers[col]}${square.isSelected ? ", selected" : ""}${square.isWinner ? `, winner quarter ${square.winQuarter}` : ""}`}
                    >
                      {square.isWinner
                        ? `Q${square.winQuarter}`
                        : square.owner
                          ? square.owner.slice(0, 3)
                          : ""}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
