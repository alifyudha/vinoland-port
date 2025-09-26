"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  Search,
  Gamepad2,
  Download,
  ExternalLink,
  X,
  RefreshCw,
  FolderOpen,
  ChevronDown,
} from "lucide-react"

interface FileEntryRaw {
  name: string
  href: string
  size: string
  date: string
  is_directory: boolean
}

interface CategoryRaw {
  category_name: string
  category_url: string
  total_files: number
  total_directories: number
  files: FileEntryRaw[]
}

interface ApiShape {
  scrape_info: {
    base_url: string
    total_categories: number
    scrape_date: string
  }
  categories: Record<string, CategoryRaw>
}

export interface RetroGamesProps {
  open: boolean
  onClose: () => void
}

interface FlatRomRow {
  id: string
  category: string
  categoryUrl: string
  name: string
  href: string
  size: string
  date: string
  url: string
}

const dropIn: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } },
}

export function RetroGames({ open, onClose }: RetroGamesProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<FlatRomRow[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [showCount, setShowCount] = useState(100)
  const [scrapeInfo, setScrapeInfo] = useState<{ date?: string; total?: number } | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (rows.length > 0) return
    setLoading(true)

    fetch("/api/retrogames", { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Proxy HTTP ${r.status}`)
        const data: ApiShape = await r.json()
        const flat: FlatRomRow[] = []
        const cats = data.categories || {}
        for (const key of Object.keys(cats)) {
          const c = cats[key]
          const cUrl = ensureTrailingSlash(c.category_url)
          for (const f of c.files) {
            if (f.is_directory) continue
            flat.push({
              id: `${c.category_name}::${f.href}`,
              category: c.category_name,
              categoryUrl: cUrl,
              name: f.name,
              href: f.href,
              size: f.size,
              date: f.date,
              url: cUrl + f.href,
            })
          }
        }
        flat.sort((a, b) =>
          a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category),
        )
        setRows(flat)
        setScrapeInfo({ date: (data as any)?.scrape_info?.scrape_date, total: flat.length })
      })
      .catch((e: any) => {
        setError(e?.message || "Failed to load ROMs index")
      })
      .finally(() => setLoading(false))
  }, [open, rows.length])

  // Reset visible count on query/category change
  useEffect(() => {
    setShowCount(100)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [query, category])

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category))
    return ["All", ...Array.from(set)]
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (category !== "All" && r.category !== category) return false
      if (!q) return true
      // allow simple token matching across name + category
      const hay = `${r.name} ${r.category}`.toLowerCase()
      return q
        .split(/\s+/)
        .filter(Boolean)
        .every((tok) => hay.includes(tok))
    })
  }, [rows, query, category])

  const visible = filtered.slice(0, showCount)

  const loadMore = () => setShowCount((c) => Math.min(c + 200, filtered.length))

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={closeOnBackdrop}
        >
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl sm:rounded-2xl sm:mx-4 bg-card border border-border/60 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Retro Games ROMs"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 bg-gradient-to-b from-background/60 to-background">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold leading-tight truncate text-foreground">
                  Retro Games ROM
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {scrapeInfo?.total ? `${scrapeInfo.total.toLocaleString()} files indexed` : "Indexed mirror"}
                  {scrapeInfo?.date ? ` • Snapshot: ${scrapeInfo.date}` : null}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="px-4 sm:px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 border-b border-border/60">
              <div className="md:col-span-7 lg:col-span-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ROMs by title, system… (e.g., Metal Gear Solid PS1)`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition text-sm"
                  autoFocus
                />
              </div>

              <div className="md:col-span-5 lg:col-span-4">
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  options={categories}
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-3">
              {loading ? (
                <LoadingBlock />
              ) : error ? (
                <ErrorBlock message={error} onRetry={() => window.location.reload()} />
              ) : (
                <div className="border border-border/60 rounded-xl overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                    <div>Title</div>
                    <div className="px-2">Size</div>
                    <div className="px-2">Action</div>
                  </div>

                  <div ref={scrollRef} className="max-h-[60vh] sm:max-h-[55vh] overflow-auto divide-y divide-border/60">
                    {visible.map((r) => (
                      <RomRow key={r.id} row={r} />
                    ))}

                    {visible.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">No results found.</div>
                    )}
                  </div>

                  {visible.length < filtered.length && (
                    <div className="p-3 bg-background/60 border-t border-border/60 flex items-center justify-center">
                      <button
                        onClick={loadMore}
                        className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Load more ({filtered.length - visible.length} left)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-border/60 text-[11px] sm:text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1"><FolderOpen className="h-3.5 w-3.5"/> Source:</span>
              <a
                href="https://myrient.erista.me/files/Redump/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                myrient.erista.me <ExternalLink className="inline h-3 w-3" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : url + "/"
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
      <RefreshCw className="h-5 w-5 animate-spin" />
      <span className="text-sm">Loading ROM index…</span>
    </div>
  )
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90">
        Retry
      </button>
    </div>
  )
}

function CategorySelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      if (!btnRef.current) return
      if (!(e.target instanceof Node)) return
      if (!btnRef.current.parentElement?.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 rounded-xl bg-card border border-border/60 text-left flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-sm">
          {value === "All" ? "All Systems" : value}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border/60 bg-background shadow-lg"
            role="listbox"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 ${
                  opt === value ? "bg-muted/40" : ""
                }`}
                role="option"
                aria-selected={opt === value}
              >
                {opt === "All" ? "All Systems" : opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RomRow({ row }: { row: FlatRomRow }) {
  return (
    <div className="p-3 grid sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
      <div className="min-w-0">
        <div className="text-sm text-foreground truncate font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground truncate">{row.category}</div>
      </div>

      <div className="text-xs sm:text-sm text-muted-foreground sm:text-right px-2">{row.size}</div>

      <div className="flex items-center gap-2 justify-end">
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </a>
        <a
          href={row.categoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-border/60 hover:bg-muted/50"
          title="Open folder"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Folder
        </a>
      </div>
    </div>
  )
}
