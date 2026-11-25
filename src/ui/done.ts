import { SESSION_LENGTH } from '../core/progress.ts'
import { ri } from '../core/skills.ts'
import { L } from '../store.ts'
import { $, q, show } from './dom.ts'
import { dogSVG, mood, petDog } from './dog.ts'
import { renderHome } from './home.ts'
import { SND } from './sound.ts'

let last = { first: 0, notes: [] as string[] }

/** first: just finished (cheer); otherwise a re-render, e.g. after switching language. */
export function renderDone(first: boolean, summary = last) {
  last = summary
  const l = L(), perfect = summary.first === SESSION_LENGTH
  $('#done').innerHTML = `<div class="confetti" id="conf"></div>
    <div class="dogwrap dog" id="ddog">${dogSVG()}</div>
    <h1>${l.doneTitle}</h1>
    <p>${l.summary(summary.first, SESSION_LENGTH)}${perfect ? ' ' + l.perfect : ''}</p>
    ${summary.notes.length ? `<ul class="notes">${summary.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : '<div style="height:18px"></div>'}
    <button class="btn" id="homeBtn">${l.backHome}</button>`
  const dd = $('#ddog'); dd.addEventListener('click', () => petDog(dd))
  $('#homeBtn').addEventListener('click', () => { SND.tap(); show('home'); renderHome() })
  if (first) { mood(dd, 'happy', 2600); SND.done(); if (perfect) confetti() }
}

function confetti() {
  const c = q('#conf'); if (!c) return
  let h = ''
  for (let i = 0; i < 40; i++) {
    const ten = Math.random() < 0.35
    h += `<i class="${ten ? 'bar' : 'cb o'}" style="left:${Math.round(Math.random() * 100)}%;${ten ? '' : '--s:' + ri(12, 20) + 'px;'}animation-duration:${(2.2 + Math.random() * 1.8).toFixed(2)}s;animation-delay:${(Math.random() * 0.8).toFixed(2)}s"></i>`
  }
  c.innerHTML = h
}
