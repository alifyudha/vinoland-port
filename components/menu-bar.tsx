"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import {
  Home,
  FolderOpen,
  Gamepad2,
  User,
  ExternalLink,
  Clock,
  Music,
  Play,
  Pause,
  Volume2,
  X,
  Flag,
  RotateCcw,
  Bomb,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    label: "Project",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Gamepad2 className="h-5 w-5" />,
    label: "Games",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <User className="h-5 w-5" />,
    label: "Profile",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
]

const tabVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
}

const projects = [
  {
    id: 1,
    title: "VTeam",
    description: "A Things that let you interact with Steam client.",
    image: "/woila.jpg",
    link: "https://vinoland.dev",
    tech: ["Paid"],
  },
]

function TypewriterEffect({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCount, setDeleteCount] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < text.length) {
          setDisplayText((p) => p + text[currentIndex])
          setCurrentIndex((p) => p + 1)

          if (currentIndex > 10 && Math.random() < 0.08) {
            setIsDeleting(true)
            setDeleteCount(0)
          }
        }
      } else {
        const protectedChars = ["❛", "."]
        const canDelete =
          displayText.length > 0 &&
          deleteCount < 2 &&
          !protectedChars.includes(displayText[displayText.length - 1])
        if (canDelete) {
          setDisplayText((p) => p.slice(0, -1))
          setCurrentIndex((p) => p - 1)
          setDeleteCount((p) => p + 1)
        } else {
          setIsDeleting(false)
          setDeleteCount(0)
        }
      }
    }, isDeleting ? 30 : 50)

    return () => clearTimeout(timeout)
  }, [currentIndex, text, displayText, isDeleting, deleteCount])

  useEffect(() => {
    setDisplayText("")
    setCurrentIndex(0)
    setIsDeleting(false)
    setDeleteCount(0)
  }, [text])

  return (
    <div className="text-2xl font-medium text-foreground mb-8 h-8 flex items-center">
      {displayText}
      <span className="animate-pulse ml-1 text-primary">|</span>
    </div>
  )
}

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const updateDuration = () => {
    const a = audioRef.current
    if (!a) return
    let d = a.duration
    if (!Number.isFinite(d) || d <= 0) {
      try {
        if (a.seekable && a.seekable.length > 0) {
          d = a.seekable.end(a.seekable.length - 1)
        }
      } catch {}
    }
    if (Number.isFinite(d) && d > 0) setDuration(d)
  }

  const tick = () => {
    const a = audioRef.current
    if (a) {
      setCurrentTime(a.currentTime)
      if (duration === 0) updateDuration()
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const startRaf = () => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick)
  }
  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (isPlaying) a.pause()
    else a.play().catch(() => {})
  }

  const handleLoadedMetadata = () => {
    const a = audioRef.current
    if (!a) return
    a.volume = volume
    updateDuration()
  }
  const handleDurationChange = () => updateDuration()
  const handleCanPlay = () => updateDuration()
  const handleTimeUpdate = () => {
    const a = audioRef.current
    if (a) setCurrentTime(a.currentTime)
  }
  const handlePlay = () => {
    setIsPlaying(true)
    startRaf()
  }
  const handlePause = () => {
    setIsPlaying(false)
    stopRaf()
  }
  const handleEnded = () => {
    setIsPlaying(false)
    stopRaf()
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    return () => stopRaf()
  }, [])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    a.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width))
    setVolume(newVolume)
    a.volume = newVolume
  }

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 bg-card/90 backdrop-blur-lg border border-border/40 rounded-2xl p-4 shadow-xl max-w-sm"
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      >
        <source src="/sevdaliza-alibi.mp3" type="audio/mpeg" />
      </audio>

      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 8, repeat: isPlaying ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
        >
          <Music className="h-6 w-6 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">Alibi</h4>
          <p className="text-xs text-muted-foreground truncate">Sevdaliza ft. Pabllo</p>
        </div>

        <motion.button
          onClick={togglePlay}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </motion.button>
      </div>

      <div className="space-y-2">
        <div className="w-full h-1 bg-muted rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-3 gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 h-1 bg-muted rounded-full cursor-pointer" onClick={handleVolumeChange}>
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-150"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}

type CellState = "hidden" | "revealed" | "flagged"
type GameState = "playing" | "won" | "lost"

interface Cell {
  isMine: boolean
  neighborCount: number
  state: CellState
}

function Minesweeper({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameState, setGameState] = useState<GameState>("playing")
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)

  const ROWS = 9
  const COLS = 9
  const MINES = 10

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

  const initializeBoard = (firstClickRow?: number, firstClickCol?: number) => {
    const newBoard: Cell[][] = Array(ROWS)
      .fill(null)
      .map(() =>
        Array(COLS)
          .fill(null)
          .map(() => ({ isMine: false, neighborCount: 0, state: "hidden" as CellState })),
      )

    // fungsi naruh bom (random)
    let minesPlaced = 0
    while (minesPlaced < MINES) {
      const row = Math.floor(Math.random() * ROWS)
      const col = Math.floor(Math.random() * COLS)
      if (!newBoard[row][col].isMine && !(firstClickRow === row && firstClickCol === col)) {
        newBoard[row][col].isMine = true
        minesPlaced++
      }
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr
              const newCol = col + dc
              if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
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
  }

  useEffect(() => {
    resetGame()
  }, [])

  const revealCell = (row: number, col: number) => {
    if (gameState !== "playing") return

    let newBoard = [...board]

    if (firstClick) {
      newBoard = initializeBoard(row, col)
      setFirstClick(false)
    }
    if (newBoard[row][col].state !== "hidden") return

    newBoard[row][col].state = "revealed"

    if (newBoard[row][col].isMine) {
      // fungsi reveal bomb
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

    // win check
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
    if (gameState !== "playing" || board[row][col].state === "revealed") return

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
    if (cell.isMine) return null // no 💣
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
    if (!(cell.state === "revealed" && !cell.isMine)) return ""
    const isInside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS
    const isOpen = (r: number, c: number) =>
      isInside(r, c) && board[r][c].state === "revealed" && !board[r][c].isMine

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Bomb</span>
              <span className="text-sm font-mono">{MINES}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Flag</span>
              <span className="text-sm font-mono">{flagCount}</span>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div
          className="grid grid-cols-9 bg-zinc-900 p-2 rounded-2xl border-2 border-zinc-700"
          style={{
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

export function MenuBar() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("Home")
  const [showMinesweeper, setShowMinesweeper] = useState(false)

  return (
    <div className="flex flex-col items-center">
      {activeTab === "Home" && (
        <div className="mb-8">
          <TypewriterEffect text="❛❛Ultimately, every human is their own writer.❛❛" />
        </div>
      )}

      {activeTab === "Project" && (
        <div className="mb-8 w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">My Projects</h2>
          <div className="flex justify-center">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: project.id * 0.1 }}
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{project.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <motion.a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Project
                    <ExternalLink className="h-4 w-4" />
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Games" && (
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
            <Bomb className="h-8 w-8 text-green-500" /> {}
          </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Minesweeper</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <span className="text-sm">Click to Play</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Just a classic minesweeper game.
            </p>
          </motion.div>
        </div>
      )}

      {activeTab === "Profile" && (
        <div className="mb-8 w-full max-w-md">
          <motion.div
            className="bg-card border border-border rounded-xl p-8 text-center shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
            >
              <User className="h-8 w-8 text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Profile</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Coming Soon</span>
            </div>
            <p className="text-muted-foreground text-sm">
              ts still coming soon, maybe i put my bio or something idk
            </p>
          </motion.div>
        </div>
      )}

      <motion.nav className="p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden">
        <ul className="flex items-center gap-2 relative z-10">
          {menuItems.map((item) => (
            <motion.li key={item.label} className="relative">
              <motion.a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab(item.label)
                }}
                className={`flex items-center gap-2 px-4 py-2 relative z-10 transition-colors rounded-xl ${
                  activeTab === item.label
                    ? "bg-primary/10 text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                variants={tabVariants}
                initial="initial"
                whileHover="hover"
              >
                <span
                  className={`transition-colors duration-300 ${
                    activeTab === item.label ? item.iconColor : "text-foreground hover:" + item.iconColor
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </motion.a>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      <MusicPlayer />

      {showMinesweeper && <Minesweeper onClose={() => setShowMinesweeper(false)} />}
    </div>
  )
}
