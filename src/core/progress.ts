import { pick, SK, type Problem, type Rand, type SkillId, type Slip } from './skills.ts'

export type Lang = 'en' | 'nl'
export type Stage = 1 | 2 | 3

export interface SkillState {
  stage: Stage
  streak: number
  wrongRun: number
  mastered: boolean
  seen: number
  first: number
  err: Partial<Record<Slip, number>>
}

/** A first-try timing: stage, active seconds, YYYY-MM-DD. */
export interface TimeEntry { s: Stage; t: number; d: string }

/** Everything persisted under localStorage 'blokjes-v1'. */
export interface Data {
  lang: Lang
  sound: boolean
  skills: Record<SkillId, SkillState>
  days: string[]
  missed: Problem[]
  times: Partial<Record<SkillId, TimeEntry[]>>
}

export const blankSkill = (): SkillState => ({ stage: 1, streak: 0, wrongRun: 0, mastered: false, seen: 0, first: 0, err: {} })

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object'

/** Fills in anything missing from a stored (or absent) save. */
export function repair(raw: unknown, defaultLang: Lang): Data {
  const d = isObj(raw) ? raw : {}
  const skills = isObj(d['skills']) ? d['skills'] : {}
  return {
    lang: d['lang'] === 'nl' || d['lang'] === 'en' ? d['lang'] : defaultLang,
    sound: d['sound'] !== false,
    skills: Object.fromEntries(SK.map(s => [s.id, { ...blankSkill(), ...(isObj(skills[s.id]) ? skills[s.id] as object : {}) }])) as Record<SkillId, SkillState>,
    days: Array.isArray(d['days']) ? d['days'] : [],
    missed: Array.isArray(d['missed']) ? d['missed'] : [],
    times: isObj(d['times']) ? d['times'] : {},
  }
}

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The first skill that isn't mastered. */
export const currentSkill = (d: Data) => SK.find(s => !d.skills[s.id].mastered)

export type Result = 'first' | 'second' | 'helped' | 'wrong'
export type Change = { kind: 'stage'; stage: Stage } | { kind: 'master' } | { kind: 'down' } | null

/** Updates a skill after a sum. Reviews count towards totals but never move the stage. */
export function grade(s: SkillState, result: Result, review: boolean): Change {
  s.seen++
  if (result === 'first') s.first++
  if (review) return null
  if (result === 'first') {
    s.wrongRun = 0
    s.streak++
    if (s.stage < 3 && s.streak >= 3) { s.stage = (s.stage + 1) as Stage; s.streak = 0; return { kind: 'stage', stage: s.stage } }
    if (s.stage === 3 && s.streak >= 4) { s.mastered = true; s.streak = 0; return { kind: 'master' } }
  } else if (result === 'second') {
    s.streak = 0
  } else if (result === 'wrong') {
    s.streak = 0
    s.wrongRun++
    if (s.wrongRun >= 2 && s.stage > 1) { s.stage = (s.stage - 1) as Stage; s.wrongRun = 0; return { kind: 'down' } }
  }
  return null
}

export interface Slot { review: boolean; skill?: SkillId; missed?: Problem }
export const SESSION_LENGTH = 8
const REVIEW_SLOTS = [2, 6]

/** Plans 8 slots. Takes missed sums off the review queue, so save afterwards. */
export function planSession(d: Data, rand: Rand = Math.random): Slot[] {
  const cur = currentSkill(d)
  const masteredIds = SK.filter(s => d.skills[s.id].mastered).map(s => s.id)
  const all = SK.map(s => s.id)
  const plan: Slot[] = Array.from({ length: SESSION_LENGTH }, () => (cur ? { review: false } : { review: true, skill: pick(all, rand) }))
  if (cur) {
    for (const k of REVIEW_SLOTS) {
      const missed = d.missed.shift()
      if (missed) plan[k] = { review: true, missed }
      else if (masteredIds.length) plan[k] = { review: true, skill: pick(masteredIds, rand) }
    }
  } else {
    for (const p of plan) { const missed = d.missed.shift(); if (missed) p.missed = missed }
  }
  return plan
}

/** Adds a sum to the review queue: de-duplicated, at most 12. */
export function queueMissed(d: Data, p: Problem) {
  const { skill, op, a, b, ans, at, ao, bt, bo, key } = p
  if (!d.missed.some(m => m.key === key)) d.missed.push({ skill, op, a, b, ans, at, ao, bt, bo, key })
  if (d.missed.length > 12) d.missed.shift()
}

export function recordTime(d: Data, skill: SkillId, e: TimeEntry) {
  const a = (d.times[skill] ??= [])
  a.push(e)
  if (a.length > 80) a.splice(0, a.length - 80)
}

export function recordDay(d: Data, day: string) {
  if (!d.days.includes(day)) d.days.push(day)
  if (d.days.length > 120) d.days = d.days.slice(-120)
}

/** Grown-ups "Start here": earlier skills mastered, this one and later reset. */
export function startHere(d: Data, id: SkillId) {
  const idx = SK.findIndex(s => s.id === id)
  SK.forEach((s, i) => {
    const k = d.skills[s.id]
    if (i < idx) { k.mastered = true; k.stage = 3 }
    else { k.mastered = false; k.stage = 1; k.streak = 0; k.wrongRun = 0 }
  })
  d.missed = d.missed.filter(m => SK.findIndex(s => s.id === m.skill) < idx)
}

export function resetProgress(d: Data) {
  for (const s of SK) d.skills[s.id] = blankSkill()
  d.days = []
  d.missed = []
  d.times = {}
}
