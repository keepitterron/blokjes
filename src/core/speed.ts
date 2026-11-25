import type { Stage, TimeEntry } from './progress.ts'

export const median = (a: readonly number[]) => {
  const b = a.toSorted((x, y) => x - y), m = b.length >> 1
  return b.length % 2 ? b[m]! : (b[m - 1]! + b[m]!) / 2
}

/**
 * Today's median vs up to 15 earlier sums at the same stage (latest stage first).
 * Returns rounded seconds when today is at least 10% quicker, else null.
 */
export function quicker(entries: readonly TimeEntry[], today: string): { now: number; before: number } | null {
  const td = entries.filter(e => e.d === today)
  if (td.length < 3) return null
  for (const stg of [...new Set(td.map(e => e.s))].toReversed()) {
    const now = td.filter(e => e.s === stg), before = entries.filter(e => e.d < today && e.s === stg).slice(-15)
    if (now.length < 3 || before.length < 3) continue
    const a = median(now.map(e => e.t)), b = median(before.map(e => e.t))
    if (a < b * 0.9 && Math.round(a) < Math.round(b)) return { now: Math.round(a), before: Math.round(b) }
  }
  return null
}

/** Grown-ups timing line: last 10 vs previous 10 at the latest stage, plus daily medians (last 10 days). */
export function timeSummary(entries: readonly TimeEntry[]): { stage: Stage; last: number; n: number; prev: number | null; daily: number[] } | null {
  const latest = entries.at(-1)
  if (!latest) return null
  const same = entries.filter(e => e.s === latest.s)
  const last = same.slice(-10), prev = same.slice(-20, -10)
  const days = [...new Set(same.map(e => e.d))].slice(-10)
  return {
    stage: latest.s,
    last: Math.round(median(last.map(e => e.t))),
    n: last.length,
    prev: prev.length >= 3 ? Math.round(median(prev.map(e => e.t))) : null,
    daily: days.map(d => median(same.filter(e => e.d === d).map(e => e.t))),
  }
}

/** At least 5 earlier sums at a stage before speed is celebrated there. */
const HISTORY = 5

/** A "zoom" sum: at least a quarter quicker than her usual (median of up to 15 earlier sums at the same stage). */
export function zoom(before: readonly TimeEntry[], e: TimeEntry): boolean {
  const same = before.filter(x => x.s === e.s).slice(-15)
  return same.length >= HISTORY && e.t <= median(same.map(x => x.t)) * 0.75
}

/** A new personal best at this stage, in whole seconds (at least 1), with the best it beat. */
export function record(before: readonly TimeEntry[], e: TimeEntry): { now: number; before: number } | null {
  const same = before.filter(x => x.s === e.s)
  if (same.length < HISTORY) return null
  const best = Math.max(1, Math.round(Math.min(...same.map(x => x.t)))), now = Math.max(1, Math.round(e.t))
  return now < best ? { now, before: best } : null
}

/** Whether any stored sum set a record. */
export const hasRecord = (entries: readonly TimeEntry[]) => entries.some((e, i) => record(entries.slice(0, i), e) !== null)
