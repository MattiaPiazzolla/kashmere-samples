import { create } from 'zustand'

export type PlayerTrack = {
  id: string
  title: string
  slug: string
  coverImageUrl: string | null
  previewUrl: string
  bpm: number | null
  key: string | null
  type: string
  licenseType: 'ROYALTY_FREE' | 'EXCLUSIVE'
}

// Howl instance stored outside Zustand — class instances must never go through set()
// GlobalPlayer calls registerHowl(howl) after creating it, registerHowl(null) on cleanup
// Any component can then call pause()/resume() and it will drive the real Howl
type HowlLike = { pause: () => void; play: () => void; playing: () => boolean }
let _howl: HowlLike | null = null
export function registerHowl(h: HowlLike | null) { _howl = h }

type AudioState = {
  currentTrack: PlayerTrack | null
  queue: PlayerTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  volume: number
  isExpanded: boolean

  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void
  pause: () => void
  resume: () => void
  stop: () => void
  next: () => void
  previous: () => void
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void
  setIsLoading: (loading: boolean) => void
  setVolume: (volume: number) => void
  setExpanded: (expanded: boolean) => void
  toggleExpanded: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isLoading: false,
  volume: 0.8,
  isExpanded: false,

  // Used by admin — sets currentTrack directly and starts playback
  play: (track, queue) => {
    const newQueue = queue ?? get().queue
    const index = newQueue.findIndex(t => t.id === track.id)
    set({
      currentTrack: track,
      isPlaying: true,
      isLoading: true,
      queue: newQueue,
      queueIndex: index >= 0 ? index : 0,
    })
  },

  pause: () => {
    if (_howl?.playing()) _howl.pause()
    set({ isPlaying: false })
  },

  resume: () => {
    if (!get().currentTrack) return
    if (_howl && !_howl.playing()) _howl.play()
    set({ isPlaying: true })
  },

  stop: () => {
    _howl = null
    set({ currentTrack: null, isPlaying: false, isLoading: false, queueIndex: -1 })
  },

  next: () => {
    const { queue, queueIndex } = get()
    const nextIndex = queueIndex + 1
    if (nextIndex >= queue.length) return
    set({ currentTrack: queue[nextIndex], isPlaying: true, isLoading: true, queueIndex: nextIndex })
  },

  previous: () => {
    const { queue, queueIndex } = get()
    const prevIndex = queueIndex - 1
    if (prevIndex < 0) return
    set({ currentTrack: queue[prevIndex], isPlaying: true, isLoading: true, queueIndex: prevIndex })
  },

  // Used by public pages — sets full queue and triggers playback from startIndex
  // Admin play() is unaffected — it never calls setQueue
  setQueue: (tracks, startIndex = 0) => {
    const track = tracks[startIndex]
    if (!track) return
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: track,
      isPlaying: true,
      isLoading: true,
    })
  },

  setIsLoading: (loading) => set({ isLoading: loading }),
  setVolume: (volume) => set({ volume }),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  toggleExpanded: () => set(s => ({ isExpanded: !s.isExpanded })),
}))