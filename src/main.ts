import './style.css'
import './themes.css'
import { L, S, save } from './store.ts'
import { $, nav } from './ui/dom.ts'
import { renderDone } from './ui/done.ts'
import { renderGrown } from './ui/grown.ts'
import { renderHome } from './ui/home.ts'
import { ICON } from './ui/icons.ts'
import { applyPalette } from './ui/palette.ts'
import { initSession, renderProblem } from './ui/session.ts'
import { SND } from './ui/sound.ts'

// 5 December (Sinterklaas): the ones become pepernoten.
const now = new Date()
if (now.getMonth() === 11 && now.getDate() === 5) document.body.classList.add('pakjes')

function renderHeader() {
  document.documentElement.lang = S.lang
  for (const b of document.querySelectorAll<HTMLElement>('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset['lang'] === S.lang))
  const sb = $('#soundBtn'); sb.innerHTML = S.sound ? ICON.on : ICON.off; sb.setAttribute('aria-label', L().sound); sb.setAttribute('aria-pressed', String(S.sound))
  $('#quit').setAttribute('aria-label', L().quit)
}

function rerender() {
  if (nav.screen === 'home') renderHome()
  else if (nav.screen === 'grown') renderGrown()
  else if (nav.screen === 'session') renderProblem()
  else renderDone(false)
}

for (const b of document.querySelectorAll<HTMLElement>('[data-lang]')) {
  b.addEventListener('click', () => { S.lang = b.dataset['lang'] === 'nl' ? 'nl' : 'en'; save(); renderHeader(); rerender() })
}
$('#soundBtn').addEventListener('click', () => { S.sound = !S.sound; save(); renderHeader(); SND.tap() })
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', applyPalette)
initSession()
applyPalette()
renderHeader()
renderHome()
