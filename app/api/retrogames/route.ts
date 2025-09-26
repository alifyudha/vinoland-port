import { NextResponse } from "next/server"

const DATA_URL = "https://raw.githubusercontent.com/alifyudha/myrient-scrape/main/roms.json"

export const revalidate = 60 * 60 * 24

export async function GET() {
  try {
    const res = await fetch(DATA_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 })
    }

    const body = await res.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "access-control-allow-origin": "*",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
