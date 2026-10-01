<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { state, fmt, toggle, type Channel } from './lib/Store.ts'
import { engine } from './lib/AudioEngine.ts'
import { seededBars } from './lib/Wave.ts'
import MusicView from './components/MusicView.vue'
import AudioView from './components/AudioView.vue'
import VideoView from './components/VideoView.vue'

watch(
  () => state.playing,
  (p) => {
    if (p) {
    
      engine.start(state.current.previewUrl)
    } else {
      engine.stop()
    }
    engine.setVolume(state.volume, state.muted)
  },
  { immediate: true } 
)

watch(
  () => state.current.id,
  () => {
    if (state.playing) {
      engine.start(state.current.previewUrl)
    }
  }
)

const ACCENT: Record<Channel, string> = { music: '#ffb04d', audio: '#4fe3a3', video: '#ff6d5f' }
const CHANNELS: { id: Channel; label: string; n: string; color: string }[] = [
  { id: 'music', label: 'MUSIC', n: '01', color: ACCENT.music },
  { id: 'audio', label: 'AUDIO', n: '02', color: ACCENT.audio },
  { id: 'video', label: 'VIDEO', n: '03', color: ACCENT.video },
]
const views: Record<Channel, unknown> = { music: MusicView, audio: AudioView, video: VideoView }

const cssVars = computed(() => ({ '--accent': ACCENT[state.channel] }) as Record<string, string>)
const activeView = computed(() => views[state.channel])
const chNo = computed(() => CHANNELS.find(c => c.id === state.channel)!.n)

const clock = ref('--:--:--')
const dateStr = (() => {
  const d = new Date()
  const D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${D[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${M[d.getMonth()]} ${d.getFullYear()}`
})()

const BARS = 96
const bars = computed(() => seededBars(state.current.id + state.current.title, BARS))
const progress = computed(() =>
  state.current.duration ? Math.min(1, state.time / state.current.duration) : 0,
)

const waveEl = ref<HTMLElement | null>(null)
function seekWave(e: MouseEvent) {
  const el = waveEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  state.time = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * state.current.duration
}

/* VU meters */
const vuL = ref(0)
const vuR = ref(0)
function vuClass(v: number, i: number) {
  const lit = i < Math.round(v * 16)
  return { lit, mid: lit && i >= 10 && i < 13, hot: lit && i >= 13 }
}

/* transport */
function skip(s: number) {
  state.time = Math.min(Math.max(0, state.time + s), state.current.duration - 1)
}
function stopAll() {
  state.playing = false
  state.time = 0
}
watch(
  () => state.playing,
  p => {
    if (p) engine.start()
    else engine.stop()
    engine.setVolume(state.volume, state.muted)
  },
)

/* master volume */
function setVol(v: number) {
  state.volume = Math.min(1, Math.max(0, v))
  state.muted = false
  engine.setVolume(state.volume, false)
}
function mute() {
  state.muted = !state.muted
  engine.setVolume(state.volume, state.muted)
}
let drag: { y: number; v: number } | null = null
function knobDown(e: PointerEvent) {
  drag = { y: e.clientY, v: state.volume }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}
function knobMove(e: PointerEvent) {
  if (drag) setVol(drag.v + (drag.y - e.clientY) * 0.006)
}
function knobUp() { drag = null }
function knobWheel(e: WheelEvent) { setVol(state.volume + (e.deltaY < 0 ? 0.05 : -0.05)) }

const ticker = computed(
  () =>
    `NOW PLAYING — ${state.current.title.toUpperCase()} · ${state.current.artist.toUpperCase()}   ◆   ${state.channel.toUpperCase()} CHANNEL ACTIVE   ◆   48kHz / 24-BIT / STEREO   ◆   MONITOR ${Math.round(state.volume * 100)}%   ◆   `,
)

let raf = 0
let clk = 0
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  if (state.playing) {
    state.time += dt
    if (state.time >= state.current.duration) state.time = 0
  }
  const live = engine.running ? engine.level() : 0
  const target = state.playing ? Math.max(live, 0.14) : 0
  vuL.value += (Math.min(1, target * (0.9 + Math.random() * 0.2)) - vuL.value) * 0.3
  vuR.value += (Math.min(1, target * (0.9 + Math.random() * 0.2)) - vuR.value) * 0.3
  raf = requestAnimationFrame(frame)
}
function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
  if (e.code === 'Space') { e.preventDefault(); toggle() }
  if (e.key === '1') state.channel = 'music'
  if (e.key === '2') state.channel = 'audio'
  if (e.key === '3') state.channel = 'video'
}
onMounted(() => {
  raf = requestAnimationFrame(frame)
  const set = () => { clock.value = new Date().toTimeString().slice(0, 8) }
  set()
  clk = window.setInterval(set, 1000)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  clearInterval(clk)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="console" :style="cssVars">
    <header class="top">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <span v-for="i in 5" :key="i" :style="{ animationDelay: i * 0.12 + 's' }" />
        </div>
        <div class="brand-text">
          <strong>WVFRM</strong>
          <span class="mono dim">MUSIC · AUDIO · VIDEO CONSOLE</span>
        </div>
      </div>
      <div class="top-status mono">
        <span class="rec"><i class="led red blink" />REC</span>
        <span class="sep">/</span>
        <span class="dim">{{ dateStr }}</span>
        <span class="clock">{{ clock }}</span>
      </div>
    </header>

    <!-- ══ TRANSPORT DECK ══ -->
    <section class="deck panel">
      <div class="deck-meta">
        <span class="ch-badge mono"><i class="led" />CH-{{ chNo }} · {{ state.channel }}</span>
        <h1 class="deck-title" :key="state.current.id">{{ state.current.title }}</h1>
        <p class="deck-artist">{{ state.current.artist }}<span class="dim"> · from the session tapes</span></p>
        <p class="mono tiny dim">CUE 04/12 · 48kHz · 24-BIT · STEREO · −6.2 dBFS</p>
      </div>

      <div class="deck-wave" ref="waveEl" role="slider" aria-label="Seek"
        :aria-valuenow="Math.round(progress * 100)" @click="seekWave">
        <div class="wave-bars">
          <span v-for="(h, i) in bars" :key="i" class="wb"
            :class="{ played: i / BARS <= progress }" :style="{ height: h * 100 + '%' }" />
        </div>
        <div class="playhead" :style="{ left: progress * 100 + '%' }" />
      </div>

      <div class="deck-ctrl">
        <div class="timecode mono">
          <span class="now">{{ fmt(state.time) }}</span><span class="dim"> / {{ fmt(state.current.duration) }}</span>
        </div>
        <div class="transport">
          <button class="t-btn" aria-label="Back 15 seconds" @click="skip(-15)">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm12 0v12l-9-6z" /></svg>
          </button>
          <button class="t-btn play" :aria-label="state.playing ? 'Pause' : 'Play'" @click="toggle">
            <svg v-if="state.playing" viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
            <svg v-else viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <button class="t-btn" aria-label="Forward 15 seconds" @click="skip(15)">
            <svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6l9 6-9 6z" /></svg>
          </button>
          <button class="t-btn small" aria-label="Stop" @click="stopAll">
            <svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </button>
        </div>
        <div class="deck-right">
          <div class="vu" aria-hidden="true">
            <div class="vu-col"><span v-for="i in 16" :key="i" class="vu-seg" :class="vuClass(vuL, i - 1)" /></div>
            <div class="vu-col"><span v-for="i in 16" :key="i" class="vu-seg" :class="vuClass(vuR, i - 1)" /></div>
          </div>
          <div class="knob-wrap">
            <div class="knob" title="Master — drag or scroll"
              :style="{ transform: `rotate(${-135 + state.volume * 270}deg)` }"
              @pointerdown="knobDown" @pointermove="knobMove" @pointerup="knobUp" @wheel.prevent="knobWheel">
              <i class="pin" />
            </div>
            <span class="mono tiny dim">MASTER {{ Math.round(state.volume * 100) }}</span>
          </div>
          <button class="t-btn small" :class="{ 'is-dim': state.muted }" aria-label="Mute" @click="mute">
            <svg v-if="state.muted" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>
            <svg v-else viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ══ CHANNEL SELECT ══ -->
    <nav class="channels" aria-label="Sections">
      <button v-for="c in CHANNELS" :key="c.id" class="ch-btn"
        :class="{ active: state.channel === c.id }" :style="{ '--cb': c.color }"
        @click="state.channel = c.id">
        <i class="led" :class="{ blink: state.channel === c.id }" :style="{ '--c': c.color }" />
        <span class="mono tiny ch-no">CH-{{ c.n }}</span>
        <strong>{{ c.label }}</strong>
        <span class="mono tiny idx">{{ state.channel === c.id ? 'ONLINE' : 'STANDBY' }}</span>
      </button>
    </nav>

    <main>
      <Transition name="view" mode="out-in">
        <component :is="activeView" :key="state.channel" />
      </Transition>
    </main>

    <div class="ticker mono" aria-hidden="true">
      <div class="ticker-track">
        <span>{{ ticker + ticker }}</span>
        <span>{{ ticker + ticker }}</span>
      </div>
    </div>

    <footer class="foot mono">
      <span>WVFRM CONSOLE v2.4.1</span>
      <span>© 2026 WAVEFORM COLLECTIVE — ALL FREQUENCIES RESERVED</span>
      <span><i class="led green" /> SYSTEM NOMINAL</span>
    </footer>
  </div>
</template>
