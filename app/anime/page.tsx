"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

type Site = {
  id: string
  name: string
  url: string
  desc: string
  tags: string[]         // e.g. ["Free","Sub","Dub","YouTube","Subscription"]
  region: "Global" | "SEA" | "Indonesia"
  image?: string
}

const SITES: Site[] = [
  {
    id: "cr",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com/",
    desc: "Huge catalog; subs/dubs; subscription with some free trials.",
    tags: ["Sub", "Dub", "Subscription"],
    region: "Global",
    image: "/anime/sites/crunchyroll.jpg",
  },
  {
    id: "bili-sea",
    name: "Bstation (Bilibili SEA)",
    url: "https://www.bilibili.tv/en",
    desc: "SEA catalog with lots of free titles (ads) + premium.",
    tags: ["Free", "Sub", "Subscription"],
    region: "SEA",
    image: "/anime/sites/bili.jpg",
  },
  {
    id: "ani-one",
    name: "Ani-One Asia (YouTube)",
    url: "https://www.youtube.com/@AniOneAsia",
    desc: "Legit simulcasts on YouTube; free with ads (region dependent).",
    tags: ["Free", "Sub", "YouTube"],
    region: "SEA",
    image: "/anime/sites/anione.jpg",
  },
  {
    id: "muse",
    name: "Muse Asia (YouTube)",
    url: "https://www.youtube.com/@MuseAsia",
    desc: "Free licensed anime on YouTube for SEA; ads supported.",
    tags: ["Free", "Sub", "YouTube"],
    region: "SEA",
    image: "/anime/sites/muse.jpg",
  },
  {
    id: "iqiyi",
    name: "iQIYI",
    url: "https://www.iq.com/",
    desc: "Anime & Asian shows; free + VIP; SEA availability.",
    tags: ["Free", "Sub", "Subscription"],
    region: "SEA",
    image: "/anime/sites/iqiyi.jpg",
  },
  {
    id: "vidio",
    name: "Vidio (Indonesia)",
    url: "https://www.vidio.com/",
    desc: "Local streaming; some anime channels & events.",
    tags: ["Subscription", "Sub"],
    region: "Indonesia",
    image: "/anime/sites/vidio.jpg",
  },
  {
    id: "netflix",
    name: "Netflix Anime",
    url: "https://www.netflix.com/id/browse/genre/7424",
    desc: "Curated anime collection; subs/dubs; subscription.",
    tags: ["Sub", "Dub", "Subscription"],
    region: "Global",
    image: "/anime/sites/netflix.jpg",
  },
]

export default function AnimeStreamingPage() {
  const [query, setQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(true) // hide/show panel
  const [onlyFree, setOnlyFree] = useState(false)
  const [includeSubs, setIncludeSubs] = useState(true)
  const [includeDubs, setIncludeDubs] = useState(true)
  const [includeYouTube, setIncludeYouTube] = useState(true)
  const [includeSubscription, setIncludeSubscription] = useState(true)
  const [region, setRegion] = useState<"All" | "Global" | "SEA" | "Indonesia">("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SITES.filter((s) => {
      if (onlyFree && !s.tags.includes("Free")) return false
      if (!includeSubs && s.tags.includes("Sub")) return false
      if (!includeDubs && s.tags.includes("Dub")) return false
      if (!includeYouTube && s.tags.includes("YouTube")) return false
      if (!includeSubscription && s.tags.includes("Subscription")) return false
      if (region !== "All" && s.region !== region) return false

      if (!q) return true
      const hay = (s.name + " " + s.desc + " " + s.tags.join(" ") + " " + s.region).toLowerCase()
      return hay.includes(q)
    })
  }, [query, onlyFree, includeSubs, includeDubs, includeYouTube, includeSubscription, region])

  return (
    <div className="min-h-screen w-full py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Anime Streaming</h1>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-card/90 transition-colors text-sm"
          >
            <Filter className="h-4 w-4" />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sites (name, region, tags)…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition"
            aria-label="Search anime sites"
          />
        </div>

        {/* Filters (hide/show) */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 mb-6"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-current" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
                  Only Free
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-current" checked={includeSubs} onChange={(e) => setIncludeSubs(e.target.checked)} />
                  Include Subbed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-current" checked={includeDubs} onChange={(e) => setIncludeDubs(e.target.checked)} />
                  Include Dubbed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-current" checked={includeYouTube} onChange={(e) => setIncludeYouTube(e.target.checked)} />
                  Include YouTube
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-current"
                    checked={includeSubscription}
                    onChange={(e) => setIncludeSubscription(e.target.checked)}
                  />
                  Include Subscription
                </label>

                <div className="sm:col-span-2 lg:col-span-1">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border/60 text-sm"
                    aria-label="Region filter"
                  >
                    <option value="All">Region: All</option>
                    <option value="Global">Region: Global</option>
                    <option value="SEA">Region: SEA</option>
                    <option value="Indonesia">Region: Indonesia</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No results. Try changing filters or your search.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, idx) => (
              <motion.a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={s.image || "/placeholder.svg"}
                    alt={s.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">{s.region}</span>
                    {s.tags.map((t) => (
                      <span key={t} className="px-2 py-1 rounded-full bg-muted text-foreground/80 text-xs border border-border/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
