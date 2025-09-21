"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Flag, RotateCcw, Bomb } from "lucide-react"
import { useState } from "react"

type CellState = "hidden" | "revealed" | "flagged"
type GameState = "playing" | "won" | "lost"
type Difficulty = "normal" | "hard" | "expert"
type GamePhase = "difficulty-selection" | "playing"

interface Cell {
  isMine: boolean
  neighborCount: number
  state: CellState
}

const DIFFICULTY_CONFIG = {
  normal: { rows: 9, cols: 9, mines: 10, label: "Normal (9x9)" },
  hard: { rows: 16, cols: 16, mines: 40, label: "Hard (16x16)" },
  expert: { rows: 16, cols: 30, mines: 99, label: "Expert (16x30)" },
}

function Minesweeper({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameState, setGameState] = useState<GameState>("playing")
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("normal")
  const [gamePhase, setGamePhase] = useState<GamePhase>("difficulty-selection")

  const config = DIFFICULTY_CONFIG[difficulty]
  const { rows: ROWS, cols: COLS, mines: MINES } = config

  const NUMBER_COLORS: Record<number, string> = {
    1: "text-sky-400",
    2: "text-emerald-400",
    3: "text-rose-400",
    4: "text-indigo-400",
    5: "text-amber-400",
    6: "text-teal-300",
    7: "text-fuchsia-400",
    8: "text-zinc-400",
  }

  const initializeBoard = (
    firstClickRow?: number,
    firstClickCol?: number,
    override?: { rows: number; cols: number; mines: number },
  ) => {
    const R = override?.rows ?? ROWS
    const C = override?.cols ?? COLS
    const M = override?.mines ?? MINES

    const newBoard: Cell[][] = Array(R)
      .fill(null)
      .map(() =>
        Array(C)
          .fill(null)
          .map(() => ({ isMine: false, neighborCount: 0, state: "hidden" as CellState })),
      )

    // taruh bom random
    let minesPlaced = 0
    while (minesPlaced < M) {
      const row = Math.floor(Math.random() * R)
      const col = Math.floor(Math.random() * C)
      if (!newBoard[row][col].isMine && !(firstClickRow === row && firstClickCol === col)) {
        newBoard[row][col].isMine = true
        minesPlaced++
      }
    }

    for (let row = 0; row < R; row++) {
      for (let col = 0; col < C; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const newRow = row + dr
              const newCol = col + dc
              if (newRow >= 0 && newRow < R && newCol >= 0 && newCol < C) {
                if (newBoard[newRow][newCol].isMine) count++
              }
            }
          }
          newBoard[row][col].neighborCount = count
        }
      }
    }

    return newBoard
  }

  const resetGame = () => {
    setBoard(initializeBoard())
    setGameState("playing")
    setFlagCount(0)
    setFirstClick(true)
    setGamePhase("playing")
  }

  const startGame = (selectedDifficulty: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[selectedDifficulty]
    setDifficulty(selectedDifficulty)
    setGamePhase("playing")
    setBoard(initializeBoard(undefined, undefined, cfg))
    setGameState("playing")
    setFlagCount(0)
    setFirstClick(true)
  }

  const backToDifficultySelection = () => {
    setGamePhase("difficulty-selection")
  }

  const revealCell = (row: number, col: number) => {
    if (gameState !== "playing" || board.length === 0) return

    let newBoard = [...board]

    if (firstClick) {
      newBoard = initializeBoard(row, col)
      setFirstClick(false)
    }

    if (!newBoard[row] || !newBoard[row][col] || newBoard[row][col].state !== "hidden") return

    newBoard[row][col].state = "revealed"

    if (newBoard[row][col].isMine) {
      // Reveal bom
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (newBoard[r][c].isMine) newBoard[r][c].state = "revealed"
        }
      }
      setGameState("lost")
    } else if (newBoard[row][col].neighborCount === 0) {
      const queue = [[row, col]] as Array<[number, number]>
      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr
            const nc = cc + dc
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (newBoard[nr][nc].state === "hidden" && !newBoard[nr][nc].isMine) {
                newBoard[nr][nc].state = "revealed"
                if (newBoard[nr][nc].neighborCount === 0) queue.push([nr, nc])
              }
            }
          }
        }
      }
    }

    setBoard(newBoard)

    // Check win
    let hiddenCount = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newBoard[r][c].state === "hidden" && !newBoard[r][c].isMine) hiddenCount++
      }
    }
    if (hiddenCount === 0) setGameState("won")
  }

  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (
      gameState !== "playing" ||
      board.length === 0 ||
      !board[row] ||
      !board[row][col] ||
      board[row][col].state === "revealed"
    )
      return

    const newBoard = [...board]
    if (newBoard[row][col].state === "flagged") {
      newBoard[row][col].state = "hidden"
      setFlagCount((p) => p - 1)
    } else if (newBoard[row][col].state === "hidden") {
      newBoard[row][col].state = "flagged"
      setFlagCount((p) => p + 1)
    }
    setBoard(newBoard)
  }

  const getCellContent = (cell: Cell) => {
    if (cell.state === "flagged") return <Flag className="h-3 w-3 text-red-500" />
    if (cell.state === "hidden") return null
    if (cell.isMine) return null
    if (cell.neighborCount === 0) return null
    return cell.neighborCount
  }

  const getCellColor = (cell: Cell, row: number, col: number) => {
    if (cell.state === "hidden") {
      const alt = (row + col) % 2 === 0
      return `${alt ? "bg-zinc-800" : "bg-zinc-900"} hover:bg-zinc-800/90`
    }
    if (cell.state === "flagged") return "bg-red-100 dark:bg-red-900/30"
    if (cell.isMine) return "bg-rose-700"
    return "bg-zinc-950"
  }

  const getNumberColor = (count: number) => NUMBER_COLORS[count] || "text-zinc-300"

  const getTightBorders = (row: number, col: number, cell: Cell) => {
    if (!(cell.state === "revealed" && !cell.isMine) || board.length === 0) return ""
    const isInside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS
    const isOpen = (r: number, c: number) =>
      isInside(r, c) && board[r] && board[r][c] && board[r][c].state === "revealed" && !board[r][c].isMine

    const parts: string[] = []
    if (isOpen(row, col - 1)) parts.push("border-l-0")
    if (isOpen(row, col + 1)) parts.push("border-r-0")
    if (isOpen(row - 1, col)) parts.push("border-t-0")
    if (isOpen(row + 1, col)) parts.push("border-b-0")
    return parts.join(" ")
  }

  const getTileStyle = (cell: Cell): React.CSSProperties => {
    if (cell.state === "hidden" || cell.state === "flagged") {
      return {
        boxShadow:
          "inset 1px 1px 0 rgba(255,255,255,0.06), inset -2px -2px 0 rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.5)",
      }
    }
    if (cell.state === "revealed" && !cell.isMine) {
      return { boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.65)" }
    }
    return {}
  }

  const cellClass = (cell: Cell, row: number, col: number) => {
    const base = [
      "min-w-8",
      "min-h-8",
      "aspect-square",
      "border",
      "border-zinc-700/60",
      "text-xs",
      "font-bold",
      "flex",
      "items-center",
      "justify-center",
      "transition-all",
      "duration-150",
      "rounded-[6px]",
      "select-none",
    ]

    base.push(getCellColor(cell, row, col))

    if (cell.state === "hidden") {
      base.push("hover:shadow-md")
    }

    if (cell.state === "revealed" && !cell.isMine) {
      base.push(getTightBorders(row, col, cell))
      base.push("border-transparent")
      base.push(getNumberColor(cell.neighborCount))
    }

    if (col === 0 && !(cell.state === "revealed" && !cell.isMine)) base.push("border-l")
    if (row === 0 && !(cell.state === "revealed" && !cell.isMine)) base.push("border-t")

    return base.join(" ")
  }

  if (gamePhase === "difficulty-selection") {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Select Difficulty</h2>
            <p className="text-muted-foreground text-sm">Choose difficulty level to start the game</p>
          </div>

          <div className="space-y-3">
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.normal][]).map(
              ([key, cfg]) => (
                <motion.button
                  key={key}
                  onClick={() => startGame(key)}
                  className="w-full p-4 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{cfg.label}</h3>
                      <p className="text-sm text-muted-foreground">{cfg.mines} mines</p>
                    </div>
                    <Bomb className="h-5 w-5 text-muted-foreground" />
                  </div>
                </motion.button>
              ),
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-card border border-border rounded-2xl p-6 shadow-2xl ${
          difficulty === "expert" ? "max-w-6xl" : "max-w-2xl"
        } w-full max-h-[90vh] overflow-auto`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Mines</span>
              <span className="text-sm font-mono">{MINES}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Flags</span>
              <span className="text-sm font-mono">{flagCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Level</span>
              <span className="text-sm font-mono capitalize">{difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={backToDifficultySelection}
              className="px-3 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
            >
              Back
            </button>
            <button
              onClick={resetGame}
              className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>

        {board.length > 0 && (
          <div
            className={`grid bg-zinc-900 p-2 rounded-2xl border-2 border-zinc-700`}
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              boxShadow:
                "inset 0 0 0 2px rgba(255,255,255,0.04), inset 6px 6px 0 rgba(0,0,0,0.45), 0 6px 0 rgba(0,0,0,0.6)",
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClass(cell, rowIndex, colIndex)}
                  style={getTileStyle(cell)}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(e) => toggleFlag(e, rowIndex, colIndex)}
                  disabled={gameState !== "playing"}
                >
                  {getCellContent(cell)}
                </button>
              )),
            )}
          </div>
        )}

        {gameState !== "playing" && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {gameState === "won" ? "Congratulations! You won!" : "Game Over! Try again!"}
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Left click to reveal • Right click to flag
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Games() {
  const [showMinesweeper, setShowMinesweeper] = useState(false)

  return (
    <div className="mb-8 w-full max-w-md">
      <motion.div
        className="bg-card border border-border rounded-xl p-8 text-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        initial={{ opacity: 0, scale: 0.9 }}  
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => setShowMinesweeper(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
        >
          <Bomb className="h-8 w-8 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Minesweeper</h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
          <span className="text-sm">Click to Play</span>
        </div>
        <p className="text-muted-foreground text-sm">Just a minesweeper games.</p>
      </motion.div>

      {/* Minesweeper overlay */}
      {showMinesweeper && <Minesweeper onClose={() => setShowMinesweeper(false)} />}
    </div>
  )
}
