"use client"

import * as React from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Download,
  X,
  ShieldCheck,
  Link as LinkIcon,
  BadgeCheck,
  Music2,
  Image as ImageIcon,
  Video,
  Play,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface AioDlProps {
  open: boolean
  onClose: () => void
}

// TODO: Move to server-side (proxy) for security
const API_KEY = "og2uP4xcuT"


// ---------- Utils ----------
function isTikTok(u: string) {
  try {
    const url = new URL(u)
    return /(^|\.)tiktok\.com$/i.test(url.hostname) || /(^|\.)vt\.tiktok\.com$/i.test(url.hostname)
  } catch {
    return /tiktok\.com|vt\.tiktok\.com/i.test(u)
  }
}

function isInstagram(u: string) {
  try {
    const url = new URL(u)
    return /(^|\.)instagram\.com$/i.test(url.hostname) || /(^|\.)instagr\.am$/i.test(url.hostname)
  } catch {
    return /instagram\.com|instagr\.am/i.test(u)
  }
}

function isYouTube(u: string) {
  try {
    const url = new URL(u)
    return /(^|\.)youtube\.com$/i.test(url.hostname) || /(^|\.)youtu\.be$/i.test(url.hostname) || /(^|\.)m\.youtube\.com$/i.test(url.hostname)
  } catch {
    return /youtube\.com|youtu\.be|m\.youtube\.com/i.test(u)
  }
}

function sanitizeFilename(s: string, fallback = "download") {
  const base = (s || fallback).trim().replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").slice(0, 120)
  return base || fallback
}

function guessExtFromUrl(url: string, fallback = "mp4") {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const m = pathname.match(/\.(mp4|mov|webm|mp3|m4a|jpg|jpeg|png|gif|webp)(\?|#|$)/)
    if (m) return m[1]
  } catch {}
  return fallback
}

function formatNumber(num: number | string) {
  const n = typeof num === "string" ? parseInt(num) : num
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

/**
 * Try to download as Blob (preferred for custom filename).
 * Falls back to direct <a download href> if CORS blocks the fetch.
 */
async function autoDownload(url: string, filenameBase: string, defaultExt = "mp4") {
  const ext = guessExtFromUrl(url, defaultExt)
  const filename = `${sanitizeFilename(filenameBase)}.${ext}`

  try {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    }, 250)
    return
  } catch {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener noreferrer"
    a.target = "_blank"
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 250)
  }
}

// ---------- Types ----------
type TikTokResponse = {
  status: "Success" | "Error"
  code: number
  message?: string
  result?: {
    platform: string
    aweme_id: string
    title: string
    create_time?: number
    author?: {
      uid: string
      username: string
      nickname: string
      signature?: string
      avatar?: { thumb?: string; medium?: string; ["300x300"]?: string }
      region?: string
      verified?: boolean
    }
    video?: {
      nwm_url?: string
      nwm_url_hq?: string
      wm_url?: string
      wm_url_hq?: string
      cover?: string
      origin_cover?: string
      dynamic_cover?: string
    }
    image_data?: Array<{ url: string; width?: number; height?: number }>
    music?: {
      id: string
      title: string
      author: string
      url?: string
      cover?: { thumb?: string; medium?: string; large?: string }
      duration?: number
      original_sound?: boolean
    }
    statistics?: {
      plays?: number
      likes?: number
      comments?: number
      shares?: number
      downloads?: number
      collections?: number
      reposts?: number
    }
    hashtags?: Array<{ hashtag_name: string }>
    region?: string
  }
}

type InstagramItem = {
  thumbnail_link: string
  download_link: string
}

type YouTubeResponse = {
  status: "Success" | "Error"
  code: number
  message?: string
  powered?: string
  result?: {
    publishedAt: string
    title: string
    channel: string
    channelId: string
    description: string
    thumbnails: {
      default: {
        url: string
        width: number
        height: number
      }
    }
    duration: string
    definition: string
    statistics: {
      viewCount: number
      likeCount: number
      favoriteCount: number
      commentCount: number
    }
    expired_url: string
    size: string
    url: string
  }
}

type AioData =
  | { type: "tiktok"; payload: NonNullable<TikTokResponse["result"]> }
  | { type: "instagram"; payload: InstagramItem[] }
  | { type: "youtube"; payload: NonNullable<YouTubeResponse["result"]> }

// ---------- Component ----------
export function AioDl({ open, onClose }: AioDlProps) {
  const [url, setUrl] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<AioData | null>(null)
  const [showPlatforms, setShowPlatforms] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else {
      setUrl("")
      setBusy(false)
      setError(null)
      setData(null)
      setShowPlatforms(false)
    }
  }, [open])

  const handleFetch = async () => {
    if (!url.trim()) {
      inputRef.current?.focus()
      return
    }
    setBusy(true)
    setError(null)
    setData(null)

    try {
      if (isTikTok(url)) {
        const endpoint = `https://api.maelyn.sbs/api/tiktok/download?url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint, { method: "GET", headers: { "mg-apikey": API_KEY } })
        const json: TikTokResponse = await res.json()

        if (res.ok && json.status === "Success" && json.result) {
          setData({ type: "tiktok", payload: json.result })
        } else {
          const msg =
            json?.message ||
            ({
              400: "Missing/invalid parameters.",
              403: "API key IP blocked.",
              404: "Post not found.",
              429: "Daily limit reached. Visit maelyn.tech/pricing.",
              500: "Server error. Try again later.",
            } as Record<number, string>)[json?.code || 0] ||
            `Error ${json?.code || res.status}`
          setError(msg)
        }
      } else if (isInstagram(url)) {
        const endpoint = `https://api.maelyn.sbs/api/instagram?url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint, { method: "GET", headers: { "mg-apikey": API_KEY } })
        const json = await res.json()

        if (res.ok && json.status === "Success" && Array.isArray(json.result)) {
          setData({ type: "instagram", payload: json.result as InstagramItem[] })
        } else {
          setError(json?.message || `Error ${json?.code || res.status}`)
        }
      } else if (isYouTube(url)) {
        const endpoint = `https://api.maelyn.sbs/api/youtube/video?url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint, { method: "GET", headers: { "mg-apikey": API_KEY } })
        const json: YouTubeResponse = await res.json()

        if (res.ok && json.status === "Success" && json.result) {
          setData({ type: "youtube", payload: json.result })
        } else {
          const msg =
            json?.message ||
            ({
              400: "Missing/invalid parameters.",
              403: "API key IP blocked.",
              404: "Video not found.",
              429: "Daily limit reached. Visit maelyn.tech/pricing.",
              500: "Server error. Try again later.",
            } as Record<number, string>)[json?.code || 0] ||
            `Error ${json?.code || res.status}`
          setError(msg)
        }
      } else {
        setError("Only TikTok, Instagram & YouTube supported now — more platforms coming soon.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const backdrop: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  const sheet: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
    exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.15 } },
  }

  // TikTok convenience
  const tt = data?.type === "tiktok" ? data.payload : null
  const cover =
    tt?.video?.cover || tt?.video?.origin_cover || tt?.video?.dynamic_cover || tt?.music?.cover?.thumb || undefined
  const hashtags = tt?.hashtags?.map((h) => `#${h.hashtag_name}`).join(" ")

  // YouTube convenience
  const yt = data?.type === "youtube" ? data.payload : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" variants={backdrop} onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl bg-card/95 border border-border/60 rounded-2xl shadow-2xl"
            variants={sheet}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">All-in-One Downloader</h3>
                  <p className="text-xs text-muted-foreground">TikTok, Instagram & YouTube supported</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Input */}
              <div>
                <label htmlFor="aiodl-url" className="text-sm font-medium text-foreground">
                  Paste URL
                </label>
                <input
                  id="aiodl-url"
                  ref={inputRef}
                  type="url"
                  placeholder="https://www.tiktok.com/@user/video/XXX • https://www.instagram.com/p/XXX • https://www.youtube.com/watch?v=XXX"
                  className="mt-2 w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
              )}

              {!data && (
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    {/* updated helper text */}
                    Paste a supported link • No account required
                  </div>
                  <motion.button
                    onClick={handleFetch}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    whileHover={{ scale: busy ? 1 : 1.02 }}
                    whileTap={{ scale: busy ? 1 : 0.98 }}
                  >
                    {busy ? "Loading..." : (
                      <>
                        <Download className="h-4 w-4" /> Get Links
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* TikTok UI */}
              {tt && (
                <div className="space-y-5">
                  {/* Header row */}
                  <div className="flex gap-3">
                    {cover ? (
                      <img src={cover} alt={tt.title} className="w-24 h-24 rounded-lg object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-muted/30 flex items-center justify-center">
                        <Video className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-3">{tt.title}</h4>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {tt.platform?.toUpperCase() || "TIKTOK"}
                      </div>

                      {tt.author && (
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">@{tt.author.username}</span>
                          {tt.author.verified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
                          <span className="text-muted-foreground">({tt.author.nickname})</span>
                        </div>
                      )}

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <LinkIcon className="h-3 w-3" /> Original Post
                      </a>
                    </div>
                  </div>

                  {/* Download buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tt.video?.nwm_url_hq && (
                      <button
                        onClick={() => autoDownload(tt.video!.nwm_url_hq!, `${tt.title || tt.aweme_id} (NoWM HQ)`, "mp4")}
                        className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4" /> MP4 (No-WM HQ)
                      </button>
                    )}

                    {tt.video?.nwm_url && (
                      <button
                        onClick={() => autoDownload(tt.video!.nwm_url!, `${tt.title || tt.aweme_id} (NoWM)`, "mp4")}
                        className="px-3 py-2 rounded-xl bg-primary/80 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4" /> MP4 (No-WM)
                      </button>
                    )}

                    {tt.video?.wm_url_hq && (
                      <button
                        onClick={() => autoDownload(tt.video!.wm_url_hq!, `${tt.title || tt.aweme_id} (WM HQ)`, "mp4")}
                        className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary/90"
                      >
                        <Download className="h-4 w-4" /> MP4 (Watermark HQ)
                      </button>
                    )}

                    {tt.video?.wm_url && (
                      <button
                        onClick={() => autoDownload(tt.video!.wm_url!, `${tt.title || tt.aweme_id} (WM)`, "mp4")}
                        className="px-3 py-2 rounded-xl bg-secondary/80 text-secondary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary/90"
                      >
                        <Download className="h-4 w-4" /> MP4 (Watermark)
                      </button>
                    )}

                    {tt.music?.url && (
                      <button
                        onClick={() => autoDownload(tt.music!.url!, `${tt.title || tt.aweme_id} (Audio)`, "mp3")}
                        className="px-3 py-2 rounded-xl bg-emerald-600/90 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-600"
                      >
                        <Music2 className="h-4 w-4" /> MP3 (Audio)
                      </button>
                    )}

                    {Array.isArray(tt.image_data) && tt.image_data.length > 0 && (
                      <button
                        onClick={() =>
                          autoDownload(tt.image_data![0].url, `${tt.title || tt.aweme_id} (Image 1)`, "jpg")
                        }
                        className="px-3 py-2 rounded-xl bg-amber-600/90 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-600"
                      >
                        <ImageIcon className="h-4 w-4" /> Download First Image
                      </button>
                    )}
                  </div>

                  {hashtags && <div className="text-xs text-muted-foreground break-words">{hashtags}</div>}
                </div>
              )}

              {/* YouTube UI */}
              {yt && (
                <div className="space-y-5">
                  {/* Header row */}
                  <div className="flex gap-3">
                    {yt.thumbnails?.default?.url ? (
                      <img src={yt.thumbnails.default.url} alt={yt.title} className="w-32 h-24 rounded-lg object-cover" />
                    ) : (
                      <div className="w-32 h-24 rounded-lg bg-muted/30 flex items-center justify-center">
                        <Play className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2">{yt.title}</h4>
                      <div className="mt-1 text-xs text-muted-foreground">YOUTUBE</div>

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-medium text-foreground">{yt.channel}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        {yt.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {yt.duration}
                          </div>
                        )}
                        {yt.statistics?.viewCount && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(yt.statistics.viewCount)} views
                          </div>
                        )}
                        {yt.definition && (
                          <div className="uppercase font-medium text-primary">
                            {yt.definition}
                          </div>
                        )}
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <LinkIcon className="h-3 w-3" /> Original Video
                      </a>
                    </div>
                  </div>

                  {/* Download button */}
                  <div className="space-y-3">
                    {yt.url && (
                      <button
                        onClick={() => autoDownload(yt.url!, yt.title, "mp4")}
                        className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600/90"
                      >
                        <Download className="h-4 w-4" />
                        Download MP4 {yt.size && `(${yt.size})`}
                      </button>
                    )}

                    {yt.statistics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {yt.statistics.viewCount && (
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Views</div>
                            <div className="text-sm font-semibold">{formatNumber(yt.statistics.viewCount)}</div>
                          </div>
                        )}
                        {yt.statistics.likeCount && (
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Likes</div>
                            <div className="text-sm font-semibold">{formatNumber(yt.statistics.likeCount)}</div>
                          </div>
                        )}
                        {yt.statistics.commentCount && (
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Comments</div>
                            <div className="text-sm font-semibold">{formatNumber(yt.statistics.commentCount)}</div>
                          </div>
                        )}
                        {yt.publishedAt && (
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Published</div>
                            <div className="text-sm font-semibold">{new Date(yt.publishedAt).getFullYear()}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instagram UI */}
              {data?.type === "instagram" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Instagram Media</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.payload.map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <img
                          src={item.thumbnail_link}
                          alt={`Instagram ${i}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => autoDownload(item.download_link, `instagram_${i + 1}`, "mp4")}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Supported Platforms Toggle (Bottom) ---- */}
              <div className="pt-2 border-t border-border/50">
                <button
                  onClick={() => setShowPlatforms((s) => !s)}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2"
                  aria-expanded={showPlatforms}
                >
                  {showPlatforms ? (
                    <>
                      <ChevronUp className="h-4 w-4" /> Hide supported platforms
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" /> Show supported platforms
                    </>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {showPlatforms && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      {/* tighter, left-to-right row, smaller icons */}
                      <div className="flex items-center gap-3 px-2 pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg"
                              alt="Instagram"
                              className="w-5 h-5"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">Instagram</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Tiktok_icon.svg"
                              alt="TikTok"
                              className="w-5 h-5"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">TikTok</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                            {/* YouTube kept as simple play-box look already in UI; using text label here */}
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg"
                              alt="YouTube"
                              className="w-8 h-4"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">YouTube</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
