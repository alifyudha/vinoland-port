import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.MAELYN_API

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const endpoint = `https://api.maelyn.sbs/api/instagram?url=${encodeURIComponent(url)}`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'mg-apikey': API_KEY,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || `HTTP ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Instagram API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}