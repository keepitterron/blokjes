/** For elements that are always in the page. */
export const $ = <E extends HTMLElement = HTMLElement>(s: string) => document.querySelector<E>(s)!
/** For elements that may not be rendered right now. */
export const q = (s: string) => document.querySelector<HTMLElement>(s)
export const qa = (s: string) => [...document.querySelectorAll<HTMLElement>(s)]

export type Screen = 'home' | 'session' | 'done' | 'grown'
export const nav = { screen: 'home' as Screen }

export function show(id: Screen) {
  nav.screen = id
  for (const s of ['home', 'session', 'done', 'grown'] as const) $('#' + s).hidden = s !== id
  $('#topbar').hidden = id === 'session'
  window.scrollTo(0, 0)
}
