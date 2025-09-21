import { NextResponse } from "next/server"

// ===== Runtime / caching =====
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// ===== Config =====
const API_BASE = "https://api.maelyn.sbs"
const API_KEY = process.env.MAELYN_API

// ===== Utils =====
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
    return (
      /(^|\.)youtube\.com$/i.test(url.hostname) ||
      /(^|\.)youtu\.be$/i.test(url.hostname) ||
      /(^|\.)m\.youtube\.com$/i.test(url.hostname)
    )
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

function isSafePublicUrl(u: string) {
  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    return false
  }
  if (!/^https?:$/i.test(parsed.protocol)) return false
  const host = parsed.hostname
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("169.254.") ||
    host.endsWith(".internal")
  ) {
    return false
  }
  return true
}

// ===== Types =====
type TikTokResult = {
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

type InstagramItem = { thumbnail_link: string; download_link: string }

type YouTubeResult = {
  publishedAt: string
  title: string
  channel: string
  channelId: string
  description: string
  thumbnails?: { default?: { url: string; width: number; height: number } }
  duration?: string
  definition?: string
  statistics?: { viewCount?: number; likeCount?: number; favoriteCount?: number; commentCount?: number }
  expired_url?: string
  size?: string
  url?: string
}

type Normalized =
  | { status: "Success"; type: "tiktok"; result: TikTokResult }
  | { status: "Success"; type: "instagram"; result: InstagramItem[] }
  | { status: "Success"; type: "youtube"; result: YouTubeResult }
  | { status: "Error"; code: number; message: string }

async function fetchTikTok(url: string): Promise<Normalized> {
  const endpoint = `${API_BASE}/api/tiktok/download?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { "mg-apikey": API_KEY } })
  const json = await res.json().catch(() => ({}))
  if (res.ok && json?.status === "Success" && json?.result) {
    return { status: "Success", type: "tiktok", result: json.result as TikTokResult }
  }
  const code = json?.code ?? res.status
  const message =
    json?.message ||
    ({
      400: "Missing/invalid parameters.",
      403: "API key IP blocked.",
      404: "Post not found.",
      429: "Daily limit reached. Visit maelyn.tech/pricing.",
      500: "Server error. Try again later.",
    } as Record<number, string>)[code] ||
    `TikTok: Error ${code}`
  return { status: "Error", code, message }
}

async function fetchInstagram(url: string): Promise<Normalized> {
  const endpoint = `${API_BASE}/api/instagram?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { "mg-apikey": API_KEY } })
  const json = await res.json().catch(() => ({}))
  if (res.ok && json?.status === "Success" && Array.isArray(json?.result)) {
    return { status: "Success", type: "instagram", result: json.result as InstagramItem[] }
  }
  const code = json?.code ?? res.status
  const message = json?.message || `Instagram: Error ${code}`
  return { status: "Error", code, message }
}

async function fetchYouTube(url: string): Promise<Normalized> {
  const endpoint = `${API_BASE}/api/youtube/video?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { "mg-apikey": API_KEY } })
  const json = await res.json().catch(() => ({}))
  if (res.ok && json?.status === "Success" && json?.result) {
    return { status: "Success", type: "youtube", result: json.result as YouTubeResult }
  }
  const code = json?.code ?? res.status
  const message =
    json?.message ||
    ({
      400: "Missing/invalid parameters.",
      403: "API key IP blocked.",
      404: "Video not found.",
      429: "Daily limit reached. Visit maelyn.tech/pricing.",
      500: "Server error. Try again later.",
    } as Record<number, string>)[code] ||
    `YouTube: Error ${code}`
  return { status: "Error", code, message }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const url = typeof body?.url === "string" ? body.url.trim() : ""

    if (!url) {
      return NextResponse.json({ status: "Error", code: 400, message: "Body { url } is required." }, { status: 400 })
    }

    let out: Normalized
    if (isTikTok(url)) out = await fetchTikTok(url)
    else if (isInstagram(url)) out = await fetchInstagram(url)
    else if (isYouTube(url)) out = await fetchYouTube(url)
    else
      return NextResponse.json(
        { status: "Error", code: 422, message: "Only TikTok, Instagram & YouTube are supported for now." },
        { status: 422 }
      )

    if (out.status === "Success") return NextResponse.json(out, { status: 200 })
    const http = out.code && out.code >= 400 && out.code < 600 ? out.code : 500
    return NextResponse.json(out, { status: http })
  } catch {
    return NextResponse.json(
      { status: "Error", code: 500, message: "Server error." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wantProxy = searchParams.get("proxy")

  if (!wantProxy) {
    return NextResponse.json(
      {
        status: "Success",
        message:
          "AIODL API route. Use POST {url} to detect & fetch. For binary proxy, call GET ?proxy=1&url=...&filename=...",
      },
      { status: 200 }
    )
  }

  const target = searchParams.get("url") || ""
  const filenameParam = searchParams.get("filename") || "download"

  if (!target) {
    return NextResponse.json({ status: "Error", code: 400, message: "Missing query param: url" }, { status: 400 })
  }
  if (!isSafePublicUrl(target)) {
    return NextResponse.json({ status: "Error", code: 400, message: "Unsafe or invalid target URL." }, { status: 400 })
  }

  try {
    const upstream = await fetch(target, { method: "GET", redirect: "follow" })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { status: "Error", code: upstream.status || 502, message: `Upstream fetch failed (${upstream.status}).` },
        { status: upstream.status || 502 }
      )
    }

    const ct = upstream.headers.get("content-type") || "application/octet-stream"
    const ext =
      guessExtFromUrl(target) ||
      (ct.includes("mp4") ? "mp4" : ct.includes("jpeg") ? "jpg" : ct.includes("png") ? "png" : "bin")
    const filename = `${sanitizeFilename(filenameParam)}.${ext}`

    const headers = new Headers()
    headers.set("Content-Type", ct)
    const len = upstream.headers.get("content-length")
    if (len) headers.set("Content-Length", len)
    headers.set("Cache-Control", "private, max-age=0, must-revalidate")
    headers.set("Content-Disposition", `attachment; filename="${filename}"`)

    return new Response(upstream.body, { status: 200, headers })
  } catch {
    return NextResponse.json(
      { status: "Error", code: 500, message: "Proxy error." },
      { status: 500 }
    )
  }
}
