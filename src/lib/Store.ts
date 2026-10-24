import { reactive } from 'vue'

export type Channel = 'music' | 'audio' | 'video'

export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  previewUrl?: string
}

export const state = reactive({
  channel: 'music' as Channel,
  playing: false,
  time: 0,
  volume: 0.75,
  muted: false,
  current: {
    id: '',
    title: 'Select a Track',
    artist: '—',
    duration: 0,
    previewUrl: ''
  } as Track
})

export function fmt(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function toggle() {
  state.playing = !state.playing
}

export function load(track: Track, channel: Channel) {
  state.current = track
  state.channel = channel
  state.time = 0
  state.playing = true
}