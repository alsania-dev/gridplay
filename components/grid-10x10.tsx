"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"
import type { BoardSquare } from "@/lib/types"

interface Grid10x10Props {
  squares: BoardSquare[]
  columnNumbers: number[]
  rowNumbers: number[]
  homeTeam: string
  awayTeam: string
  onSquareClick: (index: number) => void
  isLocked: boolean
}

export function Grid10x10({
  squares,
  columnNumbers,
  rowNumbers,
  homeTeam,
  awayTeam,
  onSquareClick,
  isLocked,
}: Grid10x10Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Home team label */}
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--gp-neon)]">
        {homeTeam} &rarr;
      </p>

      <div className="flex gap-2">
        {/* Away team label (vertical) */}
        <div className="flex items-center">
          <span
            className="text-xs font-semibold uppercase tracking-wider text-[color:var(--gp-neon)]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {awayTeam}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="grid gap-px sm:gap-0.5"
            style={{
              gridTemplateColumns: `minmax(28px, 36px) repeat(10, minmax(28px, 1fr))`,
            }}
          >
            {/* Top-left corner: V/H */}
            <div className="grid-square-header aspect-square rounded-tl-md bg-[var(--gp-surface)] text-[10px]">
              V/H
            </div>

            {/* Column headers */}
            {columnNumbers.map((num, i) => (
              <div
                key={`col-${i}`}
                className="grid-square-header aspect-square bg-[var(--gp-surface)] text-xs font-bold"
              >
                {num}
              </div>
            ))}

            {/* Grid rows */}
            {Array.from({ length: 10 }).map((_, row) => (
              <Fragment key={`row-${row}`}>
                {/* Row header */}
                <div
                  className="grid-square-header aspect-square bg-[var(--gp-surface)] text-xs font-bold"
                >
                  {rowNumbers[row]}
                </div>

                {/* Cells */}
                {Array.from({ length: 10 }).map((_, col) => {
                  const idx = row * 10 + col
                  const square = squares[idx]
                  if (!square) return null

                  return (
                    <button
                      key={`cell-${idx}`}
                      onClick={() => !isLocked && onSquareClick(idx)}
                      disabled={isLocked && !square.isSelected}
                      className={cn(
                        "grid-square aspect-square border border-border/50 text-[10px] sm:text-xs",
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
