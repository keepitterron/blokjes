import { ri } from '../core/skills.ts'
import { $, q } from './dom.ts'

export const REDUCE = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
export const center = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
export type Pt = { x: number; y: number }
export const GREENS = ['#97DF7E', '#52B34A', '#FFD27A'], MIX = ['#97DF7E', '#8AC0F4', '#FFD27A', '#FFFFFF']

const sh = (y: number, bl: number) => `drop-shadow(0 ${y}px ${bl}px rgba(60,40,10,.28))`

interface FlyOpts { size?: 'dest'; popIn?: boolean; keep?: boolean; dur?: number; fast?: boolean }

/** Flies a clone (html) from src to dest along a lifted arc. Hides src unless keep. */
export function fly(src: Element | null, dest: Element | null, html: string, o: FlyOpts = {}) {
  return new Promise<void>(res => {
    if (!(src instanceof HTMLElement) || !dest) { res(); return }
    const a = src.getBoundingClientRect(), b = dest.getBoundingClientRect()
    const size = o.size === 'dest' ? b : a
    const dur = REDUCE ? 0 : o.fast ? 210 : (o.dur ?? 380)
    if (!o.keep) src.style.visibility = 'hidden'
    if (!dur) { res(); return }
    const c = document.createElement('div'); c.className = 'flyer'
    c.style.left = (a.left + a.width / 2 - size.width / 2) + 'px'; c.style.top = (a.top + a.height / 2 - size.height / 2) + 'px'
    c.style.width = size.width + 'px'; c.style.height = size.height + 'px'
    c.innerHTML = html; document.body.appendChild(c)
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2)
    const lift = Math.min(44, 16 + Math.hypot(dx, dy) * 0.09), rot = dx >= 0 ? 7 : -7
    const done = () => { c.remove(); res() }
    if (!c.animate) { setTimeout(done, dur); return }
    c.animate([
      { transform: `translate(0,0) scale(${o.popIn ? 0.2 : 1}) rotate(0deg)`, filter: sh(2, 2), offset: 0 },
      { transform: `translate(${dx * 0.1}px,${dy * 0.1 - lift * 0.65}px) scale(${o.popIn ? 1.3 : 1.18}) rotate(${-rot * 0.6}deg)`, filter: sh(10, 8), offset: 0.24 },
      { transform: `translate(${dx * 0.62}px,${dy * 0.62 - lift}px) scale(1.12) rotate(${rot}deg)`, filter: sh(13, 10), offset: 0.62 },
      { transform: `translate(${dx}px,${dy}px) scale(1) rotate(0deg)`, filter: sh(2, 2), offset: 1 },
    ], { duration: dur, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }).onfinish = done
  })
}

/** Squash-and-bounce whatever block now sits at pt. */
export function landAt(pt: Pt | null | undefined) {
  if (!pt || REDUCE) return
  const t = document.elementFromPoint(pt.x, pt.y)?.closest('.cb,.bar,.acells')
  if (t?.closest('#tray')) { t.classList.remove('land', 'pop'); void (t as HTMLElement).offsetWidth; t.classList.add('land') }
}

export function burst(pt: Pt | null | undefined, colors: string[], n = 12, dist = 40) {
  if (!pt || REDUCE) return
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i'); d.className = 'spark' + (i % 3 === 0 ? ' r' : '')
    d.style.left = pt.x + 'px'; d.style.top = pt.y + 'px'; d.style.background = colors[i % colors.length]!
    document.body.appendChild(d)
    const ang = i / n * Math.PI * 2 + Math.random() * 0.5, r = dist * (0.65 + Math.random() * 0.6)
    d.animate([{ transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * r}px,${Math.sin(ang) * r}px) scale(.2) rotate(${ri(90, 270)}deg)`, opacity: 0 }],
      { duration: 520 + Math.random() * 240, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = () => d.remove()
  }
}

/** Mini cubes, bars and squares bursting out of the answer cells. */
export function popConfetti(pt: Pt | null) {
  if (!pt || REDUCE) return
  const kinds = ['cb o', 'bar', 'sq go', 'sq sun']
  for (let i = 0; i < 26; i++) {
    const el = document.createElement('i'); el.className = 'conf ' + kinds[i % 4]
    el.style.left = pt.x + 'px'; el.style.top = pt.y + 'px'; document.body.appendChild(el)
    const vx = (Math.random() - 0.5) * 360, vy = -(250 + Math.random() * 230), g = 1150, T = 1.05 + Math.random() * 0.45, rot = (Math.random() - 0.5) * 900
    const fr: Keyframe[] = []
    for (let j = 0; j <= 8; j++) { const t = T * j / 8; fr.push({ transform: `translate(${vx * t}px,${vy * t + g * t * t / 2}px) rotate(${rot * j / 8}deg)`, opacity: j < 6 ? 1 : j === 8 ? 0 : 0.7 }) }
    el.animate(fr, { duration: T * 1000, easing: 'linear' }).onfinish = () => el.remove()
  }
}

/** Right answer: confetti from the cells and a ripple-hop across the tray. */
export function cheer() {
  const cells = q('#eq .cells')
  if (cells) { const c = center(cells); popConfetti(c); burst(c, ['#FFD27A', '#FFFFFF', '#FF8A3D'], 10, 46) }
  if (REDUCE) return
  ;[...$('#tray').querySelectorAll('.cb:not(.ph),.bar:not(.ghost),.bowl')].slice(0, 80).forEach((e, i) =>
    e.animate([{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.06)', offset: 0.4 }, { transform: 'none' }], { duration: 420, delay: i * 14, easing: 'ease-out' }))
}
