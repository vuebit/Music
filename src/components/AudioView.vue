<template>

    <section class="audio">
        <div class="a-left">
            <div class="panel rec" style="--d:.02s">
                <div class="panel-head">
                    <i class="led red" :class="{ blink: armed }" /><span class="ph-title">Input A · Voice Chain</span>
                    <span class="mono tiny dim right">{{ armed ? 'ARMED' : 'IDLE' }}</span>
                </div>
                <div class="rec-body">
                    <div class="mic-row">
                        <svg class="mic-ic" viewBox="0 0 24 24">
                            <path
                                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                        </svg>
                        <div class="mic-meta"><strong>LDC-87</strong><span class="mono tiny dim">CARDIOID · −12 dB
                                PAD</span></div>
                        <div class="h-meter">
                            <span v-for="i in 22" :key="i"
                                :class="{ lit: i - 1 < Math.round(mic * 22), mid: i >= 16, hot: i >= 20 }" />
                        </div>
                    </div>

                    <div class="faders">
                        <label class="fader-row"><span class="mono tiny">GAIN</span>
                            <input type="range" min="0" max="100" v-model.number="gain"
                                :style="{ '--p': gain + '%' }" />
                            <span class="mono tiny val">{{ gain }}</span></label>
                        <label class="fader-row"><span class="mono tiny">LOW CUT</span>
                            <input type="range" min="0" max="100" v-model.number="lowcut"
                                :style="{ '--p': lowcut + '%' }" />
                            <span class="mono tiny val">{{ lowcut }}</span></label>
                        <label class="fader-row"><span class="mono tiny">MONITOR</span>
                            <input type="range" min="0" max="100" v-model.number="monitor"
                                :style="{ '--p': monitor + '%' }" />
                            <span class="mono tiny val">{{ monitor }}</span></label>
                    </div>

                    <div class="switch-row">
                        <label class="switch"><input type="checkbox" v-model="p48" /><span class="sw" /><span
                                class="mono tiny">48V</span></label>
                        <label class="switch"><input type="checkbox" v-model="pad" /><span class="sw" /><span
                                class="mono tiny">PAD</span></label>
                        <button class="rec-btn" :class="{ armed }" @click="armed = !armed"
                            :aria-label="armed ? 'Disarm recording' : 'Arm recording'"><span /></button>
                        <span class="mono tiny rec-label" :class="{ on: armed }">{{ armed ? '● READY' : 'REC' }}</span>
                    </div>
                </div>
            </div>

            <div class="panel markers" style="--d:.1s">
                <div class="panel-head">
                    <i class="led" /><span class="ph-title">Session Markers</span>
                    <span class="mono tiny dim right">00:00 — 42:10</span>
                </div>
                <div class="strip">
                    <div class="strip-line" />
                    <div v-for="f in flags" :key="f.p" class="flag" :style="{ left: f.p + '%' }">
                        <i /><span class="mono tiny">{{ f.l }}</span>
                    </div>
                    <div v-if="stripPos > 0" class="strip-head" :style="{ left: stripPos + '%' }" />
                </div>
            </div>
        </div>

        <div class="panel episodes" style="--d:.06s">
            <div class="panel-head">
                <i class="led" /><span class="ph-title">Field Notes · Episodes</span>
                <span class="mono tiny dim right">SEASON 03</span>
            </div>
            <div class="ep-list">
                <article v-for="e in episodes" :key="e.id" class="ep" :class="{ active: isCurrent(e) }"
                    @click="playEp(e)">
                    <span class="ep-play">
                        <svg v-if="isCurrent(e) && state.playing" viewBox="0 0 24 24">
                            <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
                        </svg>
                        <svg v-else viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </span>
                    <div class="ep-txt">
                        <h4>{{ e.title }}</h4>
                        <p class="mono tiny dim">{{ e.no }} · {{ e.date }} · {{ fmt(e.dur) }}</p>
                    </div>
                    <div class="ep-wave">
                        <span v-for="(h, i) in e.wave" :key="i" :style="{ height: h * 100 + '%' }"
                            :class="{ played: i / e.wave.length <= epProg(e) }" />
                    </div>
                    <span class="mono tiny ep-pct">{{ Math.round(epProg(e) * 100) }}%</span>
                </article>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { state, load, fmt } from '../lib/Store'
import { engine } from '../lib/AudioEngine'
import { seededBars } from '../lib/Wave'

const episodes = [
    { id: 'e-41', no: 'EP 041', title: 'Foley for Imaginary Cities', date: 'AUG 12 · 2026', dur: 2320, prog: 0.62 },
    { id: 'e-40', no: 'EP 040', title: 'The Loudness War Is Over (We Lost)', date: 'AUG 05 · 2026', dur: 1980, prog: 0.31 },
    { id: 'e-39', no: 'EP 039', title: 'Tape Loops & Other Ghosts', date: 'JUL 29 · 2026', dur: 2540, prog: 1 },
    { id: 'e-38', no: 'EP 038', title: 'The Foley Artist Who Recorded Rain', date: 'JUL 22 · 2026', dur: 1760, prog: 0 },
    { id: 'e-37', no: 'EP 037', title: 'Why Vinyl Hiss Feels Like Home', date: 'JUL 15 · 2026', dur: 2110, prog: 0.87 },
].map(e => ({ ...e, wave: seededBars(e.id, 44) }))

function playEp(e: (typeof episodes)[number]) {
    load({ id: e.id, title: e.title, artist: 'Field Notes · ' + e.no, duration: e.dur }, 'audio')
}
const isCurrent = (e: (typeof episodes)[number]) => state.channel === 'audio' && state.current.id === e.id
const epProg = (e: (typeof episodes)[number]) =>
    isCurrent(e) ? Math.min(1, state.time / state.current.duration) : e.prog

/* mic meter */
const mic = ref(0)
let raf = 0
function loop(now: number) {
    const live = engine.running ? engine.level() : 0
    const t = state.playing ? Math.max(live, 0.18) : 0.07 + 0.05 * Math.sin(now / 480)
    mic.value += (t - mic.value) * 0.25
    raf = requestAnimationFrame(loop)
}
onMounted(() => { raf = requestAnimationFrame(loop) })
onUnmounted(() => cancelAnimationFrame(raf))

const gain = ref(62)
const lowcut = ref(24)
const monitor = ref(80)
const p48 = ref(true)
const pad = ref(false)
const armed = ref(false)

const flags = [
    { p: 8, l: 'TAK 01' }, { p: 23, l: 'FIX' }, { p: 41, l: 'TAK 03 ✦' },
    { p: 60, l: 'EDIT' }, { p: 78, l: 'MASTER' }, { p: 91, l: 'BOUNCE' },
]
const stripPos = computed(() =>
    state.channel === 'audio' && state.current.duration
        ? Math.min(100, (state.time / state.current.duration) * 100)
        : 0,
)
</script>


