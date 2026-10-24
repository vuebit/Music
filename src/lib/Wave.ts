function seededRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return function() {
    hash = (hash * 16807) % 2147483647
    return (hash - 1) / 2147483646
  }
}

export function seededBars(seed: string, count: number): number[] {
  const rng = seededRandom(seed)
  const bars: number[] = []
  let currentHeight = 0.2 + rng() * 0.3
  
  for (let i = 0; i < count; i++) {
    const change = (rng() - 0.5) * 0.4
    currentHeight = Math.max(0.05, Math.min(1, currentHeight + change))
    bars.push(currentHeight)
  }
  
  return bars
}