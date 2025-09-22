"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Shuffle, Play, Pause } from "lucide-react"

interface RandomPickerProps {
  open: boolean
  onClose: () => void
}

export function RandomPicker({ open, onClose }: RandomPickerProps) {
  const [input, setInput] = React.useState("")
  const [items, setItems] = React.useState<string[]>([])
  const [rolling, setRolling] = React.useState(false)
  const [current, setCurrent] = React.useState<string>("")
  const [picked, setPicked] = React.useState<string | null>(null)
  const [uniqueMode, setUniqueMode] = React.useState(true)

  const addFromInput = () => {
    const parts = input
      .split(/\n|,|;/)
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    setItems(prev => {
      const merged = [...prev]
      for (const p of parts) if (!merged.includes(p)) merged.push(p)
      return merged
    })
    setInput("")
  }

  const removeItem = (name: string) => {
    setItems(prev => prev.filter(i => i !== name))
    if (current === name) setCurrent("")
    if (picked === name) setPicked(null)
  }

  const shuffle = () => {
    setItems(prev => {
      const a = [...prev]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    })
  }

  // simple roulette that eases out
  const startRoll = () => {
    if (items.length < 2) return
    setPicked(null)
    setRolling(true)
    let ticks = 0
    let maxTicks = Math.floor(40 + Math.random() * 30) // 40–70 steps
    const interval = setInterval(() => {
      ticks++
      const idx = Math.floor(Math.random() * items.length)
      setCurrent(items[idx])

      // ease-out by increasing chance to stop
      const progress = ticks / maxTicks
      const stopChance = Math.min(0.1 + progress * 0.8, 0.95)
      if (ticks >= maxTicks && Math.random() < stopChance) {
        clearInterval(interval)
        const final = items[Math.floor(Math.random() * items.length)]
        setCurrent(final)
        setPicked(final)
        setRolling(false)
        if (uniqueMode) {
          setItems(prev => prev.filter(i => i !== final))
        }
      }
    }, 60)
  }

  const stopRoll = () => setRolling(false)

  React.useEffect(() => {
    if (!open) {
      // reset transient state when closing
      setCurrent("")
      setPicked(null)
      setRolling(false)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            className="relative z-10 w-full max-w-3xl bg-card border border-border/60 rounded-2xl shadow-2xl"
            initial={{ y: 30, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            role="dialog"
            aria-modal="true"
            aria-label="Random Picker"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shuffle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground leading-none">Random Picker</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add names/items and let chance decide</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: input & list */}
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addFromInput()
                    }}
                    placeholder="Type names/items (comma, newline or semicolon separated)…"
                    className="flex-1 px-3 py-2 rounded-xl bg-card border border-border/60 outline-none focus:ring-2 focus:ring-primary/40 transition"
                    aria-label="Items input"
                  />
                  <button
                    onClick={addFromInput}
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition"
                    aria-label="Add items"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={shuffle}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition text-foreground"
                  >
                    <Shuffle className="h-4 w-4" />
                    Shuffle
                  </button>
                  <button
                    onClick={() => {
                      setItems([])
                      setPicked(null)
                      setCurrent("")
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </button>

                  <label className="ml-auto inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={uniqueMode}
                      onChange={(e) => setUniqueMode(e.target.checked)}
                    />
                    Unique picks
                  </label>
                </div>

                <div className="h-52 overflow-auto rounded-xl border border-border/60">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                      Add items and they’ll appear here.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {items.map((name) => (
                        <li key={name} className="flex items-center justify-between px-3 py-2">
                          <span className="text-sm text-foreground truncate">{name}</span>
                          <button
                            onClick={() => removeItem(name)}
                            className="p-1 rounded-lg hover:bg-muted/70 transition"
                            aria-label={`Remove ${name}`}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right: roulette & result */}
              <div className="flex flex-col h-full">
                <div className="flex-1 rounded-2xl border border-border/60 bg-gradient-to-b from-background/80 to-background/40 flex items-center justify-center text-center px-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Rolling…</p>
                    <motion.div
                      key={current || picked || "idle"}
                      className="text-2xl font-bold text-foreground min-h-[2.5rem]"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {current || "—"}
                    </motion.div>

                    {picked && (
                      <motion.div
                        className="mt-4 px-3 py-2 inline-flex items-center rounded-xl bg-primary/10 border border-primary/20"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <span className="text-sm text-primary font-medium">Picked: {picked}</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  {!rolling ? (
                    <button
                      onClick={startRoll}
                      disabled={items.length < 2}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={stopRoll}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-500/90 transition"
                    >
                      <Pause className="h-4 w-4" />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
