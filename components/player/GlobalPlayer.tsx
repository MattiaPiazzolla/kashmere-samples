'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Howl } from 'howler'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioStore, registerHowl } from '@/store/audioStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

const spring = { type: 'spring' as const, stiffness: 200, damping: 38, mass: 1.2 }

// ─── Vinyl cover ──────────────────────────────────────────────────────────────

function Cover({
    url,
    title,
    isPlaying,
}: {
    url: string | null
    title: string
    isPlaying: boolean
}) {
    return (
        <motion.div
            className="relative rounded-full overflow-hidden bg-neutral-800 shrink-0 ring-1 ring-white/10"
            style={{ width: 36, height: 36 }}
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={
                isPlaying
                    ? { repeat: Infinity, duration: 10, ease: 'linear' }
                    : { duration: 0.6, ease: 'easeOut' }
            }
        >
            {url ? (
                <img src={url} alt={title} className="w-full h-full object-cover" draggable={false} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs select-none">♪</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[22%] h-[22%] rounded-full bg-neutral-950/90 ring-1 ring-white/10" />
            </div>
        </motion.div>
    )
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function Ctrl({
    onClick,
    disabled,
    title,
    children,
    className = '',
}: {
    onClick: () => void
    disabled?: boolean
    title?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center rounded-full transition-colors active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg width="14" height="14" className="animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
    )
}

// ─── Play / Pause icon ────────────────────────────────────────────────────────

function PlayPauseIcon({ isLoading, isPlaying }: { isLoading: boolean; isPlaying: boolean }) {
    if (isLoading) return <Spinner />
    if (isPlaying) {
        return (
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
        )
    }
    return (
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="ml-0.5">
            <path d="M8 5v14l11-7z" />
        </svg>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GlobalPlayer() {
    const {
        currentTrack,
        isPlaying, isLoading,
        volume, queue, queueIndex,
        pause, resume, stop, next, previous,
        setVolume, setIsLoading,
    } = useAudioStore()

    const howlRef = useRef<Howl | null>(null)
    const rafRef = useRef<number | null>(null)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [seek, setSeek] = useState(0)

    const canNext = queueIndex < queue.length - 1
    const canPrev = queueIndex > 0

    // ── RAF tick ──────────────────────────────────────────────────────────────
    function startTick() {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        function tick() {
            const h = howlRef.current
            if (!h || !h.playing()) return
            const s = h.seek() as number
            const d = h.duration() || 1
            setSeek(s)
            setProgress(s / d)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }
    function stopTick() {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }

    // ── Unified play/pause ────────────────────────────────────────────────────
    const handlePlayPause = useCallback(() => {
        const h = howlRef.current
        if (!h) return
        if (h.playing()) {
            h.pause()
            pause()
        } else {
            h.play()
            resume()
        }
    }, [pause, resume])

    // ── Unified stop ──────────────────────────────────────────────────────────
    const handleStop = useCallback(() => {
        const h = howlRef.current
        if (h) { h.off(); h.unload(); howlRef.current = null }
        stopTick()
        setProgress(0); setSeek(0); setDuration(0)
        stop()
    }, [stop])

    // ── Keyboard controls ─────────────────────────────────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return

            if (e.code === 'Space' || e.key === 'MediaPlayPause') {
                e.preventDefault()
                if (!useAudioStore.getState().currentTrack) return
                handlePlayPause()
            }
            if (e.key === 'MediaTrackNext') useAudioStore.getState().next()
            if (e.key === 'MediaTrackPrevious') useAudioStore.getState().previous()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [handlePlayPause])

    // ── Howl lifecycle ────────────────────────────────────────────────────────
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.off()
            howlRef.current.unload()
            howlRef.current = null
            stopTick()
        }
        setProgress(0); setSeek(0); setDuration(0)
        if (!currentTrack) return

        let destroyed = false

        const howl = new Howl({
            src: [currentTrack.previewUrl],
            html5: true,
            volume: useAudioStore.getState().volume,
            onload: () => { if (!destroyed) { setDuration(howl.duration()); setIsLoading(false) } },
            onloaderror: (_: any, err: any) => { if (!destroyed) { console.error(err); setIsLoading(false) } },
            onplay: () => { if (!destroyed) startTick() },
            onpause: () => { if (!destroyed) stopTick() },
            onstop: () => { if (!destroyed) { stopTick(); setProgress(0); setSeek(0) } },
            onend: () => { if (!destroyed) { stopTick(); setProgress(0); setSeek(0); next() } },
        })
        howlRef.current = howl
        registerHowl(howl)           // ← register so pause()/resume() from any component work
        howl.play()
        return () => {
            destroyed = true
            registerHowl(null)       // ← unregister on cleanup
            howl.off()
            howl.unload()
            stopTick()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack?.id])

    useEffect(() => { howlRef.current?.volume(volume) }, [volume])

    function handleSeek(v: number) {
        const h = howlRef.current
        if (!h) return
        h.seek(v); setSeek(v); setProgress(v / (h.duration() || 1))
    }
    function skipForward() {
        const h = howlRef.current
        if (!h) return
        const v = Math.min((h.seek() as number) + 10, h.duration())
        h.seek(v); setSeek(v); setProgress(v / h.duration())
    }
    function skipBack() {
        const h = howlRef.current
        if (!h) return
        const v = Math.max((h.seek() as number) - 10, 0)
        h.seek(v); setSeek(v); setProgress(v / h.duration())
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AnimatePresence>
            {currentTrack && (
                <motion.div
                    className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={spring}
                >
                    <div
                        className="bg-[#111111] border border-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.65)]"
                        style={{ borderRadius: 20, height: 52 }}
                    >
                        <div className="h-full flex items-center px-1.5 gap-1">

                            {/* Cover */}
                            <div className="shrink-0 mr-1">
                                <Cover url={currentTrack.coverImageUrl} title={currentTrack.title} isPlaying={isPlaying} />
                            </div>

                            {/* Title + meta */}
                            <div className="flex flex-col justify-center min-w-0 w-40 shrink-0 px-1">
                                <motion.p
                                    key={currentTrack.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-white text-[11px] font-semibold truncate leading-tight"
                                >
                                    {currentTrack.title}
                                </motion.p>
                                {(currentTrack.bpm || currentTrack.key) && (
                                    <p className="text-white/30 text-[10px] truncate leading-tight mt-0.5">
                                        {[currentTrack.bpm && `${currentTrack.bpm} BPM`, currentTrack.key].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="w-px h-5 bg-white/[0.07] shrink-0 mx-1.5" />

                            {/* Prev */}
                            <Ctrl onClick={previous} disabled={!canPrev} title="Previous" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/8">
                                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6l-8.5 6z" />
                                </svg>
                            </Ctrl>

                            {/* Skip back 10s */}
                            <Ctrl onClick={skipBack} title="Back 10s" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/8">
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                    <text x="8" y="15.5" fontSize="5.5" fontWeight="700" fill="currentColor">10</text>
                                </svg>
                            </Ctrl>

                            {/* Play / Pause */}
                            <button
                                onClick={handlePlayPause}
                                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shrink-0 mx-0.5 active:scale-95"
                            >
                                <PlayPauseIcon isLoading={isLoading} isPlaying={isPlaying} />
                            </button>

                            {/* Skip forward 10s */}
                            <Ctrl onClick={skipForward} title="Forward 10s" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/8">
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                                    <text x="8" y="15.5" fontSize="5.5" fontWeight="700" fill="currentColor">10</text>
                                </svg>
                            </Ctrl>

                            {/* Next */}
                            <Ctrl onClick={next} disabled={!canNext} title="Next" className="w-7 h-7 text-white/35 hover:text-white hover:bg-white/8">
                                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" />
                                </svg>
                            </Ctrl>

                            {/* Divider */}
                            <div className="w-px h-5 bg-white/[0.07] shrink-0 mx-1.5" />

                            {/* Scrubber */}
                            <div className="flex items-center gap-2 w-52 shrink-0">
                                <span className="text-[10px] text-white/25 tabular-nums font-mono w-6 text-right shrink-0">
                                    {fmt(seek)}
                                </span>
                                <div className="relative flex-1 flex items-center group">
                                    <div className="w-full rounded-full bg-white/8 overflow-hidden h-[2px] group-hover:h-[3px] transition-all duration-150">
                                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${progress * 100}%` }} />
                                    </div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                        style={{ left: `calc(${progress * 100}% - 4px)` }}
                                    />
                                    <input
                                        type="range" min={0} max={duration || 1} step={0.01} value={seek}
                                        onChange={e => handleSeek(parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <span className="text-[10px] text-white/25 tabular-nums font-mono w-6 shrink-0">
                                    {fmt(duration)}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-5 bg-white/[0.07] shrink-0 mx-1.5" />

                            {/* Volume icon */}
                            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" className="text-white/20 shrink-0">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>

                            {/* Volume slider */}
                            <div className="relative w-16 shrink-0 flex items-center group ml-1">
                                <div className="w-full rounded-full bg-white/8 overflow-hidden h-[2px] group-hover:h-[3px] transition-all duration-150">
                                    <div className="h-full bg-white/30 rounded-full" style={{ width: `${volume * 100}%` }} />
                                </div>
                                <input
                                    type="range" min={0} max={1} step={0.01} value={volume}
                                    onChange={e => setVolume(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {/* Queue counter */}
                            {queue.length > 1 && (
                                <span className="text-white/15 text-[10px] tabular-nums font-mono shrink-0 ml-2">
                                    {queueIndex + 1}/{queue.length}
                                </span>
                            )}

                            {/* Stop */}
                            <button
                                onClick={handleStop}
                                title="Stop"
                                className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 ml-2 mr-1 active:scale-90"
                            >
                                <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}