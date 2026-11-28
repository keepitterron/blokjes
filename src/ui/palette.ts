import { S } from '../store.ts'

/** Switches the page to the saved palette and matches the browser bar to it. */
export function applyPalette() {
  document.documentElement.dataset['palette'] = S.palette
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.body).backgroundColor)
}
