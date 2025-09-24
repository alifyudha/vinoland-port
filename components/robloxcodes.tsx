"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Check, Copy, ExternalLink, Filter, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

// Lightweight helpers ---------------------------------------------------------
function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function stripHtml(html: string) {
  if (!html) return ""
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
}

function safeHtml(html: string) {
  if (!html) return ""
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
  const allowed = /<(\/?)(p|br|strong|em|b|i|u|ul|ol|li|code|pre|img)(\s+[^>]*)?>/gi
  out = out.replace(/<[^>]+>/gi, (m) => (m.match(allowed) ? m : ""))
  out = out.replace(/<img([^>]*)>/gi, (m, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const src = srcMatch ? srcMatch[1] : ""
    const alt = altMatch ? altMatch[1] : ""
    if (!/^https:\/\/static\.robloxden\.com\//.test(src)) return ""
    return `<img src="${src}" alt="${alt}" class="max-w-full rounded-lg border border-border/60 my-2">`
  })
  return out
}

interface ApiCode {
  _id: string
  active: boolean
  code: string
  description?: string
  notice?: string[]
  createdAt?: string
  updatedAt?: string
}

interface ApiGameItem {
  _id: string
  slug: string
  name: string
  published_at?: string
  gameCodes: ApiCode[]

  howTo?: string
  game?: {
    url?: string
    description?: string
    name?: string
    images?: string[]
    primaryImage?: {
      url?: string
      formats?: { thumbnail?: { url: string } }
    }
  }
}

export function RobloxCodes({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ApiGameItem[]>([])
  const [onlyActive, setOnlyActive] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the search input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length === 0) {
      setResults([])
      setError(null)
      return
    }

    let aborted = false
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `https://robloxden.com/api/game-codes/search?searchTerm=${encodeURIComponent(q)}`
        const r = await fetch(url, { cache: "no-store" })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data: ApiGameItem[] = await r.json()
        if (!aborted) setResults(Array.isArray(data) ? data : [])
      } catch (e: any) {
        // Helpful hint for potential CORS issues
        setError(
          (e?.message || "Failed to fetch") +
            " — Sorry report to owner if this issue persists."
        )
        setResults([])
      } finally {
        if (!aborted) setLoading(false)
      }
    }, 300)
    return () => {
      aborted = true
      clearTimeout(handle)
    }
  }, [query, open])

  const filtered = useMemo(() => {
    if (!onlyActive) return results
    return results.map((g) => ({ ...g, gameCodes: g.gameCodes.filter((c) => !!c.active) }))
  }, [results, onlyActive])

  const totalCodes = useMemo(
    () => filtered.reduce((acc, g) => acc + g.gameCodes.length, 0),
    [filtered]
  )

  const toggleExpand = (slug: string) => setExpanded((m) => ({ ...m, [slug]: !m[slug] }))

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  const close = () => {
    setQuery("")
    setResults([])
    setError(null)
    onClose()
  }

  // helpers for thumbnail and roblox link
  const getThumb = (g: ApiGameItem): string | null => {
    const fromPrimary = g.game?.primaryImage?.formats?.thumbnail?.url || g.game?.primaryImage?.url
    return fromPrimary || null
  }
  const getRobloxGameUrl = (g: ApiGameItem): string | null => g.game?.url || null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

          {/* Sheet / Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full sm:max-w-3xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 z-10"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Roblox Codes</h3>
              <button
                onClick={close}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a Roblox game (e.g., Blox Fruits, Anime...)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition"
                  aria-label="Search roblox games"
                />
              </div>

              <button
                onClick={() => setOnlyActive((v) => !v)}
                className={classNames(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition",
                  onlyActive
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/40 text-foreground border-border/60"
                )}
                aria-pressed={onlyActive}
                title="Toggle only active codes"
              >
                <Filter className="h-4 w-4" /> {onlyActive ? "Only Active" : "All Codes"}
              </button>
            </div>

            {/* Status line */}
            <div className="min-h-[24px] text-xs text-muted-foreground mb-2">
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : query.trim().length === 0 ? (
                <span>Type a game name to search codes.</span>
              ) : (
                <span>
                  Found <b>{filtered.length}</b> game{filtered.length === 1 ? "" : "s"} • <b>{totalCodes}</b> code{totalCodes === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {/* Results list */}
            <div className="max-h-[65vh] overflow-y-auto pr-1 -mr-1">
              {filtered.map((g) => {
                const isOpen = !!expanded[g.slug]
                const activeCount = g.gameCodes.filter((c) => c.active).length
                const thumb = getThumb(g)
                const robloxUrl = getRobloxGameUrl(g)
                return (
                  <motion.div key={g._id} className="mb-2 border border-border/60 rounded-xl overflow-hidden bg-card/70">
                    <button
                      onClick={() => toggleExpand(g.slug)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/40"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-muted/60 border border-border/60">
                          {thumb ? (
                            <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground truncate max-w-[52vw] sm:max-w-[28rem]">{g.name}</span>
                            {robloxUrl && (
                              <a
                                className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                                href={robloxUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                onClick={(e) => e.stopPropagation()}
                              >
                                GAME <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {g.gameCodes.length} code{g.gameCodes.length === 1 ? "" : "s"}
                            {onlyActive && ` • ${activeCount} active`}
                          </div>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border/60"
                        >
                          {/* About & How to redeem */}
                          {(g.game?.description || g.howTo) && (
                            <div className="px-4 pt-3 pb-2 grid gap-3 sm:grid-cols-2">
                              {g.game?.description && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">About</h4>
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{stripHtml(g.game.description)}</p>
                                </div>
                              )}
                              {g.howTo && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">How to Redeem</h4>
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted/60"
                                    dangerouslySetInnerHTML={{ __html: safeHtml(g.howTo) }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {g.gameCodes.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground">No codes.</div>
                          ) : (
                            <ul className="divide-y divide-border/60">
                              {g.gameCodes.map((c) => (
                                <li key={c._id} className="px-4 py-3 flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <code className="px-2 py-0.5 rounded bg-muted/60 text-foreground text-xs font-semibold">
                                        {c.code}
                                      </code>
                                      {c.active ? (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-500 border border-green-500/30">
                                          <Check className="h-3 w-3" /> active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                          inactive
                                        </span>
                                      )}
                                    </div>
                                    {c.description && (
                                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                        {stripHtml(c.description)}
                                      </p>
                                    )}
                                    {Array.isArray(c.notice) && c.notice.length > 0 && (
                                      <p className="text-[11px] text-amber-500 mt-1">{c.notice.join(" ")}</p>
                                    )}
                                    {(c.updatedAt || c.createdAt) && (
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        {c.updatedAt ? `Updated ${new Date(c.updatedAt).toLocaleDateString()}` : `Added ${new Date(c.createdAt as string).toLocaleDateString()}`}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => copy(c.code)}
                                    className="shrink-0 h-8 px-3 rounded-lg border border-border/60 hover:bg-muted/50 text-sm inline-flex items-center gap-2"
                                    aria-label={`Copy ${c.code}`}
                                  >
                                    <Copy className="h-4 w-4" /> Copy
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              {!loading && query.trim() && filtered.length === 0 && !error && (
                <div className="text-sm text-muted-foreground py-6 text-center">No games found for “{query}”.</div>
              )}
            </div>

            {/* Footer hint */}
            <div className="mt-3 text-[11px] text-muted-foreground/80">
              Get urself a working code for ur roblox games • all of the code was checked.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}