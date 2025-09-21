import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  console.log("📩 Incoming URL:", url)
  console.log("🔑 MAELYN_API exists?", !!process.env.MAELYN_API)

  if (!url || typeof url !== "string") {
    return NextResponse.json({ status: "Error", code: 400, message: "url is required" }, { status: 400 })
  }

  const KEY = process.env.MAELYN_API
  if (!KEY) {
    return NextResponse.json({ status: "Error", code: 500, message: "API key missing (MAELYN_API)" }, { status: 500 })
  }

  const endpoint = pickEndpoint(url)
  console.log("📡 Fetching:", endpoint)

  if (!endpoint) {
    return NextResponse.json({ status: "Error", code: 422, message: "Unsupported platform" }, { status: 422 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: { "mg-apikey": KEY },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await resp.json().catch(() => null)

    console.log("✅ Upstream status:", resp.status)

    if (!resp.ok) {
      return NextResponse.json(
        { status: "Error", code: resp.status, message: data?.message || "Upstream error" },
        { status: resp.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    clearTimeout(timeout)
    console.error("❌ Fetch error:", err)
    if (err?.name === "AbortError") {
      return NextResponse.json({ status: "Error", code: 504, message: "Upstream request timed out" }, { status: 504 })
    }
    return NextResponse.json({ status: "Error", code: 500, message: String(err) }, { status: 500 })
  }
}
