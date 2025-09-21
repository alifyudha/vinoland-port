"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Flag, RotateCcw, Bomb, Smartphone, Monitor } from "lucide-react"
import { useState, useEffect, useRef } from "react"

type CellState = "hidden" | "revealed" | "flagged"
type GameState = "playing" | "won" | "lost"
type Difficulty = "easy" | "normal" | "hard" | "expert"
type GamePhase = "difficulty-selection" | "playing"

interface Cell {
  isMine: boolean
  neighborCount: number
  state: CellState
}

const DIFFICULTY_CONFIG = {
  easy: { rows: 8, cols: 8, mines: 10, label: "Easy (8x8)", mobile: true },
  normal: { rows: 9, cols: 9, mines: 10, label: "Normal (9x9)", mobile: true },
  hard: { rows: 12, cols: 12, mines: 25, label: "Hard (12x12)", mobile: true },
  expert: { rows: 16, cols: 30, mines: 99, label: "Expert (16x30)", mobile: false },
}

function Minesweeper({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameState, setGameState] = useState<GameState>("playing")
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("normal")
  const [gamePhase, setGamePhase] = useState<GamePhase>("difficulty-selection")
  const [isMobile, setIsMobile] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)

  const config = DIFFICULTY_CONFIG[difficulty]
  const { rows: ROWS, cols: COLS, mines: MINES } = config

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
    if (gameState !== "playing" || board.length === 0 || isLongPress) return

    let newBoard = [...board]

    if (firstClick) {
      newBoard = initializeBoard(row, col)
      setFirstClick(false)
    }

    if (!newBoard[row] || !newBoard[row][col] || newBoard[row][col].state !== "hidden") return

    newBoard[row][col].state = "revealed"

    if (newBoard[row][col].isMine) {
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

    // Check win condition
    let hiddenCount = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newBoard[r][c].state === "hidden" && !newBoard[r][c].isMine) hiddenCount++
      }
    }
    if (hiddenCount === 0) setGameState("won")
  }

  const toggleFlag = (row: number, col: number) => {
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

  const handleTouchStart = (row: number, col: number) => {
    setIsLongPress(false)
    const timer = setTimeout(() => {
      setIsLongPress(true)
      toggleFlag(row, col)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTimeout(() => setIsLongPress(false), 100)
  }

  const handleCellClick = (row: number, col: number) => {
    if (isMobile) {
      if (!isLongPress) {
        revealCell(row, col)
      }
    } else {
      revealCell(row, col)
    }
  }

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (!isMobile) {
      toggleFlag(row, col)
    }
  }

  const getCellContent = (cell: Cell) => {
    if (cell.state === "flagged") return <Flag className={`${isMobile ? 'h-5 w-5' : 'h-3 w-3'} text-red-500`} />
    if (cell.state === "hidden") return null
    if (cell.isMine) return <Bomb className={`${isMobile ? 'h-5 w-5' : 'h-3 w-3'} text-red-100`} />
    if (cell.neighborCount === 0) return null
    return cell.neighborCount
  }

  const getCellColor = (cell: Cell, row: number, col: number) => {
    if (cell.state === "hidden") {
      const alt = (row + col) % 2 === 0
      return `${alt ? "bg-zinc-800" : "bg-zinc-900"} hover:bg-zinc-800/90 active:bg-zinc-700`
    }
    if (cell.state === "flagged") return "bg-red-100 dark:bg-red-900/30"
    if (cell.isMine) return "bg-rose-700"
    return "bg-zinc-950"
  }

  const getNumberColor = (count: number) => NUMBER_COLORS[count] || "text-zinc-300"

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

  // Get cell size based on screen size and difficulty
  const getCellSize = () => {
    if (!isMobile) {
      return "w-8 h-8 text-xs"
    }
    
    // For mobile, adjust cell size based on difficulty and screen width
    const screenWidth = window.innerWidth
    const padding = 32 // Total horizontal padding
    const availableWidth = screenWidth - padding
    
    // Calculate optimal cell size
    const maxCellSize = Math.floor((availableWidth - (COLS - 1) * 2) / COLS)
    
    if (difficulty === "hard") {
      // For hard mode, use smaller cells to fit better
      const cellSize = Math.min(maxCellSize, 28)
      return `w-[${cellSize}px] h-[${cellSize}px] text-[10px]`
    } else {
      // For easy/normal, use larger cells
      const cellSize = Math.min(maxCellSize, 36)
      return `w-[${cellSize}px] h-[${cellSize}px] text-sm`
    }
  }

  const cellClass = (cell: Cell, row: number, col: number) => {
    const base = [
      getCellSize(),
      "border",
      "border-zinc-700/60",
      "font-bold",
      "flex",
      "items-center",
      "justify-center",
      "transition-all",
      "duration-150",
      "rounded-[4px]",
      "select-none",
      "touch-manipulation",
    ]

    base.push(getCellColor(cell, row, col))

    if (cell.state === "hidden") {
      base.push("hover:shadow-md")
    }

    if (cell.state === "revealed" && !cell.isMine) {
      base.push("border-transparent")
      base.push(getNumberColor(cell.neighborCount))
    }

    return base.join(" ")
  }

  const getAvailableDifficulties = () => {
    return Object.entries(DIFFICULTY_CONFIG).filter(([_, cfg]) => 
      !isMobile || cfg.mobile
    ) as [Difficulty, typeof DIFFICULTY_CONFIG.normal][]
  }

  // Get container max width based on difficulty
  const getContainerMaxWidth = () => {
    if (difficulty === "expert") return "max-w-6xl"
    if (isMobile) {
      // Allow more space on mobile
      return difficulty === "hard" ? "max-w-[95vw]" : "max-w-lg"
    }
    return "max-w-2xl"
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
          className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Select Difficulty</h2>
            <p className="text-muted-foreground text-sm">Choose difficulty level to start the game</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
              {isMobile ? (
                <>
                  <Smartphone className="h-4 w-4" />
                  <span>Tap to reveal • Long press to flag</span>
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  <span>Left click to reveal • Right click to flag</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {getAvailableDifficulties().map(([key, cfg]) => (
              <motion.button
                key={key}
                onClick={() => startGame(key)}
                className="w-full p-3 sm:p-4 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors text-left touch-manipulation"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{cfg.label}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{cfg.mines} mines</p>
                  </div>
                  <Bomb className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-card border border-border rounded-2xl p-3 sm:p-6 shadow-2xl w-full max-h-[95vh] overflow-auto ${getContainerMaxWidth()}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Mines</span>
              <span className="font-mono">{MINES}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Flags</span>
              <span className="font-mono">{flagCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Level</span>
              <span className="font-mono capitalize">{difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={backToDifficultySelection}
              className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm touch-manipulation"
            >
              Back
            </button>
            <button
              onClick={resetGame}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 sm:py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm touch-manipulation"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>

        {board.length > 0 && (
          <div className="flex justify-center overflow-x-auto">
            <div
              className={`grid bg-zinc-900 p-2 rounded-2xl border-2 border-zinc-700`}
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gap: isMobile ? '2px' : '1px',
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
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                    onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    disabled={gameState !== "playing"}
                  >
                    {getCellContent(cell)}
                  </button>
                )),
              )}
            </div>
          </div>
        )}

        {gameState !== "playing" && (
          <motion.div 
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-muted-foreground">
              {gameState === "won" ? "🎉 Congratulations! You won!" : "💥 Game Over! Try again!"}
            </p>
          </motion.div>
        )}

        <div className="mt-3 sm:mt-4 text-xs text-muted-foreground text-center">
          {isMobile ? "Tap to reveal • Long press to flag" : "Left click to reveal • Right click to flag"}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Games() {
  const [showMinesweeper, setShowMinesweeper] = useState(false)

  return (
    <div className="mb-6 sm:mb-8 w-full max-w-md mx-auto px-4 sm:px-0">
      <motion.div
        className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow touch-manipulation"
        initial={{ opacity: 0, scale: 0.9 }}  
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => setShowMinesweeper(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full mb-3 sm:mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
        >
          <Bomb className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Minesweeper</h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3 sm:mb-4">
          <span className="text-sm">Tap to Play</span>
        </div>
        <p className="text-muted-foreground text-sm">Just a minesweeper game.</p>
      </motion.div>

      {/* Minesweeper overlay */}
      {showMinesweeper && <Minesweeper onClose={() => setShowMinesweeper(false)} />}
    </div>
  )
}