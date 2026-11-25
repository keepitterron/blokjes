import { pick } from '../core/skills.ts'
import { L } from '../store.ts'
import { SND } from './sound.ts'

/** Spartacus: black half-pitbull, half-labrador with hazel eyes and white muzzle, chest and paw tips. */
export function dogSVG() {
  return `<svg viewBox="0 0 120 124" aria-hidden="true">
<path class="tail" d="M86 98 Q106 92 104 72" fill="none" stroke="#1E1C1A" stroke-width="8" stroke-linecap="round"/>
<ellipse cx="60" cy="96" rx="31" ry="25" fill="#24211F"/>
<path d="M51 79 Q60 75 69 79 L66 107 Q60 112 54 107Z" fill="#FFFFFF"/>
<ellipse cx="46" cy="117" rx="9.5" ry="6" fill="#24211F"/><ellipse cx="74" cy="117" rx="9.5" ry="6" fill="#24211F"/>
<ellipse cx="46" cy="120" rx="7" ry="3.4" fill="#FFFFFF"/><ellipse cx="74" cy="120" rx="7" ry="3.4" fill="#FFFFFF"/>
<g class="head">
<ellipse cx="33" cy="46" rx="11" ry="21" transform="rotate(20 33 46)" fill="#151413"/>
<ellipse cx="87" cy="46" rx="11" ry="21" transform="rotate(-20 87 46)" fill="#151413"/>
<circle cx="60" cy="48" r="29" fill="#24211F"/>
<path d="M60 23 L60 52" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="60" cy="62" rx="16" ry="12" fill="#FFFFFF"/>
<g class="eyes-open"><circle cx="48" cy="45" r="5.2" fill="#A97A2C"/><circle cx="72" cy="45" r="5.2" fill="#A97A2C"/><circle cx="48" cy="45.5" r="2.8" fill="#151413"/><circle cx="72" cy="45.5" r="2.8" fill="#151413"/><circle cx="49.5" cy="43.5" r="1.3" fill="#FFFFFF"/><circle cx="73.5" cy="43.5" r="1.3" fill="#FFFFFF"/></g>
<g class="eyes-shut"><path d="M43 46 Q48 50 53 46 M67 46 Q72 50 77 46" fill="none" stroke="#A97A2C" stroke-width="2.4" stroke-linecap="round"/></g>
<ellipse cx="60" cy="56" rx="5.5" ry="4" fill="#151413"/>
<path d="M54 63 Q60 68 66 63" fill="none" stroke="#151413" stroke-width="2.2" stroke-linecap="round"/>
<ellipse class="tongue" cx="60" cy="68.5" rx="3.6" ry="4.4" fill="#E8839F"/>
</g>
<g class="zz" fill="currentColor" font-family="Fredoka, sans-serif" font-weight="600"><text x="94" y="22" font-size="15">z</text><text x="105" y="11" font-size="11">z</text></g>
</svg><span class="bubble"></span>`
}

export type Mood = '' | 'happy' | 'think' | 'gentle' | 'sleep' | 'roll'
const moodTimers = new WeakMap<HTMLElement, number>()
export function mood(el: HTMLElement | null, m: Mood, ms?: number) {
  if (!el) return
  el.classList.remove('happy', 'think', 'gentle', 'sleep', 'roll')
  clearTimeout(moodTimers.get(el))
  if (m) { void el.offsetWidth; el.classList.add(m) }
  if (m && ms) moodTimers.set(el, window.setTimeout(() => el.classList.remove(m), ms))
}

// Easter egg: seven quick taps make him roll over.
let taps = 0, tapTimer = 0
export function petDog(el: HTMLElement) {
  if (el.classList.contains('sleep')) { mood(el, ''); return }
  taps++; clearTimeout(tapTimer); tapTimer = window.setTimeout(() => { taps = 0 }, 2500)
  const b = el.querySelector<HTMLElement>('.bubble')!
  if (taps >= 7) { taps = 0; mood(el, 'roll', 950); b.textContent = ''; b.classList.remove('on'); SND.done(); return }
  b.textContent = pick(L().woof); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 900)
  mood(el, 'happy', 900); SND.pop()
}
