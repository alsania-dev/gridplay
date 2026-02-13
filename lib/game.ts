import type {
  BoardSquare,
  BoardType,
  QuarterScore,
} from "./types"
import { PAYOUT_STRUCTURE } from "./types"

export { PAYOUT_STRUCTURE }

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateNumbers(count: number): number[] {
  if (count === 10) {
    return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  }
  // For 5x5: double digits
  const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const pairs: number[] = []
  for (let i = 0; i < count; i++) {
    pairs.push(parseInt(`${digits[i * 2]}${digits[i * 2 + 1]}`))
  }
  return pairs
}

export function createBoard(type: BoardType): BoardSquare[] {
  const size = type === "10x10" ? 100 : type === "5x5" ? 25 : 20
  return Array.from({ length: size }, (_, i) => ({
    index: i,
    isSelected: false,
    isWinner: false,
  }))
}

export function findWinningSquare(
  homeScore: number,
  awayScore: number,
  columnNumbers: number[],
  rowNumbers: number[],
  boardType: BoardType
): number {
  const homeDigit = homeScore % 10
  const awayDigit = awayScore % 10

  if (boardType === "10x10") {
    const col = columnNumbers.indexOf(homeDigit)
    const row = rowNumbers.indexOf(awayDigit)
    if (col !== -1 && row !== -1) {
      return row * 10 + col
    }
  } else if (boardType === "5x5") {
    // 5x5 uses double-digit ranges
    for (let col = 0; col < 5; col++) {
      const colNum = columnNumbers[col]
      const colDigits = [Math.floor(colNum / 10), colNum % 10]
      if (colDigits.includes(homeDigit)) {
        for (let row = 0; row < 5; row++) {
          const rowNum = rowNumbers[row]
          const rowDigits = [Math.floor(rowNum / 10), rowNum % 10]
          if (rowDigits.includes(awayDigit)) {
            return row * 5 + col
          }
        }
      }
    }
  }
  return -1
}

export function findShotgunWinner(
  homeScore: number,
  awayScore: number
): number {
  const combined = (homeScore % 10) + (awayScore % 10)
  return combined % 10
}

export function simulateScores(): QuarterScore[] {
  const quarters: QuarterScore[] = []
  let homeTotal = 0
  let awayTotal = 0
  const labels = ["Q1", "Halftime", "Q3", "Final"]

  for (let i = 0; i < 4; i++) {
    const homeQ = Math.floor(Math.random() * 28)
    const awayQ = Math.floor(Math.random() * 28)
    homeTotal += homeQ
    awayTotal += awayQ
    quarters.push({
      quarter: i + 1,
      label: labels[i],
      home: homeTotal,
      away: awayTotal,
    })
  }
  return quarters
}

export function calculatePotTotal(
  boardType: BoardType,
  squarePrice: number
): number {
  const count = boardType === "10x10" ? 100 : boardType === "5x5" ? 25 : 20
  return count * squarePrice
}

export function calculatePayout(
  potTotal: number,
  quarterIndex: number,
  payouts: typeof PAYOUT_STRUCTURE
): number {
  const keys = ["q1", "halftime", "q3", "final"] as const
  return potTotal * payouts[keys[quarterIndex]]
}
