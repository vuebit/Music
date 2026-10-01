<template>
    <section class="video">
        <div class="v-main">
            <div class="panel stage-panel" style="--d:.02s">
                <div class="stage" @click="stageToggle">

                    <!-- 🎬 تگ ویدیوی واقعی (جایگزین div.film) -->
                    <video v-if="cur?.videoUrl" class="film-video" :src="cur.videoUrl" :poster="cur.art"
                        :autoplay="playingNow" :muted="state.muted" loop playsinline
                        @timeupdate="(e: any) => { if (isCurrent(cur)) state.time = e.target.currentTime }" />

                    <!-- لایه افکت Grain روی ویدیو -->
                    <div class="grain" />
                    <div class="lb top" />
                    <div class="lb bot" />

                    <div class="stage-hud mono tiny">
                        <span>
                            <i class="led red" :class="{ blink: playingNow }" />
                            {{ playingNow ? 'PLAYING' : 'READY' }} · {{ cur?.codec || 'MP4' }}
                        </span>
                        <span>{{ fmt(state.time) }} / {{ fmt(cur?.dur || 0) }}</span>
                    </div>

                    <span class="chip-4k mono tiny">{{ cur?.tag || 'HD' }}</span>

                    <button v-if="!playingNow" class="stage-play" aria-label="Play video">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>

                <div class="scrub" @click="scrub">
                    <div class="buffer" />
                    <div class="fill" :style="{ width: fill * 100 + '%' }"><i class="handle" /></div>
                    <span v-for="(f, i) in chapterFr" :key="i" class="tick" :style="{ left: f * 100 + '%' }" />
                </div>

                <div class="v-meta">
                    <h2>{{ cur?.title || 'Select a Clip' }}</h2>
                    <p class="dim">{{ cur?.sub || '—' }} · graded in-house</p>
                    <div class="v-row">
                        <div class="chips">
                            <span class="chip mono tiny">{{ cur?.tag }}</span>
                            <span class="chip mono tiny">{{ cur?.codec }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <aside class="v-side">
            <div class="panel chapters" style="--d:.08s">
                <div class="panel-head">
                    <i class="led" /><span class="ph-title">Chapters</span>
                    <span class="mono tiny dim right">{{ fmt(cur?.dur || 0) }} TOTAL</span>
                </div>
                <button v-for="(n, i) in chapterNames" :key="n" class="chp" @click="chapterTo(i)">
                    <span class="mono tiny num">{{ String(i + 1).padStart(2, '0') }}</span>
                    <span class="chp-name">{{ n }}</span>
                    <span class="mono tiny dim">{{ fmt((chapterFr[i] * (cur?.dur || 0))) }}</span>
                </button>
            </div>

            <div class="panel reel-panel" style="--d:.14s">
                <div class="panel-head">
                    <i class="led" /><span class="ph-title">The Reel</span>
                    <span class="mono tiny dim right">{{ videoList.length }} CLIPS</span>
                </div>
                <div class="thumbs">
                    <button v-for="r in videoList" :key="r.id" class="thumb" :class="{ active: isCurrent(r) }"
                        @click="select(r)">
                        <span class="t-art" :style="{ backgroundImage: `url(${r.art})`, backgroundSize: 'cover' }" />
                        <span class="t-dur mono tiny">{{ fmt(r.dur) }}</span>
                        <span v-if="isCurrent(r) && state.playing" class="t-live mono tiny">▶ LIVE</span>
                    </button>
                </div>
            </div>
        </aside>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { state, load, fmt } from '../lib/Store'
import videoData from '../assets/videos.json'

interface VideoItem {
  id: string
  title: string
  sub: string
  dur: number
  codec: string
  tag: string
  art: string
  videoUrl: string
}

// تبدیل داده‌های JSON به فرمت استاندارد
const videoList: VideoItem[] = videoData.map((v: any) => {
  const bestFile = v.video_files.find((f: any) => f.quality === 'hd') || v.video_files[0]
  return {
    id: `pv-${v.id}`,
    title: 'Live Session',
    sub: v.user.name,
    dur: v.duration,
    codec: 'MP4 / H.264',
    tag: 'HD VIDEO',
    art: v.image,
    videoUrl: bestFile.link
  }
})

const chapterNames = ['Intro', 'Verse', 'Chorus', 'Outro']
const chapterFr = [0, 0.25, 0.6, 0.85]

// پیدا کردن ایندکس آهنگ فعال (اگر نباشد -1 برمی‌گرداند)
const activeIdx = computed(() => videoList.findIndex(r => r.id === state.current.id))

// دریافت آیتم فعلی (ممکن است undefined باشد)
const cur = computed(() => videoList[activeIdx.value])

// ✅ رفع خطا: استفاده از ? برای جلوگیری از کرش شدن وقتی cur خالی است
const isCurrent = (r: VideoItem | undefined) => {
  if (!r) return false
  return state.channel === 'video' && state.current.id === r.id
}

const playingNow = computed(() => {
  if (!cur.value) return false
  return isCurrent(cur.value) && state.playing
})

const fill = computed(() => {
  if (!cur.value || !isCurrent(cur.value) || !state.current.duration) return 0
  return Math.min(1, state.time / state.current.duration)
})

function select(r: VideoItem) {
  load({ 
    id: r.id, 
    title: r.title, 
    artist: r.sub, 
    duration: r.dur,
    previewUrl: r.videoUrl 
  }, 'video')
}

function stageToggle() {
  if (!cur.value) return
  if (isCurrent(cur.value)) {
    state.playing = !state.playing
  } else {
    select(cur.value)
  }
}

function chapterTo(i: number) {
  if (!cur.value) return
  if (!isCurrent(cur.value)) select(cur.value)
  state.time = chapterFr[i] * cur.value.dur
}

function scrub(e: MouseEvent) {
  if (!cur.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const p = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  if (!isCurrent(cur.value)) select(cur.value)
  state.time = p * cur.value.dur
}
</script>