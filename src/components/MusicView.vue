<template>
  <section class="music">
    <!-- لیست آلبوم‌ها (ثابت) -->
    <div class="panel crate" style="--d:.02s">
      <div class="panel-head"><i class="led"/><span class="ph-title">The Crate</span></div>
      <div class="albums">
        <article v-for="a in albums" :key="a.id" class="album" @click="playAlbum(a)">
          <div class="cover"><div class="vinyl"><i class="hole"/></div><div class="cover-art"/></div>
          <h4>{{ a.title }}</h4><p class="dim artist">{{ a.artist }}</p>
        </article>
      </div>
    </div>

    <!-- لیست آهنگ‌ها (از API) -->
    <div class="panel tracks" style="--d:.08s">
      <div class="panel-head"><i class="led"/><span class="ph-title">iTunes Search</span></div>
      <button v-for="(t, i) in tracks" :key="t.id" class="row" :class="{ active: isActive(t) }" @click="playTrack(t)">
        <span class="num mono">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="t-title">{{ t.title }}</span>
        <span class="mono dim ta-r">{{ fmt(t.duration) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from "axios"
import { state, load, fmt, type Track } from '../lib/Store'

const tracks = ref<Track[]>([])

const albums = [
  { id: 'al-1', title: 'Copper Drift', artist: 'Mara Vane', year: 2026, cat: 'WV-041', tracks: 9, time: '41 MIN', dur: 248, c1: '#c96f3a', c2: '#7a3d5e' },
  { id: 'al-2', title: 'Night Bus to Odessa', artist: 'Velvet Static', year: 2025, cat: 'WV-037', tracks: 12, time: '47 MIN', dur: 262, c1: '#3f6d8e', c2: '#d9a441' },
  { id: 'al-3', title: 'Low Orbit', artist: 'Petrichor', year: 2026, cat: 'WV-044', tracks: 8, time: '38 MIN', dur: 236, c1: '#2f7f6f', c2: '#94d3c0' },
  { id: 'al-4', title: 'Tape Hymns', artist: 'The Analog Choir', year: 2024, cat: 'WV-029', tracks: 10, time: '44 MIN', dur: 254, c1: '#b8552f', c2: '#402a3a' },
  { id: 'al-5', title: 'Signal Garden', artist: 'Fjeld', year: 2026, cat: 'WV-045', tracks: 7, time: '35 MIN', dur: 222, c1: '#557d4f', c2: '#d8c98a' },
  { id: 'al-6', title: 'Static Bloom', artist: 'Night Arcade', year: 2025, cat: 'WV-033', tracks: 11, time: '52 MIN', dur: 288, c1: '#8f4a5e', c2: '#33475e' },
]


onMounted(async () => {
  const res = await axios.get('https://itunes.apple.com/search?term=googoosh&media=music&limit=10')
  tracks.value = res.data.results.map((r: any) => ({
    id: r.trackId.toString(),
    title: r.trackName,
    artist: r.artistName,
    duration: Math.floor(r.trackTimeMillis / 1000),
    previewUrl: r.previewUrl
  }))
})

const playAlbum = (a: any) => load({ id: a.id, title: a.title, artist: a.artist, duration: a.dur }, 'music')
const playTrack = (t: Track) => load(t, 'music')
const isActive = (t: Track) => state.current.id === t.id
</script>
