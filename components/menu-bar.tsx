"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Home, FolderOpen, User, ExternalLink, Clock, Music, Play, Pause, Volume2, Gamepad2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"
import { Games } from "./games"

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
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    label: "Project",
    href: "#",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Gamepad2 className="h-5 w-5" />,
    label: "Games",
    href: "#",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <User className="h-5 w-5" />,
    label: "Profile",
    href: "#",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
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
    const timeout = setTimeout(
      () => {
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
            displayText.length > 0 && deleteCount < 2 && !protectedChars.includes(displayText[displayText.length - 1])
          if (canDelete) {
            setDisplayText((p) => p.slice(0, -1))
            setCurrentIndex((p) => p - 1)
            setDeleteCount((p) => p + 1)
          } else {
            setIsDeleting(false)
            setDeleteCount(0)
          }
        }
      },
      isDeleting ? 30 : 50,
    )

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

export function MenuBar() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("Home")

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

      {activeTab === "Games" && <Games />}

      {activeTab === "Profile" && (
        <div className="mb-8 w-full max-w-md">
          <motion.div
            className="bg-card border border-border rounded-xl overflow-hidden shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Discord banner (official, tapi harus pake hash) */}
            <div className="h-40 relative">  {/* khusus yang ini harus di sesuaiin sendiri ya soalnya kadang kegedean 40 bisa diganti ke 24+*/}
              <img
                src="https://cdn.discordapp.com/banners/353484123144192000/a_9bfe2fa1f58c971fa40649197d1cb96d?size=4096"
                alt="Discord Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="px-6 pb-6 relative">
              {/* Profile picture (sama kaya banner) */}
              <div className="relative -mt-5 mb-4 flex justify-center">
                <motion.div
                  className="w-20 h-20 rounded-full border-4 border-card overflow-hidden relative"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                >
                  <img
                    src="https://cdn.discordapp.com/avatars/353484123144192000/ad0d414176453cdfa72e594f56bfa6a0?size=1024"
                    alt="Discord Avatar"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Online indicator */}
                <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-1">
                  <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-card">
                    <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Username + guild tag + badges */}
              <div className="text-center mb-3">
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-muted/40 cursor-pointer relative -top-1"
                    aria-label="Server Tag: ORV"
                    tabIndex={0}
                    role="button"
                  >
                    <img
                      alt=""
                      className="badge__10651"
                      width={14}
                      height={14}
                      src="https://cdn.discordapp.com/clan-badges/747807131536982068/b6f6582eb0301ce069e00b2a99323975.png?size=16"
                    />
                    <span className="text-xs font-semibold text-foreground">ORV</span>
                  </span>

                  {/* display name */}
                  <h2 className="text-xl font-bold text-foreground">한수영</h2>
                </div>

                {/* username + badges inline */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">vinoland</p>
                  <div className="flex items-center gap-1">
                    <img
                      src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/gold.png"
                      alt="Nitro Gold"
                      className="h-4 w-4 align-middle"
                      loading="lazy"
                    />
                    <img
                      src="https://raw.githubusercontent.com/mezotv/discord-badges/d2b97b2db0d6fa5c8ac024f0d863d4458423f2bb/assets/hypesquadbalance.svg"
                      alt="HypeSquad Balance"
                      className="h-4 w-4 align-middle"
                      loading="lazy"
                    />
                    <img
                      src="https://raw.githubusercontent.com/mezotv/discord-badges/d2b97b2db0d6fa5c8ac024f0d863d4458423f2bb/assets/boosts/discordboost4.svg"
                      alt="Server Booster (Level 4)"
                      className="h-4 w-4 align-middle"
                      loading="lazy"
                    />
                    <img
                      src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/username.png"
                      alt="Username History"
                      className="h-4 w-4 align-middle"
                      loading="lazy"
                    />
                    <img
                      src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/quest.png"
                      alt="Quest"
                      className="h-4 w-4 align-middle"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-3 w-3 -translate-y-0.4 shrink-0 text-zinc-900 dark:text-white [&_*]:fill-current [&_*]:stroke-current"
                  >
                    <rect x="3" y="5" width="2" height="2" />
                    <rect x="3" y="11" width="2" height="2" />
                    <rect x="3" y="17" width="2" height="2" />
                    <rect x="7" y="5" width="14" height="2" />
                    <rect x="7" y="11" width="14" height="2" />
                    <rect x="7" y="17" width="14" height="2" />
                  </svg>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Known as</p>
                    <p className="text-sm text-foreground font-medium mb-2">
                      The First Apostle, The Fake King, Black Flames Empress, Black Flames Demon Ruler
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-muted/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-white-500 text-lg leading-none">❛❛</div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Han Sooyoung</p>
                    <p className="text-sm text-foreground">
                      Tell me that I did good until now — whether I made the wrong choice or the right choice,
                      I can reach the end of this story or not.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  )
}
