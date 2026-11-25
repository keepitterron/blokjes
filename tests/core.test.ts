import { describe, expect, it } from 'vitest'
import { blankSkill, grade, planSession, queueMissed, repair, startHere, type TimeEntry } from '../src/core/progress.ts'
import { fill, gen, slip, SK, type SkillId } from '../src/core/skills.ts'
import { quicker, timeSummary } from '../src/core/speed.ts'

const many = (skill: SkillId) => Array.from({ length: 2000 }, () => gen(skill))

describe('gen', () => {
  it('add1: no carrying, answer under 100', () => {
    for (const p of many('add1')) {
      expect(p.ao + p.bo).toBeLessThanOrEqual(9)
      expect(p.at + p.bt).toBeLessThanOrEqual(8)
      expect(p.ans).toBe(p.a + p.b)
    }
  })
  it('add2: always carries, answer under 100', () => {
    for (const p of many('add2')) {
      expect(p.ao + p.bo).toBeGreaterThanOrEqual(10)
      expect(p.at + p.bt).toBeLessThanOrEqual(7)
      expect(p.ans).toBeLessThan(100)
    }
  })
  it('sub1: never borrows, never negative', () => {
    for (const p of many('sub1')) {
      expect(p.bo).toBeLessThanOrEqual(p.ao)
      expect(p.bt).toBeGreaterThanOrEqual(1)
      expect(p.ans).toBe(p.a - p.b)
      expect(p.ans).toBeGreaterThan(0)
    }
  })
  it('sub2: always borrows, never negative', () => {
    for (const p of many('sub2')) {
      expect(p.bo).toBeGreaterThan(p.ao)
      expect(p.ans).toBe(p.a - p.b)
      expect(p.ans).toBeGreaterThan(0)
    }
  })
  it('mul and div stay in range and divide exactly', () => {
    for (const p of many('mul')) { expect(p.a).toBeGreaterThanOrEqual(2); expect(p.a).toBeLessThanOrEqual(5); expect(p.b).toBeLessThanOrEqual(6); expect(p.ans).toBe(p.a * p.b) }
    for (const p of many('div')) { expect(p.a % p.b).toBe(0); expect(p.ans).toBe(p.a / p.b); expect(p.ans).toBeLessThanOrEqual(6) }
  })
})

it('fill splits ones into ten-frames', () => {
  expect(fill(0)).toEqual([0])
  expect(fill(23)).toEqual([10, 10, 3])
})

describe('slip', () => {
  const add = { ...gen('add2'), at: 2, ao: 7, bt: 1, bo: 5, a: 27, b: 15, ans: 42 }
  const sub = { ...gen('sub2'), at: 5, ao: 3, bt: 1, bo: 7, a: 53, b: 17, ans: 36 }
  it('spots the classic slips', () => {
    expect(slip(add, 32)).toBe('carry')
    expect(slip(sub, 44)).toBe('flip')
    expect(slip(sub, 46)).toBe('keep')
    expect(slip({ ...gen('mul'), a: 3, b: 4, ans: 12 }, 7)).toBe('added')
    expect(slip(add, 41)).toBe('other')
  })
})

describe('grade', () => {
  it('3 first-try moves up a stage; 4 at Numbers masters', () => {
    const s = blankSkill()
    expect(grade(s, 'first', false)).toBeNull()
    expect(grade(s, 'first', false)).toBeNull()
    expect(grade(s, 'first', false)).toEqual({ kind: 'stage', stage: 2 })
    for (let i = 0; i < 3; i++) grade(s, 'first', false)
    expect(s.stage).toBe(3)
    for (let i = 0; i < 3; i++) expect(grade(s, 'first', false)).toBeNull()
    expect(grade(s, 'first', false)).toEqual({ kind: 'master' })
    expect(s.mastered).toBe(true)
  })
  it('2 wrong in a row drops a stage, never below Build', () => {
    const s = { ...blankSkill(), stage: 2 as const }
    grade(s, 'wrong', false)
    expect(grade(s, 'wrong', false)).toEqual({ kind: 'down' })
    expect(s.stage).toBe(1)
    grade(s, 'wrong', false)
    expect(grade(s, 'wrong', false)).toBeNull()
  })
  it('second try resets the streak without counting as a miss; helped is neutral', () => {
    const s = blankSkill()
    grade(s, 'first', false); grade(s, 'first', false)
    grade(s, 'second', false)
    expect(s.streak).toBe(0)
    grade(s, 'wrong', false)
    expect(s.wrongRun).toBe(1)
    grade(s, 'helped', false)
    expect(s).toMatchObject({ streak: 0, wrongRun: 1 })
  })
  it('reviews count but never move the stage', () => {
    const s = blankSkill()
    for (let i = 0; i < 5; i++) expect(grade(s, 'first', true)).toBeNull()
    expect(s).toMatchObject({ stage: 1, streak: 0, seen: 5, first: 5 })
  })
})

describe('planSession', () => {
  it('slots 3 and 7 review missed sums first, then mastered skills', () => {
    const d = repair(null, 'en')
    d.skills.add1.mastered = true
    queueMissed(d, gen('add1'))
    const plan = planSession(d)
    expect(plan.map(p => p.review)).toEqual([false, false, true, false, false, false, true, false])
    expect(plan[2]!.missed).toBeDefined()
    expect(plan[6]!.skill).toBe('add1')
    expect(d.missed).toHaveLength(0)
  })
  it('no reviews before anything is mastered', () => {
    expect(planSession(repair(null, 'en')).every(p => !p.review)).toBe(true)
  })
  it('all mastered: 8 mixed reviews', () => {
    const d = repair(null, 'en')
    for (const s of SK) d.skills[s.id].mastered = true
    expect(planSession(d).every(p => p.review && p.skill)).toBe(true)
  })
})

it('queueMissed de-duplicates and keeps 12', () => {
  const d = repair(null, 'en')
  const p = gen('add1')
  queueMissed(d, p); queueMissed(d, p)
  expect(d.missed).toHaveLength(1)
  for (let i = 0; i < 20; i++) queueMissed(d, { ...p, key: `k${i}` })
  expect(d.missed).toHaveLength(12)
})

it('repair keeps stored progress and fills gaps', () => {
  const d = repair({ lang: 'nl', sound: false, skills: { add1: { stage: 2 } } }, 'en')
  expect(d).toMatchObject({ lang: 'nl', sound: false, days: [], missed: [], times: {} })
  expect(d.skills.add1).toMatchObject({ stage: 2, streak: 0, mastered: false })
  expect(d.skills.div.stage).toBe(1)
  expect(repair('garbage', 'nl').lang).toBe('nl')
})

it('startHere masters earlier skills and resets later ones', () => {
  const d = repair(null, 'en')
  d.skills.mul.stage = 3
  queueMissed(d, gen('add1')); queueMissed(d, gen('mul'))
  startHere(d, 'sub1')
  expect(d.skills.add2).toMatchObject({ mastered: true, stage: 3 })
  expect(d.skills.mul).toMatchObject({ mastered: false, stage: 1 })
  expect(d.missed.map(m => m.skill)).toEqual(['add1'])
})

describe('speed', () => {
  const e = (t: number, d: string): TimeEntry => ({ s: 3, t, d })
  it('notes a 10% quicker median only with 3+ sums each side', () => {
    const before = [e(20, '2026-11-01'), e(22, '2026-11-02'), e(18, '2026-11-03')]
    expect(quicker([...before, e(12, 'T'), e(14, 'T'), e(13, 'T')], 'T')).toEqual({ now: 13, before: 20 })
    expect(quicker([...before, e(19, 'T'), e(20, 'T'), e(19, 'T')], 'T')).toBeNull()
    expect(quicker([...before, e(5, 'T'), e(5, 'T')], 'T')).toBeNull()
  })
  it('summarises the latest stage', () => {
    expect(timeSummary([])).toBeNull()
    const s = timeSummary([e(10, 'a'), e(20, 'a'), e(30, 'b')])
    expect(s).toEqual({ stage: 3, last: 20, n: 3, prev: null, daily: [15, 30] })
  })
})

it('repair keeps a known palette and falls back to the default', () => {
  expect(repair({ palette: 'unicorn' }, 'en').palette).toBe('unicorn')
  expect(repair({ palette: 'neon' }, 'en').palette).toBe('lavender')
  expect(repair(null, 'en').palette).toBe('lavender')
})
