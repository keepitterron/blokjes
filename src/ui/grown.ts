import { currentSkill, resetProgress, startHere } from '../core/progress.ts'
import { SK, type SkillId } from '../core/skills.ts'
import { timeSummary } from '../core/speed.ts'
import { L, S, save, skName } from '../store.ts'
import { $, qa, show } from './dom.ts'
import { renderHome } from './home.ts'
import { ICON } from './icons.ts'

function timeLine(id: SkillId) {
  const t = timeSummary(S.times[id] ?? [])
  if (!t) return ''
  const l = L()
  let h = `<p>${l.timeLine(l.stages[t.stage - 1]!, t.last, t.n, t.prev)}</p>`
  const v = t.daily
  if (v.length >= 2) {
    const mx = Math.max(...v), mn = Math.min(...v), W = 140, H = 30
    const pts = v.map((y, i) => `${(i / (v.length - 1) * W).toFixed(1)},${(4 + (mx === mn ? 0.5 : (y - mn) / (mx - mn)) * (H - 8)).toFixed(1)}`).join(' ')
    h += `<svg class="spark-line" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--ten)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
  return h
}

export function renderGrown() {
  const l = L(), cur = currentSkill(S)
  const cards = SK.map(s => {
    const k = S.skills[s.id]
    const line = k.mastered ? l.masteredLine(k.seen, k.first) : k.seen ? l.stageLine(l.stages[k.stage - 1]!, k.seen, k.first) : l.notStarted
    const top = Object.entries(k.err).toSorted((a, b) => b[1] - a[1])[0]
    const slipLine = top ? `<p>${l.mostSlip(l.slips[top[0] as keyof typeof l.slips] ?? l.slips.other, top[1])}</p>` : ''
    const isCur = cur?.id === s.id
    return `<div class="gcard"><span class="opt f" style="${isCur ? 'background:var(--go-fill);color:var(--go-ink)' : k.mastered ? 'background:var(--one);color:#0F3A0C' : ''}">${s.op}</span>
      <div class="gtext"><div class="pname">${skName(s.id)}</div><p>${line}</p>${slipLine}${timeLine(s.id)}</div>
      ${isCur ? `<span class="chip">${l.current}</span>` : `<button class="btn quiet sm" data-here="${s.id}">${l.startHere}</button>`}</div>`
  }).join('')
  $('#grown').innerHTML = `<div class="backrow"><button class="icon-btn" id="gback" aria-label="${l.backHome}">${ICON.back}</button><h1>${l.grownTitle}</h1></div>
    <p class="gintro">${l.grownIntro}</p>
    <div class="glist">${cards}</div>
    <button class="btn quiet sm danger" id="resetBtn">${l.reset}</button>`
  $('#gback').addEventListener('click', () => { show('home'); renderHome() })
  for (const b of qa('[data-here]')) b.addEventListener('click', () => confirmTap(b, () => { startHere(S, b.dataset['here'] as SkillId); save(); renderGrown() }))
  const rb = $('#resetBtn'); rb.addEventListener('click', () => confirmTap(rb, () => { resetProgress(S); save(); renderGrown() }))
}

/** Two-tap confirm: the first tap arms the button for 3 s. */
function confirmTap(btn: HTMLElement, fn: () => void) {
  if (btn.dataset['armed']) { fn(); return }
  const orig = btn.textContent; btn.dataset['armed'] = '1'; btn.textContent = L().confirm
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset['armed']; btn.textContent = orig } }, 3000)
}
