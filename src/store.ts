import { repair, type Data } from './core/progress.ts'
import type { SkillId } from './core/skills.ts'
import { T } from './i18n.ts'

const KEY = 'blokjes-v1'

function load(): Data {
  let raw: unknown = null
  try { raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') } catch { raw = null }
  return repair(raw, navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en')
}

/** The one saved state, mutated in place and persisted with save(). */
export const S = load()
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* private mode or full: progress stays in memory */ }
}

export const L = () => T[S.lang]
export const skName = (id: SkillId) => L().sk[id].join(' ')
