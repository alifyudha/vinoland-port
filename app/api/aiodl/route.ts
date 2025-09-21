import { NextResponse } from "next/server"

const API = "https://api.maelyn.sbs/api"

function pickEndpoint(url: string) {
  const h = (() => { try { return new URL(url).hostname.toLowerCase() } catch { return "" } })()
  if (/tiktok\.com$|vt\.tiktok\.com$/.test(h) || /tiktok\.com|vt\.tiktok\.com/i.test(url))
    return `${API}/tiktok/download?url=${encodeURIComponent(url)}`
  if (/instagram\.com$|instagr\.am$/.test(h) || /instagram\.com|instagr\.am/i.test(url))
    return `${API}/instagram?url=${encodeURIComponent(url)}`
  if (/youtube\.com$|m\.youtube\.com$/.test(h) || h === "youtu.be" || /youtube\.com|youtu\.be/i.test(url))
    return `${API}/youtube/video?url=${encodeURIComponent(url)}`
  return null
}

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}))
  if (!url || typeof url !== "string")
    return NextResponse.json({ status: "Error", code: 400, message: "url is required" }, { status: 400 })

  const KEY = process.env.MAELYN_API
  if (!KEY)
    return NextResponse.json({ status: "Error", code: 500, message: "API key missing" }, { status: 500 })

  const endpoint = pickEndpoint(url)
  if (!endpoint)
    return NextResponse.json({ status: "Error", code: 422, message: "Unsupported platform" }, { status: 422 })

  try {
    const resp = await fetch(endpoint, {
      headers: { "mg-apikey": KEY },
      cache: "no-store",
    })
    const data = await resp.json().catch(() => null)
    return NextResponse.json(data ?? { status: "Error", code: 502, message: "Bad upstream JSON" }, { status: resp.status })
  } catch {
    return NextResponse.json({ status: "Error", code: 500, message: "Server fetch failed" }, { status: 500 })
  }
}
