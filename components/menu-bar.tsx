"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import {
  Home,
  FolderOpen,
  User,
  ExternalLink,
  Music,
  Play,
  Pause,
  Volume2,
  Gamepad2,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
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
    icon: <Home className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Home",
    href: "#",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Project",
    href: "#",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Games",
    href: "#",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <User className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Profile",
    href: "#",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
]

const tabVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
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

  // Responsive text for mobile
  const mobileText = "❛❛Every human is their own writer.❛❛"
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false
  const currentText = isMobile ? mobileText : text

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((p) => p + currentText[currentIndex])
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
  }, [currentIndex, currentText, displayText, isDeleting, deleteCount])

  useEffect(() => {
    setDisplayText("")
    setCurrentIndex(0)
    setIsDeleting(false)
    setDeleteCount(0)
  }, [currentText])

  return (
    <div className="text-lg sm:text-xl md:text-2xl font-medium text-foreground mb-6 sm:mb-8 min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center text-center px-4">
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
  const [isExpanded, setIsExpanded] = useState(false)
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
      className="fixed bottom-20 sm:bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Audio element - always mounted */}
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

      {/* Mobile compact view */}
      <div className="sm:hidden">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 bg-card/90 backdrop-blur-lg border border-border/40 rounded-full shadow-xl flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Music className="h-5 w-5 text-primary" />
            </motion.div>
          ) : (
            <Music className="h-5 w-5 text-primary" />
          )}
        </motion.button>
        
        {isExpanded && (
          <motion.div
            className="absolute bottom-14 right-0 bg-card/95 backdrop-blur-lg border border-border/40 rounded-2xl p-3 shadow-xl w-64"
            initial={{ opacity: 0, scale: 0.8, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 8, repeat: isPlaying ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
              >
                <Music className="h-4 w-4 text-white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">Alibi</h4>
                <p className="text-xs text-muted-foreground truncate">Sevdaliza ft. Pabllo</p>
              </div>

              <motion.button
                onClick={togglePlay}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
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

              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 h-1 bg-muted rounded-full cursor-pointer" onClick={handleVolumeChange}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-150"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Desktop view */}
      <motion.div
        className="hidden sm:block bg-card/90 backdrop-blur-lg border border-border/40 rounded-2xl p-4 shadow-xl w-80"
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
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
    </motion.div>
  )
}

export function MenuBar() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("Home")
  const [showLangs, setShowLangs] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const LANGS = ["C#", "C++", "Lua", "Python", "Javascript (NodeJS)", "Typescript"]

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Control scroll behavior on mobile
  useEffect(() => {
    if (!isMobile) return

    const shouldEnableScroll = activeTab === "Profile" || showLangs
    
    if (shouldEnableScroll) {
      // Enable scrolling
      document.body.style.overflow = 'auto'
      document.documentElement.style.overflow = 'auto'
    } else {
      // Disable scrolling
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto'
      document.documentElement.style.overflow = 'auto'
    }
  }, [activeTab, showLangs, isMobile])

  return (
    <div className="flex flex-col items-center px-4 pb-24 sm:pb-8">
      {activeTab === "Home" && (
        <div className="mb-6 sm:mb-8 w-full">
          <TypewriterEffect text="❛❛Ultimately, every human is their own writer.❛❛" />
        </div>
      )}

      {activeTab === "Project" && (
        <div className="mb-6 sm:mb-8 w-full max-w-5xl -mt-4 sm:mt-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8 text-foreground px-4">My Projects</h2>
          <div className="flex justify-center px-4">
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
                    className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{project.title}</h3>
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
        <div className="mb-6 sm:mb-8 w-full max-w-5xl">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 px-4">
            <motion.div
              className="bg-card border border-border rounded-xl overflow-hidden shadow-lg w-full max-w-md mx-auto lg:mx-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Discord banner */}
              <div className="h-32 sm:h-40 relative">
                <img
                  src="https://cdn.discordapp.com/banners/353484123144192000/a_9bfe2fa1f58c971fa40649197d1cb96d?size=4096"
                  alt="Discord Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
                {/* Avatar */}
                <div className="relative -mt-4 sm:-mt-5 mb-4 flex justify-center">
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-card overflow-hidden relative"
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
                  <div className="absolute bottom-0 right-1/2 translate-x-8 sm:translate-x-10 translate-y-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-4 border-card">
                      <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Username + badges */}
                <div className="text-center mb-3">
                  <div className="flex items-baseline justify-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-muted/40 cursor-pointer relative -top-1"
                      aria-label="Server Tag: ORV"
                      tabIndex={0}
                      role="button"
                    >
                      <img
                        alt=""
                        className="badge__10651"
                        width={12}
                        height={12}
                        src="https://cdn.discordapp.com/clan-badges/747807131536982068/b6f6582eb0301ce069e00b2a99323975.png?size=16"
                      />
                      <span className="text-xs font-semibold text-foreground">ORV</span>
                    </span>

                    <h2 className="text-lg sm:text-xl font-bold text-foreground">한수영</h2>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">vinoland</p>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      <img
                        src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/gold.png"
                        alt="Nitro Gold"
                        className="h-3 w-3 sm:h-4 sm:w-4 align-middle"
                        loading="lazy"
                      />
                      <img
                        src="https://raw.githubusercontent.com/mezotv/discord-badges/d2b97b2db0d6fa5c8ac024f0d863d4458423f2bb/assets/hypesquadbalance.svg"
                        alt="HypeSquad Balance"
                        className="h-3 w-3 sm:h-4 sm:w-4 align-middle"
                        loading="lazy"
                      />
                      <img
                        src="https://raw.githubusercontent.com/mezotv/discord-badges/d2b97b2db0d6fa5c8ac024f0d863d4458423f2bb/assets/boosts/discordboost4.svg"
                        alt="Server Booster (Level 4)"
                        className="h-3 w-3 sm:h-4 sm:w-4 align-middle"
                        loading="lazy"
                      />
                      <img
                        src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/username.png"
                        alt="Username History"
                        className="h-3 w-3 sm:h-4 sm:w-4 align-middle"
                        loading="lazy"
                      />
                      <img
                        src="https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/quest.png"
                        alt="Quest"
                        className="h-3 w-3 sm:h-4 sm:w-4 align-middle"
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
                      <p className="text-xs sm:text-sm text-foreground font-medium mb-2">
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
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        Tell me that I did good until now — whether I made the wrong choice or the right choice,
                        I can reach the end of this story or not.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col items-center lg:items-start w-full lg:w-64 shrink-0">
              <motion.button
                onClick={() => setShowLangs((v) => !v)}
                className="w-full max-w-sm lg:max-w-none px-4 py-3 rounded-2xl bg-card border border-border/60 shadow-lg flex items-center justify-between hover:bg-card/90 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                aria-expanded={showLangs}
                aria-controls="langs-panel"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="hidden sm:inline">
                    {showLangs ? "Hide Languages i learn" : "Show Languages i learn"}
                  </span>
                  <span className="sm:hidden">
                    {showLangs ? "Hide Languages" : "Show Languages i learn"}
                  </span>
                </span>
                {showLangs ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.button>

              <motion.div
                id="langs-panel"
                initial={false}
                animate={showLangs ? { height: "auto", opacity: 1, y: 0 } : { height: 0, opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden w-full max-w-sm lg:max-w-none"
              >
                <div className="mt-3 bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex flex-wrap gap-2">
                    {["C#", "C++", "Lua", "Python", "Javascript (NodeJS)", "Java (Android Studio)", "Kotlin (Android Studio)"].map((lang) => (
                      <span
                        key={lang}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <motion.nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-lg border-t border-border/40">
        <div className="max-w-sm mx-auto p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden">
          <ul className="flex items-center justify-between gap-1 relative z-10">
            {menuItems.map((item) => (
              <motion.li key={item.label} className="relative flex-1">
                <motion.a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab(item.label)
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2 relative z-10 transition-colors rounded-xl touch-manipulation ${
                    activeTab === item.label
                      ? "bg-primary/10 text-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  variants={tabVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className={`transition-colors duration-300 ${
                      activeTab === item.label ? item.iconColor : "text-foreground hover:" + item.iconColor
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </motion.a>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.nav>

      {/* Desktop Navigation */}
      <motion.nav className="hidden sm:block p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden">
        <ul className="flex items-center gap-2 relative z-10">
          {menuItems.map((item) => (
            <motion.li key={item.label} className="relative">
              <motion.a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab(item.label)
                }}
                className={`flex items-center gap-2 px-4 py-2 relative z-10 transition-colors rounded-xl touch-manipulation ${
                  activeTab === item.label
                    ? "bg-primary/10 text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                variants={tabVariants}
                initial="initial"
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <span
                  className={`transition-colors duration-300 ${
                    activeTab === item.label ? item.iconColor : "text-foreground hover:" + item.iconColor
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-base">{item.label}</span>
              </motion.a>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      <MusicPlayer />
    </div>
  )
}