import { S } from '../store.ts'

let ac: AudioContext | null = null
function tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.07, when = 0) {
  if (!S.sound) return
  try {
    ac ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain()
    o.type = type; o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02)
  } catch { /* no audio: stay silent */ }
}

export const SND = {
  tap: () => tone(520, 0.05, 'triangle', 0.05),
  snap: () => { tone(660, 0.06, 'triangle', 0.08); tone(990, 0.1, 'triangle', 0.08, 0.06) },
  crack: () => { tone(190, 0.07, 'square', 0.035); tone(130, 0.1, 'square', 0.035, 0.05) },
  pop: () => tone(760, 0.05, 'sine', 0.06),
  good: () => { tone(523, 0.12, 'triangle', 0.07); tone(659, 0.12, 'triangle', 0.07, 0.1); tone(784, 0.2, 'triangle', 0.07, 0.2) },
  soft: () => { tone(330, 0.18, 'sine', 0.06); tone(294, 0.24, 'sine', 0.06, 0.14) },
  zoom: () => { [784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.09, 'triangle', 0.06, 0.32 + i * 0.045)) },
  done: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.12)) },
}
