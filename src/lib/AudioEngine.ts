// src/lib/AudioEngine.ts
class RealAudioEngine {
  public running = false
  private audio: HTMLAudioElement | null = null
  private _volume = 0.75
  private _muted = false

  start(url?: string) {
    this.stop() // قطع صدای قبلی
    
    if (url) {
      this.audio = new Audio(url)
      this.audio.volume = this._volume
      this.audio.muted = this._muted
      this.audio.play().catch(e => console.log("Auto-play blocked:", e))
      this.running = true
    } else {
      // اگر لینکی نبود، فقط شبیه‌سازی کن
      this.running = true
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio = null
    }
    this.running = false
  }

  setVolume(vol: number, muted: boolean) {
    this._volume = vol
    this._muted = muted
    if (this.audio) {
      this.audio.volume = vol
      this.audio.muted = muted
    }
  }

  level(): number {
    if (!this.running) return 0
    // اگر فایل واقعی در حال پخش است، کمی نوسان تصادفی برای زیبایی VU Meter
    return 0.3 + Math.random() * 0.5 * this._volume
  }

  spectrum(bands: number): number[] {
    if (!this.running) return new Array(bands).fill(0.05)
    return Array.from({ length: bands }, () => 0.1 + Math.random() * 0.8 * this._volume)
  }
}

export const engine = new RealAudioEngine()