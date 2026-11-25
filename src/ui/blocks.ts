// Markup builders for the tray. Ones sit in ten-frames; tens are bars with a gap after the fifth.
import { fill } from '../core/skills.ts'
import { L } from '../store.ts'
import { ICON } from './icons.ts'

export const CUBE = '<i class="cb o"></i>', BAR = '<i class="bar"></i>'

function cubeO(act: string | undefined, bone: boolean, fi?: number, style?: string) {
  return `<i class="cb o${bone ? ' bone' : ''}"${act ? ` data-act="${act}"` : ''}${fi != null ? ` data-fi="${fi}"` : ''}${style ? ` style="${style}"` : ''}>${bone ? ICON.bone : ''}</i>`
}

export function barsHTML(n: number, o: { pop?: boolean; act?: string; ghostId?: string } = {}) {
  let h = ''
  for (let i = 0; i < n; i++) h += `<i class="bar${i === 5 ? ' g5' : ''}${o.pop && i === n - 1 ? ' pop' : ''}"${o.act ? ` data-act="${o.act}"` : ''}></i>`
  if (o.ghostId) h += `<i class="bar ghost${n === 5 ? ' g5' : ''}" id="${o.ghostId}"></i>`
  return h
}

interface FrameOpts { act?: string; tradeable?: boolean; unfold?: number | undefined; bone?: boolean; extraEmpty?: boolean; ghost?: boolean }
export function framesHTML(frames: number[], o: FrameOpts = {}) {
  let h = '', boneLeft = !!o.bone
  frames.forEach((f, fi) => {
    const full = o.tradeable && f === 10, unfold = o.unfold === fi
    h += `<div class="frame${full ? ' full' : ''}${unfold ? ' unfold' : ''}" data-fi="${fi}"${full ? ' data-act="trade"' : ''}>`
    for (let i = 0; i < 10; i++) {
      if (i < f) { h += `<span class="sl">${cubeO(o.act, boneLeft, fi, unfold ? `--i:${i};--ux:${(2 - i % 5) * 25}px;--uy:${(0.5 - Math.floor(i / 5)) * 25}px` : '')}</span>`; boneLeft = false }
      else h += '<span class="sl"></span>'
    }
    h += '</div>'
  })
  if (o.extraEmpty) h += `<div class="frame">${'<span class="sl"></span>'.repeat(10)}</div>`
  if (o.ghost) h += `<div class="frame ghost" id="gframe">${'<span class="sl"></span>'.repeat(10)}</div>`
  return h
}

/** Take-away targets for ones; #tkO marks the next one. */
export function trackFrame(n: number, taken: number) {
  if (n === 0) return ''
  let h = '<div class="frame track">'
  for (let i = 0; i < 10; i++) {
    if (i >= n) h += '<span class="sl off"></span>'
    else if (i < taken) h += `<span class="sl">${CUBE}</span>`
    else h += `<span class="sl tgt"${i === taken ? ' id="tkO"' : ''}></span>`
  }
  return h + '</div>'
}

/** Take-away targets for tens; #tkT marks the next one. */
export function trackTens(n: number, taken: number) {
  let h = ''
  for (let i = 0; i < n; i++) h += i < taken ? `<i class="bar${i === 5 ? ' g5' : ''}"></i>` : `<i class="bar ghost${i === 5 ? ' g5' : ''}"${i === taken ? ' id="tkT"' : ''}></i>`
  return h
}

/** Place-value mat laid out like a written column sum. */
export function matPV(sign: string, aT: string, aO: string, bT: string, bO: string) {
  const l = L()
  return `<div class="mat"><span></span><span class="mh t">${l.colT}</span><span class="mh o">${l.colO}</span>
    <span></span><div class="tcell" id="aT">${aT}</div><div class="ocell" id="aO">${aO}</div>
    <div class="ledge"></div>
    <span class="sign f">${sign}</span><div class="tcell" id="bT">${bT}</div><div class="ocell" id="bO">${bO}</div></div>`
}

export function rowCubes(b: number) { let h = ''; for (let i = 0; i < b; i++) h += `<i class="cb o${i === 5 ? ' g5' : ''}"></i>`; return h }

export function mulHTML(rows: number, a: number, b: number, o: { build?: boolean; labels?: boolean; pop?: boolean } = {}) {
  let h = '<div class="mmat"><div class="arr">'
  for (let i = 0; i < rows; i++) h += `<div class="arow${o.pop && i === rows - 1 ? ' pop' : ''}"><div class="acells"${o.build && i === rows - 1 ? ' data-act="delrow"' : ''}>${rowCubes(b)}</div>${o.labels ? `<span class="skip f">${(i + 1) * b}</span>` : ''}</div>`
  if (o.build && rows < a + 3) h += `<div class="arow ghost"><div class="acells" id="nextrow">${rowCubes(b)}</div></div>`
  h += '</div>'
  if (o.build) h += `<div class="ledge"></div><div class="mshelf"><span class="sign f">+</span><div class="acells rowpiece" id="rowpiece" data-act="addrow">${rowCubes(b)}</div></div>`
  return h + '</div>'
}

export function divHTML(pile: number, bowls: number[], o: { build?: boolean; pop?: boolean } = {}) {
  return `<div class="dmat"><div class="pile" id="pile"${o.build && pile ? ' data-act="deal"' : ''}>${pile ? framesHTML(fill(pile)) : ''}</div><div class="ledge"></div>
    <div class="bowls">${bowls.map((n, i) => `<div class="bowl"><div class="bin">${Array.from({ length: n }, (_, k) => `<i class="cb o sm${o.pop && k === n - 1 ? ' pop' : ''}"></i>`).join('')}${o.build && pile ? `<i class="cb o sm ph" id="bs-${i}"></i>` : ''}</div></div>`).join('')}</div></div>`
}
