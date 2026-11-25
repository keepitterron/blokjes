export type Op = '+' | '−' | '×' | '÷'
export type SkillId = 'add1' | 'add2' | 'sub1' | 'sub2' | 'mul' | 'div'
export type Rand = () => number

/** Skills in teaching order. */
export const SK: readonly { id: SkillId; op: Op }[] = [
  { id: 'add1', op: '+' },
  { id: 'add2', op: '+' },
  { id: 'sub1', op: '−' },
  { id: 'sub2', op: '−' },
  { id: 'mul', op: '×' },
  { id: 'div', op: '÷' },
]

/** A sum. at/ao/bt/bo are the tens and ones digits of a and b (0 for × and ÷). */
export interface Problem {
  skill: SkillId
  op: Op
  a: number
  b: number
  ans: number
  at: number
  ao: number
  bt: number
  bo: number
  key: string
}

export const ri = (a: number, b: number, rand: Rand = Math.random) => a + Math.floor(rand() * (b - a + 1))
export const pick = <T>(a: readonly T[], rand: Rand = Math.random): T => a[Math.floor(rand() * a.length)] as T
export const opOf = (skill: SkillId): Op => SK.find(s => s.id === skill)!.op

export function gen(skill: SkillId, rand: Rand = Math.random): Problem {
  const r = (a: number, b: number) => ri(a, b, rand)
  const op = opOf(skill)
  let at = 0, ao = 0, bt = 0, bo = 0, a: number, b: number, ans: number
  if (skill === 'add1') { at = r(1, 7); bt = r(1, 8 - at); ao = r(1, 8); bo = r(1, 9 - ao) }
  else if (skill === 'add2') { at = r(1, 6); bt = r(1, 7 - at); ao = r(2, 9); bo = r(10 - ao, 9) }
  else if (skill === 'sub1') { at = r(2, 9); ao = r(1, 9); bt = r(1, at - 1); bo = r(0, ao) }
  else if (skill === 'sub2') { at = r(2, 9); ao = r(0, 8); bo = r(ao + 1, 9); bt = r(0, at - 1) }
  if (skill === 'mul') { a = r(2, 5); b = r(2, 6); ans = a * b }
  else if (skill === 'div') { b = r(2, 5); ans = r(2, 6); a = b * ans }
  else { a = at * 10 + ao; b = bt * 10 + bo; ans = op === '+' ? a + b : a - b }
  return { skill, op, a, b, ans, at, ao, bt, bo, key: skill + a + op + b }
}

/** Splits n ones into ten-frames: 23 → [10, 10, 3]. */
export const fill = (n: number): number[] => {
  const f: number[] = []
  while (n > 0) { f.push(Math.min(10, n)); n -= 10 }
  return f.length ? f : [0]
}

export type Slip = 'carry' | 'flip' | 'keep' | 'added' | 'other'

/** Names the likely mistake behind a wrong answer v. */
export function slip(p: Problem, v: number): Slip {
  if (p.op === '+' && p.ao + p.bo >= 10 && v === p.ans - 10) return 'carry'
  if (p.op === '−' && p.bo > p.ao) {
    if (v === (p.at - p.bt) * 10 + (p.bo - p.ao)) return 'flip'
    if (v === p.ans + 10) return 'keep'
  }
  if (p.op === '×' && v === p.a + p.b) return 'added'
  return 'other'
}
