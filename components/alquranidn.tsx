"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Volume2,
  RefreshCcw
} from "lucide-react"

type AyahItem = {
  ar: string
  id: string
  nomor: string // verse number inside surah
  tr?: string
}

type SurahItem = {
  nomor: string // numeric string, e.g. "1"
  nama: string
  asma: string
  ayat: AyahItem[]
  type: "mekah" | "madinah" | string
  urut: string
  rukuk: string
  arti: string
  keterangan: string
  audio: string
}

interface AlQuranIdnProps {
  open: boolean
  onClose: () => void
}

// Single offline JSON (all surahs + verses)
const OFFLINE_DATA_URL =
  "https://raw.githubusercontent.com/bachors/Al-Quran-ID-API/refs/heads/master/offline/data.json"

function toHttps(url: string) {
  try {
    return url.startsWith("http://") ? url.replace(/^http:\/\//i, "https://") : url
  } catch {
    return url
  }
}

function stripHtml(s?: string) {
  if (!s) return ""
  return s.replace(/<[^>]*>/g, "")
}

export function AlQuranIdn({ open, onClose }: AlQuranIdnProps) {
  const [surahs, setSurahs] = React.useState<SurahItem[]>([])
  const [surahQuery, setSurahQuery] = React.useState("")
  const [loadingList, setLoadingList] = React.useState(false)
  const [errorList, setErrorList] = React.useState<string | null>(null)

  const [activeSurah, setActiveSurah] = React.useState<SurahItem | null>(null)
  const [verses, setVerses] = React.useState<AyahItem[] | null>(null)
  const [loadingSurah, setLoadingSurah] = React.useState(false)
  const [errorSurah, setErrorSurah] = React.useState<string | null>(null)

  const [showTranslit, setShowTranslit] = React.useState(false)
  const [ayahQuery, setAyahQuery] = React.useState("")
  const [isMobile, setIsMobile] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch ALL data once on open (from offline JSON)
  React.useEffect(() => {
    let cancelled = false
    async function run() {
      if (!open || surahs.length) return
      setLoadingList(true)
      setErrorList(null)
      try {
        const res = await fetch(OFFLINE_DATA_URL, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SurahItem[] = await res.json()
        if (!cancelled) setSurahs(data)
      } catch (e: any) {
        if (!cancelled) setErrorList(e?.message || "Gagal memuat data Quran offline.")
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, surahs.length])

  // "Load" a surah now just selects from the already-fetched dataset
  const loadSurah = React.useCallback(async (s: SurahItem) => {
    setActiveSurah(s)
    setVerses(null)
    setAyahQuery("")
    setErrorSurah(null)
    setLoadingSurah(true)
    try {
      // No network call needed—verses are inside s.ayat
      setVerses(s.ayat)
      // scroll to top of verses panel
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" }))
    } catch (e: any) {
      setErrorSurah(e?.message || "Gagal memuat ayat.")
    } finally {
      setLoadingSurah(false)
    }
  }, [])

  // filtered lists
  const filteredSurahs = React.useMemo(() => {
    const q = surahQuery.trim().toLowerCase()
    if (!q) return surahs
    return surahs.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.asma.toLowerCase().includes(q) ||
      s.arti.toLowerCase().includes(q) ||
      s.nomor === q
    )
  }, [surahs, surahQuery])

  const filteredAyah = React.useMemo(() => {
    if (!verses) return null
    const q = ayahQuery.trim().toLowerCase()
    if (!q) return verses
    return verses.filter(v =>
      v.ar.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      stripHtml(v.tr).toLowerCase().includes(q) ||
      v.nomor === q
    )
  }, [verses, ayahQuery])

  const goPrev = () => {
    if (!activeSurah) return
    const curr = parseInt(activeSurah.nomor, 10)
    const prev = curr <= 1 ? 114 : curr - 1
    const found = surahs.find(s => parseInt(s.nomor, 10) === prev)
    if (found) loadSurah(found)
  }

  const goNext = () => {
    if (!activeSurah) return
    const curr = parseInt(activeSurah.nomor, 10)
    const next = curr >= 114 ? 1 : curr + 1
    const found = surahs.find(s => parseInt(s.nomor, 10) === next)
    if (found) loadSurah(found)
  }

  const copyAyah = async (v: AyahItem) => {
    const text = `${v.ar}\n${v.id}\n(${activeSurah?.nama} ${activeSurah?.nomor}:${v.nomor})`
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  React.useEffect(() => {
    if (!open) {
      // reset when closed
      setActiveSurah(null)
      setVerses(null)
      setSurahQuery("")
      setAyahQuery("")
      setShowTranslit(false)
      setErrorList(null)
      setErrorSurah(null)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={`relative z-10 w-full bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden ${
              isMobile ? 'max-w-sm h-[80vh] max-h-[80vh]' : 'max-w-6xl max-h-[90vh]'
            }`}
            initial={{ y: 30, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            role="dialog"
            aria-modal="true"
            aria-label="AL Quran Indonesia"
            style={{ 
              touchAction: 'auto',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-none">AL Quran Indonesia</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                    Baca per surat/ayat + terjemahan Indonesia & audio
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted/50 transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className={`${isMobile ? 'flex flex-col h-full' : 'grid grid-cols-1 lg:grid-cols-3'} gap-0`}>
              {/* Left: Surah list */}
              <div className={`${isMobile ? (activeSurah ? 'hidden' : 'flex flex-col min-h-0') : ''} lg:border-r border-border/60`}>
                <div className="p-3 sm:p-4 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={surahQuery}
                      onChange={(e) => setSurahQuery(e.target.value)}
                      placeholder={isMobile ? "Cari surat…" : "Cari surat (nama/asma/arti/nomor)…"}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition text-sm"
                      aria-label="Cari surat"
                    />
                  </div>
                </div>

                <div 
                  className={`overflow-auto px-2 pb-2 flex-1 min-h-0 ${isMobile ? '' : 'h-[28rem] sm:h-[32rem]'}`}
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y'
                  }}
                >
                  {loadingList && (
                    <div className="px-4 py-6 text-sm text-muted-foreground">Memuat daftar surat…</div>
                  )}
                  {errorList && (
                    <div className="px-4 py-6 text-sm text-red-500 flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      {errorList}
                    </div>
                  )}
                  {!loadingList && !errorList && filteredSurahs.map((s) => {
                    const isActive = activeSurah?.nomor === s.nomor
                    return (
                      <button
                        key={s.nomor}
                        onClick={() => loadSurah(s)}
                        className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-xl mb-1 border transition touch-manipulation
                          ${isActive ? "bg-primary/10 border-primary/30" : "bg-card border-border/60 hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {s.nomor}. {s.nama}
                              <span className="ml-2 text-xs text-muted-foreground">({s.asma})</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {s.arti} • {s.ayat.length} ayat • {s.type}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right: Verses */}
              <div className={`${isMobile ? (activeSurah ? 'flex flex-col min-h-0 flex-1' : 'hidden') : 'lg:col-span-2'}`}>
                {activeSurah ? (
                  <>
                    {/* Mobile back button */}
                    {isMobile && (
                      <div className="p-3 border-b border-border/60 flex-shrink-0">
                        <button
                          onClick={() => setActiveSurah(null)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition touch-manipulation"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Kembali ke daftar surat
                        </button>
                      </div>
                    )}

                    {/* Surah header */}
                    <div className="p-3 sm:p-4 border-b border-border/60 flex-shrink-0">
                      <div className="mb-3">
                        <div className="text-base font-semibold text-foreground">
                          {activeSurah.nomor}. {activeSurah.nama} 
                          <span className="text-sm text-muted-foreground ml-2">({activeSurah.asma})</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeSurah.arti} • {activeSurah.ayat.length} ayat • {activeSurah.type}
                        </div>
                      </div>

                      {/* Audio */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Audio Murottal</span>
                        </div>
                        <audio
                          controls
                          preload="none"
                          className="w-full h-8 sm:h-auto"
                          src={toHttps(activeSurah.audio)}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          onClick={() => setShowTranslit(v => !v)}
                          className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs sm:text-sm transition touch-manipulation"
                        >
                          {showTranslit ? "Sembunyikan Transliterasi" : "Tampilkan Transliterasi"}
                        </button>
                        
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={goPrev}
                            className="px-3 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted/70 transition text-xs sm:text-sm touch-manipulation"
                            aria-label="Surat sebelumnya"
                          >
                            <ChevronLeft className="h-4 w-4 inline -mt-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">Sebelumnya</span>
                          </button>
                          <button
                            onClick={goNext}
                            className="px-3 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted/70 transition text-xs sm:text-sm touch-manipulation"
                            aria-label="Surat selanjutnya"
                          >
                            <span className="hidden sm:inline">Selanjutnya</span>
                            <ChevronRight className="h-4 w-4 inline -mt-0.5 sm:ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ayah search */}
                    <div className="p-3 sm:p-4 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          value={ayahQuery}
                          onChange={(e) => setAyahQuery(e.target.value)}
                          placeholder={isMobile ? "Cari ayat…" : "Cari pada ayat (Arab/ID/transliterasi/nomor)…"}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition text-sm"
                          aria-label="Cari ayat"
                        />
                      </div>
                    </div>

                    {/* Verses list */}
                    <div 
                      ref={listRef} 
                      className={`overflow-auto px-3 sm:px-4 flex-1 min-h-0 ${
                        isMobile ? '' : 'h-[20rem] sm:h-[24rem]'
                      }`}
                      style={{ 
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y',
                        paddingBottom: isMobile ? '4rem' : '1.5rem'
                      }}
                    >
                      {loadingSurah && (
                        <div className="px-1 py-6 text-sm text-muted-foreground">Memuat ayat…</div>
                      )}
                      {errorSurah && (
                        <div className="px-1 py-6 text-sm text-red-500 flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4" />
                          {errorSurah}
                        </div>
                      )}
                      {!loadingSurah && !errorSurah && filteredAyah?.map((v, index) => (
                        <div
                          key={v.nomor}
                          className={`mb-4 rounded-xl border border-border/60 p-3 bg-card ${
                            index === filteredAyah.length - 1 && isMobile ? 'mb-8' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-medium text-muted-foreground pt-1">
                              {activeSurah.nomor}:{v.nomor}
                            </div>
                            <button
                              onClick={() => copyAyah(v)}
                              className="p-2 rounded-lg hover:bg-muted/70 transition touch-manipulation"
                              aria-label={`Copy ${activeSurah.nomor}:${v.nomor}`}
                            >
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>

                          <div className="mt-2 text-right leading-relaxed">
                            {/* Arabic */}
                            <div dir="rtl" className="font-semibold tracking-wide text-lg sm:text-xl">
                              {v.ar}
                            </div>
                          </div>

                          {/* Transliteration */}
                          {showTranslit && (
                            <div className="mt-2 text-xs text-foreground/80">
                              {stripHtml(v.tr)}
                            </div>
                          )}

                          {/* Indonesian translation */}
                          <div className="mt-2 text-sm text-foreground leading-relaxed">
                            {v.id}
                          </div>
                        </div>
                      ))}
                      {!loadingSurah && !errorSurah && filteredAyah && filteredAyah.length === 0 && (
                        <div className="px-1 py-6 text-sm text-muted-foreground">Tidak ada ayat yang cocok.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={`flex items-center justify-center p-6 text-sm text-muted-foreground ${
                    isMobile ? 'flex-1' : 'h-[32rem]'
                  }`}>
                    Pilih salah satu surat{isMobile ? ' dari daftar' : ' di sebelah kiri'} untuk mulai membaca.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}