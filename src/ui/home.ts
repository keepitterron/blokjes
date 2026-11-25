import { currentSkill, iso } from '../core/progress.ts'
import { SK } from '../core/skills.ts'
import { hasRecord, quicker } from '../core/speed.ts'
import { L, S } from '../store.ts'
import { $, show } from './dom.ts'
import { dogSVG, petDog } from './dog.ts'
import { renderGrown } from './grown.ts'
import { ICON } from './icons.ts'
import { startSession } from './session.ts'
import { SND } from './sound.ts'

export function renderHome() {
  const l = L(), doneToday = S.days.includes(iso(new Date())), cur = currentSkill(S)
  const now = new Date(), dow = (now.getDay() + 6) % 7
  let week = ''
  for (let i = 0; i < 7; i++) {
    const k = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i))
    const fast = S.days.includes(k) && SK.some(s => quicker(S.times[s.id] ?? [], k))
    week += `<span class="day${S.days.includes(k) ? ' on' : ''}${i === dow ? ' today' : ''}" aria-label="${k}${fast ? ', ' + l.fastDay : ''}">${l.days[i]}${fast ? `<span class="bolt">${ICON.bolt}</span>` : ''}</span>`
  }
  let path = ''
  for (const s of SK) {
    const k = S.skills[s.id], isCur = cur?.id === s.id, locked = !k.mastered && !isCur
    const pips = l.stages.map((g, i) => `<span class="pip${k.mastered || (k.stage > i && !locked) ? ' on' : ''}">${g}</span>`).join('')
    path += `<li class="${k.mastered ? 'done' : isCur ? 'cur' : 'lock'}"><span class="opt f">${s.op}</span><div class="ptxt"><div class="pname">${l.sk[s.id][0]}${hasRecord(S.times[s.id] ?? []) ? ` <span class="bolt" role="img" aria-label="${l.hasRecord}">${ICON.bolt}</span>` : ''}</div><div class="psub">${l.sk[s.id][1]}</div><div class="pips">${k.mastered ? `<span class="pip on">${l.mastered}</span>` : pips}</div></div></li>`
  }
  $('#home').innerHTML = `
    <div class="hero"><div class="dogwrap dog" id="hdog">${dogSVG()}</div><div><h1>${l.hello}</h1><p>${l.helloSub}</p></div></div>
    <div class="today"><div><h2>${doneToday ? l.doneTodayTitle : l.todayTitle}</h2><p>${doneToday ? l.doneTodayMeta : l.todayMeta}</p></div>
      <div class="acts"><button class="btn${doneToday ? ' quiet' : ''}" id="startBtn">${doneToday ? l.again : l.start}</button></div></div>
    <div class="week"><span class="lbl">${l.week}</span>${week}</div>
    <h2>${l.path}</h2><ol class="path">${path}</ol>
    <div class="home-foot"><button class="link" id="toGrown">${l.grown}</button></div>`
  $('#startBtn').addEventListener('click', () => { SND.tap(); startSession() })
  $('#toGrown').addEventListener('click', () => { show('grown'); renderGrown() })
  const hd = $('#hdog'); hd.addEventListener('click', () => petDog(hd))
}
