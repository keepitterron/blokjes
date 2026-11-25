// The practice session: sum loading, the tray and its moves, answer entry and grading.
import { currentSkill, grade, iso, planSession, queueMissed, recordDay, recordTime, SESSION_LENGTH, type Change, type Result, type Slot, type Stage } from '../core/progress.ts'
import { gen, pick, SK, slip, type Problem, type Slip } from '../core/skills.ts'
import { quicker, record, zoom } from '../core/speed.ts'
import { L, S, save, skName } from '../store.ts'
import { BAR, barsHTML, CUBE, divHTML, framesHTML, matPV, mulHTML, rowCubes, trackFrame, trackTens } from './blocks.ts'
import { $, nav, q, qa, show } from './dom.ts'
import { renderDone } from './done.ts'
import { dogSVG, mood, petDog } from './dog.ts'
import { renderHome } from './home.ts'
import { ICON } from './icons.ts'
import { burst, center, cheer, fly, GREENS, landAt, MIX, REDUCE, wait, zap } from './motion.ts'
import { SND } from './sound.ts'

type Current = Problem & { review: boolean; stage: Stage }
type View = 'build' | 'pic' | 'hidden' | 'shown'

/** Per-sum tray state. A new object per sum (or replay), so moves can tell if the sum changed mid-flight. */
interface Build {
  busy: boolean; locked: boolean; bone: boolean; view: View
  tens: number; frames: number[]; sT: number; sO: number; takenO: number; takenT: number
  rows: number; pile: number; bowls: number[]
  popBar?: boolean; popRow?: boolean; popBowl?: boolean; unfold?: number | undefined
}

/** A record set this session: the best it beat when first broken, and the newest time. */
interface Rec { skill: Problem['skill']; stage: Stage; now: number; before: number }
interface Sess { plan: Slot[]; i: number; first: number; marks: ('' | 'done' | 'miss')[]; notes: string[]; records: Rec[]; seen: Set<string> }

let sess: Sess
let P: Current
let ps: Build
let vals = { t: '', o: '' }, sel: 't' | 'o' = 'o', attempts = 0, helped = false, finished = false, cellMode = '', msgLock = false
let lastTyped: 't' | 'o' | null = null, cooling = false, chkT = 0, advT = 0, idleT = 0, tAct = 0, tLast = 0

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

function initBuild(): Build {
  return {
    busy: false, locked: false, bone: Math.random() < 0.05, view: 'build',
    tens: P.at, frames: [P.ao], sT: P.bt, sO: P.bo, takenO: 0, takenT: 0,
    rows: 0, pile: P.a, bowls: P.op === '÷' ? Array<number>(P.b).fill(0) : [],
  }
}

export function startSession() {
  const plan = planSession(S)
  save()
  sess = { plan, i: 0, first: 0, marks: Array<''>(SESSION_LENGTH).fill(''), notes: [], records: [], seen: new Set() }
  show('session')
  $('#sdog').innerHTML = dogSVG()
  loadProblem()
}

function loadProblem() {
  const slot = sess.plan[sess.i]!
  let prob: Problem
  if (slot.missed) prob = { ...slot.missed }
  else {
    const c = currentSkill(S), skill = slot.review && slot.skill ? slot.skill : (c ? c.id : pick(SK.map(s => s.id)))
    let n = 0
    do { prob = gen(skill); n++ } while (sess.seen.has(prob.key) && n < 25)
  }
  sess.seen.add(prob.key)
  const review = slot.review || !!slot.missed
  P = { ...prob, review, stage: review ? 3 : S.skills[prob.skill].stage }
  ps = initBuild()
  ps.view = P.stage === 1 ? 'build' : P.stage === 2 ? 'pic' : 'hidden'
  vals = { t: '', o: '' }; sel = 'o'; attempts = 0; helped = false; finished = false; cellMode = ''; msgLock = false
  clearTimeout(chkT); clearTimeout(advT); cooling = false; $('#next').hidden = true; tAct = 0; tLast = performance.now()
  mood($('#sdog'), '')
  renderProblem()
  poke()
}

export function renderProblem() {
  const l = L()
  $('#skillName').textContent = skName(P.skill)
  const chip = $('#stageChip')
  chip.innerHTML = P.review ? `${ICON.review}${l.review}` : l.stages[P.stage - 1]!
  chip.className = 'chip' + (P.review ? ' rev' : '')
  renderProg(); renderEq(); renderPad(); renderTray(); renderHint()
}

function renderProg() {
  $('#prog').innerHTML = sess.marks.map((m, i) => `<i class="${m || (i === sess.i ? 'now' : '')}${sess.plan[i]!.review ? ' rv' : ''}"></i>`).join('')
}

/* tray */
function staticHTML() {
  if (P.op === '+') return matPV('+', barsHTML(P.at), framesHTML([P.ao]), barsHTML(P.bt), framesHTML([P.bo]))
  if (P.op === '−') return matPV('−', barsHTML(P.at), framesHTML([P.ao]), trackTens(P.bt, 0), trackFrame(P.bo, 0))
  if (P.op === '×') return mulHTML(P.a, P.a, P.b)
  return divHTML(P.a, Array<number>(P.b).fill(0))
}

function buildHTML() {
  if (P.op === '+') {
    const hasFull = ps.frames.some(f => f === 10)
    return matPV('+',
      barsHTML(ps.tens, { pop: !!ps.popBar, ghostId: (ps.sT > 0 || hasFull) ? 'tslot' : '' }),
      framesHTML(ps.frames, { tradeable: true, extraEmpty: ps.sO > 0 && ps.frames.every(f => f === 10), bone: ps.bone }),
      barsHTML(ps.sT, { act: 'bten' }),
      framesHTML([ps.sO], { act: 'bmove' }))
  }
  if (P.op === '−') {
    const rem = P.bo - ps.takenO
    return matPV('−',
      barsHTML(ps.tens, { act: 'aten', pop: !!ps.popBar }),
      framesHTML(ps.frames, { act: 'aone', ghost: ps.takenO < P.bo && sum(ps.frames) < rem, unfold: ps.unfold, bone: ps.bone }),
      trackTens(P.bt, ps.takenT), trackFrame(P.bo, ps.takenO))
  }
  if (P.op === '×') return mulHTML(ps.rows, P.a, P.b, { build: true, labels: true, pop: !!ps.popRow })
  return divHTML(ps.pile, ps.bowls, { build: true, pop: !!ps.popBowl })
}

function renderTray() {
  const tray = $('#tray')
  tray.classList.toggle('compact', ps.view === 'hidden')
  if (ps.view === 'hidden') tray.innerHTML = `<button class="btn quiet show-btn" data-act="show">${ICON.eye}${L().showMe}</button>`
  else if (ps.view === 'pic' || ps.view === 'shown') tray.innerHTML = `<div class="pic${ps.view === 'shown' ? ' nofr' : ''}">${staticHTML()}</div>`
  else tray.innerHTML = buildHTML()
  ps.popBar = ps.popRow = ps.popBowl = false; ps.unfold = undefined
}

function setMsg(html: string, cls?: string) {
  const m = $('#msg'); m.className = 'msg' + (cls ? ' ' + cls : ''); m.innerHTML = html
  if (cls === 'flash') void m.offsetWidth
}

function renderHint(flashText?: string) {
  if (msgLock) return
  const l = L()
  if (flashText) { setMsg(flashText, 'flash'); return }
  let h = ''
  if (ps.view === 'hidden' && P.review) { setMsg(l.hReview(l.opWord[P.op]), 'rv'); return }
  if (ps.view === 'hidden') h = l.hNumbers
  else if (ps.view === 'pic') h = l.hPicture
  else if (ps.view === 'build') {
    if (P.op === '+') { const full = ps.frames.some(f => f === 10); h = ps.sO > 0 ? l.hMoveOnes : full ? l.hTrade : ps.sT > 0 ? l.hMoveTens : l.hWrite }
    else if (P.op === '−') {
      const rem = P.bo - ps.takenO
      if (rem > 0) h = l.hTakeOnes(rem) + (sum(ps.frames) < rem ? ' ' + l.hBreak : '')
      else if (ps.takenT < P.bt) h = l.hTakeTens(P.bt - ps.takenT)
      else h = l.hWrite
    }
    else if (P.op === '×') h = ps.rows < P.a ? l.hRows(P.a, P.b) : ps.rows === P.a ? l.hRowsDone : l.hTooMany
    else h = ps.pile > 0 ? l.hShare(P.a, P.b) : l.hShareDone
  }
  setMsg(h)
}
function render() { renderTray(); renderHint() }

/* moves: shared by taps and the replay */
const last = (s: string) => qa(s).pop() ?? null

async function addMoveOne(el?: HTMLElement) {
  const s = ps; if (s.sO <= 0) return
  const src = el ?? last('#bO [data-act="bmove"]')
  const dest = q('#aO .frame .sl:empty'), pt = dest && center(dest)
  await fly(src, dest, CUBE, { fast: s.locked }); if (ps !== s) return
  s.sO--; const i = s.frames.findIndex(f => f < 10); if (i < 0) s.frames.push(1); else s.frames[i]!++
  SND.pop(); render(); landAt(pt)
}
async function addTrade(fi: number) {
  const s = ps, fr = q(`#aO .frame[data-fi="${fi}"]`); if (!fr) return
  const c = center(fr), cubes = [...fr.querySelectorAll<HTMLElement>('.cb')]
  fr.classList.remove('full'); SND.tap()
  if (!REDUCE) {
    const step = s.locked ? 12 : 22
    cubes.forEach((cb, k) => {
      const r = center(cb)
      cb.animate([{ transform: 'none' }, { transform: `translate(${(c.x - r.x) * 0.9}px,${(c.y - r.y) * 0.9}px) scale(.5)`, opacity: 0.85 }], { duration: 260, delay: k * step, easing: 'cubic-bezier(.55,0,.8,.2)', fill: 'forwards' })
    })
    await wait(260 + cubes.length * step + 20)
  }
  if (ps !== s) return
  for (const cb of cubes) cb.style.visibility = 'hidden'
  burst(c, MIX, 14, 44); SND.snap()
  const dest = q('#tslot'), pt = dest && center(dest)
  await fly(fr, dest, BAR, { size: 'dest', popIn: true, keep: true, dur: 460, fast: s.locked }); if (ps !== s) return
  s.frames.splice(fi, 1); if (!s.frames.length) s.frames = [0]
  s.tens++; render(); landAt(pt)
}
async function addMoveTen(el?: HTMLElement) {
  const s = ps; if (s.sT <= 0) return
  const src = el ?? last('#bT [data-act="bten"]')
  const dest = q('#tslot'), pt = dest && center(dest)
  await fly(src, dest, BAR, { fast: s.locked }); if (ps !== s) return
  s.sT--; s.tens++; SND.pop(); render(); landAt(pt)
}
async function subTakeOne(el?: HTMLElement) {
  const s = ps
  const src = el ?? last('#aO [data-act="aone"]'); if (!src) return
  const fi = Number(src.dataset['fi']), dest = q('#tkO'), pt = dest && center(dest)
  await fly(src, dest, CUBE, { fast: s.locked }); if (ps !== s) return
  s.frames[fi]!--; if (s.frames[fi] === 0 && s.frames.length > 1) s.frames.splice(fi, 1)
  s.takenO++; SND.pop(); render(); landAt(pt)
}
async function subOpenTen(el?: HTMLElement) {
  const s = ps
  const src = el ?? last('#aT [data-act="aten"]'); if (!src) return
  src.classList.add('shake'); SND.crack()
  await wait(REDUCE ? 0 : 280); if (ps !== s) return
  const dest = q('#gframe'), pt = dest && center(dest)
  await fly(src, dest, BAR, { dur: 440, fast: s.locked }); if (ps !== s) return
  burst(pt, GREENS, 14, 46)
  s.tens--
  if (s.frames.length === 1 && s.frames[0] === 0) { s.frames = [10]; s.unfold = 0 } else { s.frames.push(10); s.unfold = s.frames.length - 1 }
  SND.snap(); render()
}
async function subTakeTen(el?: HTMLElement) {
  const s = ps
  const src = el ?? last('#aT [data-act="aten"]'); if (!src) return
  const dest = q('#tkT'), pt = dest && center(dest)
  await fly(src, dest, BAR, { fast: s.locked }); if (ps !== s) return
  s.tens--; s.takenT++; SND.pop(); render(); landAt(pt)
}
async function mulAddRow() {
  const s = ps, src = q('#rowpiece'), dest = q('#nextrow'); if (!dest) return
  const pt = center(dest)
  await fly(src, dest, `<div class="acells">${rowCubes(P.b)}</div>`, { keep: true, fast: s.locked }); if (ps !== s) return
  s.rows++; SND.pop(); render(); landAt(pt)
}
async function mulDelRow(el: HTMLElement) {
  const s = ps; if (s.rows <= 0) return
  await fly(el, q('#rowpiece'), `<div class="acells">${rowCubes(P.b)}</div>`, { fast: s.locked }); if (ps !== s) return
  s.rows--; SND.tap(); render()
}
async function divDeal() {
  const s = ps; if (s.pile < P.b) return
  const cubes = qa('#pile .cb').slice(-P.b).toReversed()
  const pts = cubes.map((_, i) => { const d = q('#bs-' + i); return d ? center(d) : null })
  await Promise.all(cubes.map((c, i) => wait(REDUCE ? 0 : i * (s.locked ? 50 : 90)).then(() => fly(c, q('#bs-' + i), '<i class="cb o sm"></i>', { fast: s.locked }))))
  if (ps !== s) return
  s.pile -= P.b; s.bowls = s.bowls.map(n => n + 1); SND.pop(); render()
  pts.forEach(landAt)
  if (!REDUCE) qa('#tray .bowl').forEach((b, i) => b.animate([{ transform: 'none' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], { duration: 380, delay: i * 30, easing: 'ease-out' }))
}

function go(fn: () => Promise<void>) {
  const s = ps
  s.busy = true
  fn().finally(() => { s.busy = false }).catch(console.error)
}

function handle(act: string, el: HTMLElement) {
  const l = L()
  if (act === 'show') { if (finished && !ps.locked) return; helped = true; ps.view = 'shown'; SND.tap(); render(); return }
  if (ps.busy || ps.locked || finished || ps.view !== 'build') return
  if (P.op === '+') {
    const full = ps.frames.findIndex(f => f === 10)
    if (act === 'bmove') go(() => addMoveOne(el))
    else if (act === 'trade') go(() => addTrade(Number(el.dataset['fi'])))
    else if (act === 'bten') {
      if (ps.sO > 0) renderHint(l.hOnesFirst)
      else if (full >= 0) renderHint(l.hTradeFirst)
      else go(() => addMoveTen(el))
    }
  } else if (P.op === '−') {
    const rem = P.bo - ps.takenO
    if (act === 'aone') {
      if (rem > 0) go(() => subTakeOne(el))
      else renderHint(ps.takenT < P.bt ? l.hTakeTens(P.bt - ps.takenT) : l.hWrite)
    } else if (act === 'aten') {
      if (rem > 0) { if (sum(ps.frames) < rem) go(() => subOpenTen(el)); else renderHint(l.hEnough) }
      else if (ps.takenT < P.bt) go(() => subTakeTen(el))
      else renderHint(l.hWrite)
    }
  } else if (P.op === '×') {
    if (act === 'addrow') go(mulAddRow)
    else if (act === 'delrow') go(() => mulDelRow(el))
  } else if (act === 'deal') go(divDeal)
}

/** Plays the whole solution with the same moves, sped up. */
async function replay() {
  const s = initBuild(); s.locked = true; ps = s; renderTray()
  const ok = () => ps === s && nav.screen === 'session'
  await wait(REDUCE ? 0 : 450)
  if (P.op === '+') {
    while (ok() && s.sO > 0) { await addMoveOne(); await wait(20) }
    const fi = s.frames.findIndex(f => f === 10)
    if (ok() && fi >= 0) { await wait(250); await addTrade(fi) }
    while (ok() && s.sT > 0) { await wait(60); await addMoveTen() }
  } else if (P.op === '−') {
    while (ok() && s.takenO < P.bo) {
      if (sum(s.frames) < P.bo - s.takenO) { await subOpenTen(); await wait(250) }
      else { await subTakeOne(); await wait(20) }
    }
    while (ok() && s.takenT < P.bt) { await wait(60); await subTakeTen() }
  } else if (P.op === '×') {
    while (ok() && s.rows < P.a) { await mulAddRow(); await wait(120) }
  } else {
    while (ok() && s.pile > 0) { await divDeal(); await wait(150) }
  }
}

/* answer entry */
/** Active time: gaps between interactions are capped at 30 s. */
function tick() { const n = performance.now(); tAct += Math.min(n - tLast, 30000); tLast = n }

function renderEq() {
  const l = L()
  const cell = (k: 't' | 'o') => `<button class="cell ${k}${sel === k && !finished ? ' sel' : ''}${cellMode ? ' ' + cellMode : ''}" data-cell="${k}" aria-label="${k === 't' ? 'tens' : 'ones'}"><span class="cl">${k === 't' ? l.colT : l.colO}</span><span class="cv f${lastTyped === k ? ' typed' : ''}">${vals[k]}</span></button>`
  $('#eq').innerHTML = `<span>${P.a}</span><span${P.review ? ' class="opx"' : ''}>${P.op}</span><span>${P.b}</span><span>=</span><div class="cells">${cell('t')}${cell('o')}</div>`
}

function renderPad() {
  const l = L()
  $('#pad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button data-d="${d}">${d}</button>`).join('') +
    `<button class="erase" data-erase="1" aria-label="erase">${ICON.erase}</button>`
  $('#next').textContent = sess.i === SESSION_LENGTH - 1 ? l.finish : l.next
}

function typeDigit(d: string) {
  if (finished || cooling) return
  vals[sel] = d; lastTyped = sel
  if (sel === 'o') sel = 't'
  mood($('#sdog'), 'think', 1400); SND.tap(); renderEq(); lastTyped = null
  clearTimeout(chkT)
  // Auto-check once as many digits as the answer has are in (this reveals the digit count).
  if (vals.o !== '' && (P.ans < 10 || vals.t !== '')) chkT = window.setTimeout(check, REDUCE ? 0 : 280)
}

function erase() {
  if (finished) return
  clearTimeout(chkT)
  if (vals[sel] === '') sel = sel === 't' ? 'o' : 't'
  vals[sel] = ''; SND.tap(); renderEq()
}

function slipMsg(type: Slip) {
  const l = L()
  if (type === 'carry') return l.mCarry(P.ao, P.bo)
  if (type === 'flip') return l.mFlip(P.ao, P.bo)
  if (type === 'keep') return l.mKeep
  if (type === 'added') return l.mAdded(P.a, P.b)
  return l.mLook
}

function noteFor(c: Change) {
  const l = L()
  if (!c) return null
  if (c.kind === 'stage') return l.lvlStage(skName(P.skill), l.stages[c.stage - 1]!)
  if (c.kind === 'master') return l.lvlMaster(skName(P.skill))
  return l.lvlDown
}

function check() {
  if (finished || vals.o === '') return
  const l = L(); tick()
  const v = (vals.t === '' ? 0 : Number(vals.t)) * 10 + Number(vals.o)
  attempts++; msgLock = true
  if (v === P.ans) {
    finished = true; cellMode = 'ok'
    const result: Result = attempts === 1 ? (helped ? 'helped' : 'first') : 'second'
    if (result === 'first') sess.first++
    sess.marks[sess.i] = 'done'
    const note = noteFor(grade(S.skills[P.skill], result, P.review)); if (note) sess.notes.push(note)
    const fast = result === 'first' && timeFirst()
    setMsg(`${pick(fast ? l.zoom : l.praise)}${note ? `<span class="note">${note}</span>` : ''}`, 'good')
    mood($('#sdog'), 'happy', 1800); SND.good(); cheer()
    if (fast) { zap(); SND.zoom() }
    ps.locked = true
    clearTimeout(idleT)
    advT = window.setTimeout(() => { if (nav.screen === 'session' && finished) nextProblem() }, 1900)
  } else {
    const type = slip(P, v), s = S.skills[P.skill]; s.err[type] = (s.err[type] ?? 0) + 1
    mood($('#sdog'), 'gentle', 2200); SND.soft()
    cellMode = 'bad'
    if (attempts === 1) {
      setMsg(slipMsg(type) + ' ' + l.tryAgain)
      cooling = true
      setTimeout(() => { cooling = false; if (finished) return; cellMode = ''; vals = { t: '', o: '' }; sel = 'o'; renderEq() }, 450)
    } else {
      finished = true; sess.marks[sess.i] = 'miss'
      const note = noteFor(grade(S.skills[P.skill], 'wrong', P.review)); if (note) sess.notes.push(note)
      queueMissed(S, P)
      $('#next').hidden = false
      setMsg(`${l.reveal(P.ans)}${note ? `<span class="note">${note}</span>` : ''}`)
      setTimeout(() => { cellMode = 'shown'; vals = { t: P.ans >= 10 ? String(Math.floor(P.ans / 10)) : '', o: String(P.ans % 10) }; renderEq() }, 450)
      clearTimeout(idleT)
    }
    replay().catch(console.error)
  }
  save(); renderProg(); renderEq(); renderPad()
}

/** Stores a first-try time. True when it was quick enough to celebrate (a zoom or a new record). */
function timeFirst() {
  const e = { s: P.stage, t: Math.round(tAct / 100) / 10, d: iso(new Date()) }, before = S.times[P.skill] ?? []
  const z = zoom(before, e), rec = record(before, e)
  recordTime(S, P.skill, e)
  if (rec) {
    const r = sess.records.find(x => x.skill === P.skill && x.stage === P.stage)
    if (r) r.now = rec.now; else sess.records.push({ skill: P.skill, stage: P.stage, ...rec })
  }
  return z || !!rec
}

function nextProblem() {
  clearTimeout(advT); clearTimeout(chkT); SND.tap()
  sess.i++
  if (sess.i >= SESSION_LENGTH) endSession(); else loadProblem()
}

function endSession() {
  const today = iso(new Date())
  recordDay(S, today)
  const l = L(), speed = sess.records.map(r => ({ text: l.record(skName(r.skill), l.stages[r.stage - 1]!, r.now, r.before), rec: true }))
  for (const k of SK) {
    const qk = quicker(S.times[k.id] ?? [], today)
    if (qk) speed.push({ text: l.quicker(skName(k.id), qk.now, qk.before), rec: false })
  }
  save(); show('done'); renderDone(true, { first: sess.first, notes: sess.notes, speed })
}

/* idle: Spartacus naps after 45 s */
function poke() {
  clearTimeout(idleT)
  const d = $('#sdog')
  if (d.classList.contains('sleep')) mood(d, '')
  if (nav.screen === 'session' && !finished) idleT = window.setTimeout(() => mood($('#sdog'), 'sleep'), 45000)
}

export function initSession() {
  $('#tray').addEventListener('click', e => { const el = (e.target as Element).closest<HTMLElement>('[data-act]'); if (el) handle(el.dataset['act']!, el) })
  $('#eq').addEventListener('click', e => { const c = (e.target as Element).closest<HTMLElement>('[data-cell]'); if (!c || finished) return; sel = c.dataset['cell'] as 't' | 'o'; SND.tap(); renderEq() })
  $('#pad').addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('button'); if (!b) return
    if (b.dataset['erase']) erase(); else typeDigit(b.dataset['d']!)
  })
  $('#next').addEventListener('click', () => { if (finished) nextProblem() })
  $('#quit').addEventListener('click', () => {
    clearTimeout(idleT); clearTimeout(advT); clearTimeout(chkT)
    ps = { ...ps } // new identity: any move still in flight stops
    show('home'); renderHome()
  })
  document.addEventListener('pointerdown', e => { if (nav.screen !== 'session') return; tick(); if (!(e.target as Element).closest('#sdog')) poke() })
  // Time away from the app doesn't count.
  document.addEventListener('visibilitychange', () => { if (nav.screen === 'session' && !document.hidden) tLast = performance.now() - 1 })
  $('#sdog').addEventListener('click', () => { petDog($('#sdog')); poke() })
  document.addEventListener('keydown', e => {
    if (nav.screen !== 'session') return
    if (/^[0-9]$/.test(e.key)) { typeDigit(e.key); e.preventDefault() }
    else if (e.key === 'Backspace') { erase(); e.preventDefault() }
    else if (e.key === 'Enter') { e.preventDefault(); if (finished && !$('#next').hidden) nextProblem() }
  })
}
