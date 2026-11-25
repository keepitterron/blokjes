# Blokjes: handoff

Blokjes is a daily visual maths practice tool for Zoë. The original build was a single self-contained file, now kept at `docs/reference/blokjes.html`. It was also published as a claude.ai artifact (https://claude.ai/artifact/JXGeA2eoYkEXTX6EbMirvD), which is retired; the GitHub Pages site replaces it.

## Who it's for and what it is

Zoë is 9 and in groep 5 at a Dutch Montessori school. She is bilingual Italian/Dutch and speaks English well. She is a visual learner. Place value only clicked for her once she could see and handle blocks of cubes. She still struggles with addition and subtraction, and should be moving on to multiplication and division.

Blokjes is a learning tool, not a game. It is a short daily ritual: 8 sums, about 5 minutes, with a clear end. It has cute touches, animation and easter eggs, but no game loop, points or rewards economy. Spartacus, the family dog, is a quiet companion, not a mascot.

## Teaching principles

- **Concrete, then pictorial, then abstract.** Each skill moves through three stages: Build (she moves the blocks herself), Picture (static outlines she has to imagine moving) and Numbers (digits only, with an optional "Show me the blocks").
- **The manipulation is the method.** Moving blocks mirrors the written column method: ones first, carrying by trading a full ten-frame for a ten, borrowing by opening a ten into a ten-frame.
- **Montessori alignment.** The colour code is green for ones and blue for tens (red for hundreds is reserved). The Dutch interface uses school terms: T/E columns, *overschrijden*, *inwisselen*, *plussom*, *minsom*, *keersom*, *deelsom*.
- **Grouping cues.** Ones always sit in ten-frames (2 rows of 5). Tens are notched bars, with a visual gap after every fifth bar. Frames fade to outlines in Picture and disappear in Numbers.
- **Mistakes teach and never punish.** There are no timers on screen, no lives and no buzzers. Common slips are recognised, explained, and replayed with the blocks.
- **Interleaving.** Each session mixes in review sums from earlier skills, and those are clearly marked.

## Skills and sum generation

Skills are worked through in this order. All answers are under 100.

| id | Skill | Generation |
|---|---|---|
| `add1` | Adding without carrying | 2-digit + 2-digit, ones sum ≤ 9, tens sum ≤ 8 |
| `add2` | Adding with carrying | ones sum ≥ 10, tens sum ≤ 7 before the carry |
| `sub1` | Taking away without borrowing | 2-digit − 2-digit, subtrahend ones ≤ minuend ones |
| `sub2` | Taking away with borrowing | subtrahend ones > minuend ones; subtrahend may be 1-digit |
| `mul` | Times in rows | a × b with a in 2–5 rows, b in 2–6 per row |
| `div` | Sharing into equal groups | (d·q) ÷ d with d in 2–5, q in 2–6, always exact |

`a × b` means a rows of b, following the Dutch convention "a keer b".

## Progression rules

- **Moving up.** 3 sums right first time in a row moves a skill up one stage. At Numbers, 4 in a row masters the skill and unlocks the next one.
- **Dropping back.** 2 wrong sums in a row drops back one stage (never below Build). A sum that's right on the second try resets the streak without counting as a miss.
- **"Show me" is neutral.** Using it at Numbers neither advances nor penalises.
- **Current skill.** This is the first skill that isn't mastered. Mastering a skill mid-session switches the remaining sums to the next skill.
- **Session structure.** Each session has 8 sums. Slots 3 and 7 are reviews: first from a queue of sums she missed before (at most 12, de-duplicated), otherwise a random mastered skill. Reviews always use the Numbers stage and don't affect progression. If every skill is mastered, all 8 sums are mixed reviews.

## Interaction per operation

The tray is a wooden mat. For + and −, it is laid out like a written column sum: tens and ones columns, the first number on top, a ledge, and the second number (or a take-away target) below it.

- **Addition.** She taps a bottom one and it flies into the next free ten-frame slot on top. Each tap moves exactly one cube. A full frame glows. Tapping it gathers the ten cubes into the centre and turns them into a ten that flies to the tens column. Then she moves the bottom tens up. Hints enforce the order: ones first, and the full frame must be traded before tens can move.
- **Subtraction.** The bottom row shows dashed targets for the subtrahend. She taps top ones and they fly down into the targets. When she runs short, a ghost frame appears as a cue. Tapping a ten shakes it, flies it across, and opens it into a full frame. Then she takes the tens.
- **Times.** A highlighted row piece sits on a shelf. Each tap flies a copy up onto the next row. Skip-count labels (3, 6, 9…) appear beside the rows. Tapping the last row sends it back.
- **Sharing.** The pile sits in ten-frames above the ledge, with bowls below. Each tap deals one round, with one cube flying to each bowl.

She can type an answer at any point. The Build stage does not require her to finish building first.

## Answer entry

- **Input.** Answers go into separate tens and ones boxes, using an on-screen pad (5 digits per row, with the erase key spanning both rows), so the device keyboard never opens. Input fills ones first and then moves to tens. Tapping a box selects it. A physical keyboard also works: digits, Backspace, and Enter for Next.
- **Auto-check.** The answer is checked 280 ms after as many digits as the answer has are filled in. The known trade-off is that this reveals how many digits the answer has.
- **Right answer.** Answer-box confetti (mini cubes, bars and squares) bursts out, the blocks on the mat ripple-hop, and Spartacus wags. The session moves on automatically after about 1.9 s.
- **First wrong answer.** She gets a slip-specific message, the cells wobble, and input is blocked for 450 ms while they clear. The tray then replays the full solution using the same move functions, sped up.
- **Second wrong answer.** The answer is revealed in dashed cells, the replay runs, the sum is queued for review, and a Next button appears.

Slips that get a specific message:

- `carry`: the answer is 10 too low on a carrying sum.
- `flip`: she took the smaller ones digit from the bigger one when borrowing.
- `keep`: the answer is 10 too high after borrowing.
- `added`: she added instead of multiplying (a + b).
- `other`: anything else.

## Speed tracking (background only)

- **What's timed.** Active time is measured per sum: the gap between interactions is capped at 30 s, and time away from the app is excluded. Only sums right first time are stored, as `{s: stage, t: seconds, d: date}`, keeping the last 80 per skill.
- **What she sees.** Nothing during the session. At the end, a positive note appears only if she was quicker than before: today's median is at least 10% below the median of up to 15 earlier sums at the same stage, with at least 3 sums on each side.
- **For grown-ups.** Each skill shows the median of the last 10 sums at the current stage compared with the 10 before, plus a sparkline of daily medians.

## Screens

- **Home.** A greeting ("Ciao, Zoë"), today's practice card (Start, or "Another round" once done today), the days practised this week, the skill path with stage pips, and a link to the grown-ups view.
- **Session.** A quit button, the progress bar (with review slots outlined in purple) and Spartacus; then the skill label and stage chip; the sum and answer cells; the tray; a message line; and the pad. On a phone, everything fits on one screen. From 860 px wide, the pad moves to a right-hand column.
- **Done.** Spartacus, a summary of first-time answers, notes (stage changes, mastery, speed), and full-screen confetti for a perfect session.
- **For grown-ups.** For each skill: stage, number of sums, number right first time, most common slip, and the timing line. Two-tap "Start here" sets the level (earlier skills are marked mastered, later ones reset). There is also a two-tap reset of all progress.

## Review sums

Review sums use their own colour, purple (`--rv`). They are marked in four ways: outlined slots in the progress bar, a solid "Review" chip with a loop icon, the operator in a purple tile that bounces once, and the hint "A quick one from earlier. Look at the sign: this one is adding."

## Visual design

- **Palette.** A lavender page (`--bg #F3F0FA`), deep plum text, and tangerine for primary actions (`--go #FF8A3D`). Full light and dark themes are defined as tokens on `:root`. The tray is light wood in both themes. Other palettes (pink, unicorn, squiggles) are picked with the swatch button in the header. Squiggles is a rainbow page with black squiggles: text sits on white stickers with black outlines and hard shadows, and the blocks get black outlines and a cartoon shine while keeping their colours.
- **Type.** Fredoka for headings, numbers and the pad; Atkinson Hyperlegible for body text.
- **Tray.** Light wood with subtle grain, and a layered plywood edge made from stacked box-shadows.
- **Blocks.** Ones are glossy cubes with a top-left sheen, a darker base edge and a contact shadow. Tens are notched, side-lit bars with a depth shadow. Ten-frames have recessed hollows. Targets are dashed and gently pulsing. Bowls are ceramic with a rim. In the Picture stage, blocks are tinted outlines.
- **No emojis anywhere.** Icons are inline SVG. The favicon is an inline SVG data URI.
- **Punctuation.** Typographic apostrophes and quotes in all visible text.

## Animation

- **Flights.** A clone of the block is positioned over the page and animated with the Web Animations API: it lifts, scales up with a shadow, follows an arc with a slight tilt, and settles. On arrival, a squash-and-bounce `land` class is applied to whatever block now sits at the landing point (`landAt` uses `elementFromPoint`).
- **Trading.** The cubes gather into the centre one after another, sparkles burst, and a ten pops out and flies to the tens column.
- **Opening a ten.** The bar shakes and flies across, sparkles burst, and ten cubes spring outward into the frame.
- **Sharing.** Bowls wobble as each round lands.
- **Typing.** Each digit pops into its box.
- **Reduced motion.** With `prefers-reduced-motion`, durations go to zero and the sparkles and confetti are skipped.
- **Sound.** Small WebAudio blips for tap, pop, snap, crack, right, soft-wrong and done, with a mute toggle.

## Spartacus and easter eggs

Spartacus is drawn as an SVG: a black half-pitbull, half-labrador with hazel eyes, a white muzzle stripe, a white chest patch and white paw tips. His moods:

- **think:** head tilt while she types.
- **happy:** tail wag, tongue out and a hop.
- **gentle:** head tilt after a miss.
- **sleep:** after 45 s idle, eyes closed with floating "z"s.
- **Blinking:** periodic.

Easter eggs:

- Tapping him shows a speech bubble ("Woof!", "Bau!", "Woef!", "Wof?").
- Seven quick taps make him roll over.
- About 5% of sums show one ones cube as a bone.
- On 5 December, the ones become pepernoten.

## Data model

Everything is stored in `localStorage` under the key `blokjes-v1`, with all access wrapped in try/catch:

```
{
  lang: 'en' | 'nl',
  sound: boolean,
  skills: { [id]: { stage: 1|2|3, streak, wrongRun, mastered, seen, first, err: { [slip]: count } } },
  days: ['YYYY-MM-DD', ...],          // practised days, last 120
  missed: [{ skill, op, a, b, ans, at, ao, bt, bo, key }],   // review queue, max 12
  times: { [id]: [{ s, t, d }] }      // first-try timings, last 80 per skill
}
```

## Code map (inside the single script)

- **Strings and setup.** `T` holds strings for `en` and `nl`, including functions for parameterised text. `SK` is the ordered skill list. There are load and save helpers, `currentSkill()`, and the `SND` sound set.
- **Spartacus.** `dogSVG()`, `mood(el, mood, ms)` and `petDog()`.
- **Screens.** `renderHome()`, `renderDone()` and `renderGrown()`.
- **Session.** `startSession()` and `loadProblem()`. `gen(skill)` generates sums. `initBuild()` creates the per-sum build state `ps`, with view `build | pic | hidden | shown`.
- **Markup builders.** `matPV`, `framesHTML`, `barsHTML`, `trackFrame`, `trackTens`, `mulHTML`, `divHTML` and `staticHTML`.
- **Rendering.** `renderTray()` and `renderHint()`.
- **Moves.** `addMoveOne`, `addTrade`, `addMoveTen`, `subTakeOne`, `subOpenTen`, `subTakeTen`, `mulAddRow`, `mulDelRow` and `divDeal`. These are async, guarded against the sum changing mid-animation, and shared by taps (`handle`) and `replay()`.
- **Motion helpers.** `fly`, `landAt`, `burst`, `popConfetti` and `cheer`.
- **Answering.** `renderEq`, `renderPad`, `typeDigit` (which auto-checks), `erase`, `check`, `slip`, `grade`, `queueMissed` and `nextProblem`.
- **Timing.** `tick()` accumulates active time. `speedNotes()` and `timeLine()` turn it into the end-of-session note and the grown-ups line.

## Hosting constraints (for the published artifact)

The file must stay a single self-contained HTML file. External scripts can load only from cdnjs, jsDelivr, the Tailwind CDN or code.jquery.com, and stylesheets only from Google Fonts. Remote images and network calls are not allowed. Browser storage is per viewer and per device.

## Open items

- **Build stage.** It doesn't require building before answering, so she can skip the blocks entirely.
- **Hundreds.** There's no hundreds column yet (the red colour is reserved for it), so no 3-digit sums.
- **Persistence.** Progress lives on one device. There is no export, import or sync.
- **Slip label.** The grown-ups view shows "other slips" as a most-common slip, which reads awkwardly.
- **Classroom alignment.** The colour code and terms haven't been checked against her classroom's materials.
- **Tests.** There are no automated tests. The move functions and the progression rules (`grade`, session planning) are the obvious candidates.
- **Project setup.** Done: ported to a Vite + TypeScript PWA (see CLAUDE.md). Core rules are now tested; the move functions still mix state changes with animation and are not yet unit-tested.
