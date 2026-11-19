# UI checklist

Generated from `src/lib/encyclopedia.ts` by `node scripts/gen-docs.mjs`; do not edit by hand.
Why, how (with values) and sources for every rule: https://design.alorawork.com/encyclopedia

Run every UI change through this list before review. Cite a rule by its id.
Each rule is tagged *desktop*, *mobile* or *both*: a phone screen runs the mobile and both rules, a desktop screen the desktop and both rules.
**must** (77) blocks review. **should** (165) is the default unless the PR says why not. **showcase** (11) is decoration, allowed only on showcase and demo pages, never in product screens.

## Motion purpose

- [ ] **must** `motion.frequency-of-use` *both* The more often an action happens, the less it animates. Actions used dozens of times a day get no motion. Check: Grep the high-frequency components (command palette, context menu, table rows, option lists) for `transition` and `animate`: their open and highlight states are 0 ms.
- [ ] **must** `motion.no-keyboard-animation` *desktop* Keyboard-driven changes (arrow keys in lists, Tab focus, shortcuts) never animate. Check: `rg -n "data-\[highlighted\].*transition|focus-visible.*transition"`. In Playwright, press ArrowDown 10 times in 200 ms; the highlight must follow every key.
- [ ] **must** `motion.context-menu-exit-only` *desktop* Context menus and right-click menus appear instantly and may fade out briefly. Check: Open a ContextMenu in Playwright. The content must be at opacity 1 on the very next frame.
- [ ] **must** `motion.delight-budget` *both* Playful motion (confetti, bounces, easter eggs) never appears in product screens. It is allowed on showcase and demo pages, and for one-time moments such as finishing setup. Check: `rg -n "confetti|bounce:\s*0\.[3-9]"` only hits showcase or one-time onboarding code.
- [ ] **must** `motion.reduced-motion` *both* Respect `prefers-reduced-motion`. Replace movement (translate, scale, blur) with a short fade, or nothing. Check: Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`, open each overlay, and confirm `el.getAnimations()` animates no `transform`, `translate` or `scale`.
- [ ] **should** `motion.purpose` *both* Animate only to explain cause and effect, show where something came from or went, or give feedback. Check: Review each `transition`, `animate=` and `@keyframes` and ask "what does this explain?". Delete any without an answer.
- [ ] **should** `motion.no-autoplay-loops` *both* Motion that isn’t caused by the user (loops, marquees) is muted, pauses off-screen, and needs a pause control if it runs longer than 5 s. Check: `rg -n "animation-iteration-count:\s*infinite|repeat:\s*Infinity|animate-(spin|pulse|ping|bounce)"`. Every hit is a skeleton, a loader, or has a pause.

## Timing and easing

- [ ] **must** `motion.under-300ms` *both* User-triggered UI animations finish within 300 ms. The default is 220 ms with ease-out. Check: `rg -n "duration-(3[5-9][0-9]|[4-9][0-9]{2}|[0-9]{4})|duration:\s*0?\.([4-9]|3[5-9])|transition[^;]*\b([4-9][0-9]{2}|[0-9]{4})ms"`.
- [ ] **must** `motion.ease-out-default` *both* Use a strong ease-out for things that enter, and for feedback. Never use plain `ease-in` on something the user is waiting for. Check: `rg -n "ease-in\b|ease-in[^-]"` has no hits on entering or feedback animations.
- [ ] **must** `motion.no-transition-all` *both* Never write `transition: all` or Tailwind `transition-all`. List the properties. Check: `rg -n "transition-all|transition:\s*all"`.
- [ ] **should** `motion.duration-by-size` *both* Small changes are fast, bigger and farther moves take longer. Press or hover takes 120–180 ms, small state changes 180–260 ms, modals and sheets 200–300 ms. Check: Make a table of each component’s duration and compare it with these bands.
- [ ] **should** `motion.exit-faster` *both* Exits are about 20% shorter than entrances. Check: Compare the open and closed durations in each overlay component.
- [ ] **should** `motion.exit-easing` *both* Exits also use ease-out, made shorter. Use an accelerate curve only for an element that leaves the screen completely, such as a sheet sliding off. Check: Check the exit curve of each overlay in its component file.
- [ ] **should** `motion.ease-in-out-for-morphs` *both* When something moves or morphs between two on-screen states (tab pill, layout change), use ease-in-out. Check: Look at the segmented control pill and the accordion.
- [ ] **should** `motion.linear-only-for-time` *both* Use linear easing only for things that show time or progress: progress bars, spinners, marquees, scrubbing. Check: Every `rg -n "ease-linear|linear\b"` hit outside progress or loader files is a fail.
- [ ] **should** `motion.consistent-timing` *both* Similar elements share the same duration and curve tokens. Check: `rg -n "duration-\[[0-9]+ms\]" src/components` only shows values from that scale, and every curve is `ease-ad` or `var(--ad-ease)`.
- [ ] **should** `motion.fix-duration-first` *both* When motion feels slow, shorten it before you change the curve. Check: A visual check at 1× and 0.25× speed in DevTools > Animations.

## Enter, exit and origin

- [ ] **must** `motion.enter-scale` *both* Pop-ups enter from scale 0.95–0.97 with opacity 0, never from scale 0. Check: `rg -n "scale\(0\)|scale:\s*0[,; }]|scale-0\b|zoom-in-0\b|zoom-in-50"`.
- [ ] **must** `motion.origin-aware` *both* Popovers, dropdowns and tooltips grow out of the thing that opened them. Check: Every Radix content element in `src/components` sets `origin-(--radix-…-transform-origin)`.
- [ ] **must** `motion.theme-switch-no-transition` *both* Turn every transition off while the theme changes. Check: The theme setter adds and removes `.ad-theme-switch` around the change.
- [ ] **must** `motion.presence-keys` *both* Animated lists use stable ids as keys, never the array index. Check: `rg -n "key=\{(i|idx|index)\}"`.
- [ ] **should** `motion.symmetry` *both* An exit mirrors its entrance: same direction, same properties. Check: `exit` and `initial` objects in each component match.
- [ ] **should** `motion.subtle-exit` *both* Exits can travel only part of the way (about 70% of a slide) with fade and a little blur, rather than the full distance. Check: A visual check of stepper and carousel exits.
- [ ] **should** `motion.directional-steps` *both* Steppers, wizards, tabs and pages slide in the direction of travel. Forward comes from the right, back from the left. Check: Click Next and then Back in Playwright. Assert the sign of `translateX` at frame 1.
- [ ] **should** `motion.spatial-continuity` *both* A change spreads out from the control that caused it, or the shared element moves rather than being swapped. Check: A visual check of 4× slowed recordings.
- [ ] **should** `motion.object-constancy` *both* When a value changes, the same object moves or morphs. It doesn’t vanish and reappear. Check: A visual check that list reorders animate positions with `layout`, not remounts.
- [ ] **should** `motion.animate-delta-only` *both* When a number changes, animate only the digits that changed. Check: A visual check: change 1,234 to 1,235 and only the last digit should move.
- [ ] **should** `motion.icon-swap-blur` *both* When an icon swaps (copy → check, play → pause), crossfade it with scale and a little blur. Check: Icon swaps (copy → check, play → pause) animate `filter: blur` and `scale`, not only opacity.
- [ ] **should** `motion.blur-cap` *both* Keep animated blur small: 2–8 px, never above 20 px. Check: `rg -n "blur\((2[0-9]|[3-9][0-9])px\)|blur-(xl|2xl|3xl)"` on animated elements.
- [ ] **should** `motion.stagger-small` *both* List stagger is 20–40 ms per item, with the total capped at about 300 ms. Check: `rg -n "staggerChildren:\s*0?\.(0[5-9]|[1-9])"`.
- [ ] **should** `motion.choreography` *both* When many items react to one input, stagger them by distance from the input point, not all at once. Check: A visual check.
- [ ] **should** `motion.one-focal-point` *both* Only one prominent animation runs at a time. Everything else stays still. Check: A visual check of a recorded flow.
- [ ] **should** `motion.dim-behind-modal` *both* Dim and freeze the page behind a modal. Check: Dialogs and sheets render the shared `overlayClass` from dialog.tsx.
- [ ] **should** `motion.interruptible` *both* Any animation can be reversed or redirected mid-way by new input. Check: Toggle a popover open and closed within 50 ms in Playwright. There must be no stuck or jumping state.
- [ ] **should** `motion.transform-opacity-only` *both* Animate only `transform`, `opacity`, `filter` and `clip-path`. Never animate `top`, `left`, `width`, `height`, `margin` or `padding`. Check: `rg -n "transition-\[(top|left|right|bottom|width|height|margin|padding)|animate=\{\{[^}]*(top|left|width|height):"`.
- [ ] **should** `motion.height-auto` *both* To animate to `height: auto` (accordions), use `interpolate-size` where supported, or Radix’s measured CSS variable. Check: `rg -n "max-height:\s*[0-9]{3,}px"` should have no hits.
- [ ] **should** `motion.container-two-div` *both* To animate a container’s size to its content, animate an outer div to the measured size of an inner div. Check: Code review of any `useMeasure` or `ResizeObserver` component.
- [ ] **should** `motion.clip-path-reveal` *both* Prefer `clip-path: inset()` reveals over animating height or width. Check: A visual check.
- [ ] **should** `motion.view-transitions` *both* Prefer the View Transitions API for page-level morphs. Each `view-transition-name` must be unique and removed afterwards. Check: `rg -n "view-transition-name"` must not set the same name on list items.
- [ ] **should** `motion.presence-disable-exiting` *both* An element that is animating out can’t be clicked. Check: Code review of elements that animate out before unmounting.
- [ ] **should** `motion.presence-wait-halves` *both* When an exit and an enter run one after the other (swap content, wait, then show), halve each duration. Check: Sequential swaps total no more than about 220 ms.

## Springs and physics

- [ ] **must** `motion.press-scale` *both* Buttons and pressable things shrink slightly while pressed: scale 0.97 over 150 ms ease-out. Nothing else changes, colour included. Check: After `mouse.down()` on a button, its computed transform scale is between 0.96 and 0.99, and its background colour is unchanged.
- [ ] **must** `motion.one-of-n-slides` *both* Whenever exactly one option is chosen (segmented control, tabs, filter chips, a single toggle group, nav items, the current page), one shared fill moves from the old option to the new one. Two fills never blink in and out. Check: Click from the first option to the last: the `[data-sliding-pill]` element's transform passes through in-between x values over about 250 ms. Reload: it starts on the chosen option, not at x = 0. Grep pickers for a selected `bg-fill-strong`/`bg-sel` on the option itself: there should be none.
- [ ] **should** `motion.spring-for-gestures` *both* Drags, flicks and swipes settle with a spring that keeps the release velocity, not a fixed-duration tween. Check: `rg -n "onDragEnd|onPanEnd" -A6`. Look for `type: 'spring'` and `velocity`.
- [ ] **should** `motion.spring-no-wobble` *both* Springs in product UI don’t bounce. Use bounce 0–0.15, or stiffness about 500 with damping about 30–40. Check: `rg -n "bounce:\s*0?\.[2-9]|damping:\s*[0-9]\b"`.
- [ ] **should** `motion.springs-for-motion-not-colour` *both* Use springs for position and size, and plain easing for colour and opacity. Check: Code review.
- [ ] **should** `motion.momentum-dismiss` *mobile* A fast flick dismisses even when the drag distance is short. A slow drag needs to pass a threshold. Check: Playwright: fast short drag dismisses; slow short drag springs back.
- [ ] **should** `motion.rubber-band` *mobile* Dragging past an edge gets harder the farther you pull, then springs back. Check: A visual check on Drawer, Carousel and Sheet.
- [ ] **should** `motion.drag-follows-finger` *both* During a drag, the element follows the pointer 1:1 with no easing. Animate only after release. Check: Computed `transition-duration` is `0s` while dragging.
- [ ] **should** `motion.snap` *both* Continuous pickers (dials, sliders with steps, carousels) always settle on a valid value. Check: Playwright: drag and release mid-step. The final value is an integer step.
- [ ] **should** `motion.inertia` *both* A flicked scroller or dial keeps gliding and slows to a stop. Check: A visual check.
- [ ] **should** `motion.peek-before-commit` *both* For gestures with consequences, show progress during the gesture but commit only on release, so the user can reverse. Check: Playwright: drag past the threshold, drag back, release. Nothing is deleted.
- [ ] **should** `motion.no-js-for-css` *both* Choose CSS transitions first, then the Web Animations API, then a JS library. Check: Every JS animation has a reason CSS can’t cover (spring, layout, gesture, measured size).
- [ ] **showcase** `motion.squash-stretch-subtle` *both* Squash and stretch, if used at all, stays within 0.95–1.05 and only on showcase pages. Check: `rg -n "scale[XY]?:\s*\[?[^\]]*(0\.[0-8]|1\.[1-9])"`.
- [ ] **showcase** `motion.anticipation` *both* A big move on a showcase page may start with a tiny 2–4 px wind-up the other way. Check: A visual check.
- [ ] **showcase** `motion.follow-through` *both* On showcase pages, children may settle 30–60 ms after their parent stops. Check: A visual check.
- [ ] **showcase** `motion.arcs` *both* On showcase pages, long travel paths curve slightly rather than running in a straight diagonal. Check: A visual check of showcase animations.
- [ ] **showcase** `motion.motion-blur-fast-change` *both* On showcase pages, very fast value changes (number rolls, dial ticks) may add a brief 1–3 px blur. Check: A visual check.

## Interaction

- [ ] **must** `ix.tooltip-delay-once` *desktop* Delay only the first tooltip in a group. Once one is open, neighbouring tooltips open instantly with no animation. Check: `rg -n "TooltipProvider"`: one, at the root. Tooltip content animates only under `delayed-open`.
- [ ] **must** `ix.tooltip-no-interactive` *desktop* Tooltips hold only text. Anything clickable belongs in a popover. Check: `rg -n "<TooltipContent" -A8 | rg "<(a|button)"`.
- [ ] **must** `ix.no-tooltip-on-disabled` *desktop* Icon-only buttons keep their tooltip, also when disabled. Otherwise prefer saying why something is disabled in plain text. Check: Every icon-only `Button` (prop `icon`) sits inside a `Tooltip` or has visible text next to it.
- [ ] **must** `ix.hit-area` *both* The clickable area can be larger than what you see. Small controls get at least a 24 px hit area on desktop and 44 px on touch. Check: Playwright: each interactive element’s hit box (including `::after`) is at least 24×24 at a 1280 px viewport and at least 44×44 at a 390 px viewport.
- [ ] **must** `ix.label-focuses-input` *both* Clicking a label focuses or toggles its control. Check: Axe rule `label`. Playwright: clicking the label puts focus on the input.
- [ ] **must** `ix.links-are-links` *both* Navigation uses `<a>` or `<Link>`, never `onClick` on a div or button. Check: `rg -n "onClick=\{\(\) => (router\.push|navigate)\("`.
- [ ] **must** `ix.safe-triangle` *desktop* Nested menus keep a safe area between the parent item and the submenu, so a diagonal move doesn’t close the submenu. Check: Playwright: hover the parent, then move diagonally through a sibling to the submenu. The submenu stays open.
- [ ] **must** `ix.hover-and-click` *desktop* Every hover-opened menu also opens on click, tap and keyboard. Check: Playwright on mobile emulation: tap opens the menu.
- [ ] **must** `ix.no-double-submit` *both* Once submitted, a button ignores further clicks until the request ends. Keep the label and show progress. Check: Playwright: double-click Save and count the network requests (must be 1).
- [ ] **must** `ix.human-in-the-loop` *both* AI and automation may suggest anything, but they ask before changing user data. Check: Code review: no AI-triggered mutation without a confirm step.
- [ ] **must** `ix.drag-alternatives` *both* Every drag, swipe or pinch also has a click or keyboard way to do it. Check: Code review per gesture.
- [ ] **should** `ix.fitts-placement` *both* Put frequent targets large and close to where the pointer or thumb already is. Screen edges and corners are effectively infinite targets. Check: A visual check.
- [ ] **should** `ix.no-dead-zones` *both* If part of a control looks clickable, all of it is. Lists have no dead gaps between items. Use padding, not margins. Check: Playwright: click at the midpoint between two adjacent list items. It must hit one of them.
- [ ] **should** `ix.url-state` *both* Filters, tabs, pagination, sort and open panels live in the URL. Check: Playwright: change a filter, reload, and the filter is still applied.
- [ ] **should** `ix.scroll-restore` *both* Back and Forward restore scroll position, and anchored headings stop below a sticky header. Check: Playwright: scroll, open a detail, go back, compare `scrollY`.
- [ ] **should** `ix.dropdown-on-pointerdown` *both* Menus open on pointer down, not on click. Check: `rg -n "DropdownMenuTrigger[^>]*onClick"`.
- [ ] **should** `ix.toggle-immediate` *both* Switches take effect immediately with no confirm step. Destructive actions confirm or offer undo. Check: Code review of Switch handlers (no `confirm()`).
- [ ] **should** `ix.no-select-on-controls` *both* Text inside buttons, tabs and draggable handles isn’t selectable. Decorative layers don’t catch pointer events. Check: `rg -n "<button" | rg -v "select-none"` (review the hits). Every absolutely positioned decorative element has `pointer-events-none`.
- [ ] **should** `ix.list-keyboard` *desktop* Focusable lists move with ↑ and ↓, Home and End, and Enter to open. Typing jumps to matches. Check: Playwright keyboard walk.
- [ ] **should** `ix.shortcuts-shown` *desktop* Show shortcuts with platform symbols (⌘ on Mac, Ctrl elsewhere) and keep them working on non-QWERTY layouts. Check: Code review.
- [ ] **should** `ix.optimistic` *both* Show the result of an action immediately and sync in the background. Roll back with a message if it fails. Check: Playwright with throttled network: the UI updates before the response.
- [ ] **should** `ix.recognition-over-recall` *both* Offer choices to pick from (recent items, suggested prompts, defaults) rather than an empty box. Check: A visual check of empty inputs.
- [ ] **should** `ix.brushing-linking` *desktop* Hovering an item highlights related items elsewhere (a chart bar and its table row, a citation and its source). Check: A visual check.
- [ ] **should** `ix.summary-filters` *both* Clicking a summary row or chart bar filters the list below it. Check: A visual check.
- [ ] **should** `ix.natural-mapping` *both* Control direction matches the effect: drag up for more, right for forward, clockwise to increase. Check: A visual check.
- [ ] **should** `ix.map-range` *both* A continuous control’s range maps proportionally onto its effect. Check: A visual check.
- [ ] **should** `ix.respond-under-100ms` *both* Every input gets some visible response within 100 ms (press state, highlight, optimistic change). Check: Playwright `performance.now()` from click to the first DOM change, under 100 ms. INP under 200 ms.

## Typography

- [ ] **must** `type.tabular-nums` *both* Numbers that change, or that line up in columns (tables, totals, timers, prices), use tabular figures. Check: Playwright: `getComputedStyle(td).fontVariantNumeric` includes `tabular-nums` for every numeric cell (`[data-numeric]`).
- [ ] **must** `type.numbers-right-aligned` *both* Numeric table columns are right-aligned, headers included. Check: Computed `text-align` on numeric `th` and `td` is `right` or `end`.
- [ ] **must** `type.no-weight-shift` *both* Selected or hovered text never changes width. If you bold a tab label, reserve the bold width. Check: Playwright: measure the tab width before and after selection. The delta is 0.
- [ ] **must** `type.min-weight-400` *both* No font weight below 400 for UI text. Headings are 500–600. Check: `rg -n "font-(thin|extralight|light)|font-weight:\s*[1-3]00"`.
- [ ] **must** `type.curly-quotes` *both* Use real curly quotes and apostrophes (“ ” ‘ ’) and the single ellipsis character (…). Check: `rg -n "[A-Za-z]'[A-Za-z]|\"[A-Z][^\"]{2,}\"|\.\.\." --glob "*.{tsx,json}"`, restricted to user-facing strings.
- [ ] **must** `type.few-faces` *both* One typeface: the system sans stack, with tabular figures and a plain 1 (no foot serif). Mono only for code. Build hierarchy with size, weight and colour. Check: `rg -n "font-family|font-serif" src` only references the token or code blocks.
- [ ] **must** `type.icon-stroke-matches-text` *both* Icons are Feather at 16 px beside 13–14 px text, 1.75 stroke with round caps, in the same colour as the text, with no container behind them. Check: No icon sits in a filled circle or square, and icon sizes are 16 px beside body text.
- [ ] **should** `type.text-wrap` *both* Headings use `text-wrap: balance`. Paragraphs use `text-wrap: pretty`. Check: `rg -n "<h[1-3]" | rg -v "text-balance"` (review the hits).
- [ ] **should** `type.measure` *both* Body text lines are at most about 65 characters wide. Check: Computed width ÷ `ch` ≤ 75 on prose blocks.
- [ ] **should** `type.antialiased` *both* Turn on grayscale antialiasing at the root. Check: Computed `-webkit-font-smoothing` on body is `antialiased`.
- [ ] **should** `type.text-size-adjust` *both* Stop iOS from inflating text in landscape. Check: Grep the base CSS.
- [ ] **should** `type.underline-offset` *both* Link underlines clear the descenders. Check: Computed `text-underline-offset` is not `auto` on `a`.
- [ ] **should** `type.underline-for-links-only` *both* Underline only links. Use weight for emphasis, and italics only for citations. Check: `rg -n "underline" | rg -v "<a|Link"`.
- [ ] **should** `type.text-box-trim` *both* Trim the extra space above caps and below the baseline on labels and buttons, so text is optically centred. Check: A visual check: a button label’s cap height is centred within ±0.5 px.
- [ ] **should** `type.sup-no-leading` *both* Superscripts and subscripts don’t push lines apart. Check: Grep the base CSS.
- [ ] **should** `type.small-caps-acronyms` *both* Write long acronyms in running text with real small caps, not all caps. Check: A visual check.
- [ ] **should** `type.uppercase-tracking` *both* Uppercase or small-caps labels get extra letter spacing of 0.04–0.08 em. Check: `rg -n "uppercase" | rg -v "tracking"`.
- [ ] **should** `type.ellipsis-labels` *both* Menu items that open a further step end with "…" ("Rename…"), and so do in-progress labels ("Saving…"). Check: `rg -n "(Rename|Export|Delete|Saving|Loading)\.\.\."` (should use `…`).
- [ ] **should** `type.nbsp` *both* Use non-breaking spaces between numbers and units, and inside shortcuts and brand names. Check: `rg -n "[0-9] (MB|GB|KB|ms|px|%)"` in copy.
- [ ] **should** `type.truncate-middle-filenames` *both* File names truncate in the middle so the extension stays visible. Check: A visual check with a 60-character file name.
- [ ] **should** `type.line-clamp` *both* Card titles and descriptions cap at 1–2 lines with a clean ellipsis. Check: Render with 200-character titles and check card height doesn’t grow.
- [ ] **should** `type.hyphens-narrow` *both* Narrow text columns hyphenate. `lang` must be set on `<html>`. Check: `rg -n "<html" | rg "lang="`.
- [ ] **should** `type.no-font-synthesis` *both* Don’t let the browser fake bold or italic. Check: Grep the base CSS.
- [ ] **should** `type.font-loading` *both* A loaded webfont (showcase pages only; app screens use the system stack) must not hide text or shift layout. Check: Lighthouse: no CLS from fonts.
- [ ] **should** `type.disambiguation` *both* In data-heavy UIs, make I, l and 1, and 0 and O, distinguishable where the font allows it. Check: A visual check of "Il1 O0" in the UI font.
- [ ] **should** `type.hierarchy-weight-colour` *both* Show hierarchy with weight and colour (primary, secondary grey) before size. Check: A visual check.
- [ ] **showcase** `type.fluid-headlines` *both* Showcase headlines may scale smoothly with `clamp()`. App screens use the fixed type scale. Check: `rg -n "text-[0-9]xl md:text-[0-9]xl lg:text"` on display headings.
- [ ] **showcase** `type.ai-looking-fonts` *both* Brand and showcase display type avoids the faces most often defaulted to by AI builders. App screens keep the system stack. Check: Showcase font config doesn’t land on one of those by default.

## Colour

- [ ] **must** `color.shade-scale` *both* Greys come from one fixed ramp of six per theme: page, surface, fill, fill-strong, ink-muted, ink. Never add another grey. Check: `node scripts/greys.mjs --check` passes.
- [ ] **must** `color.tinted-neutrals` *both* Greys are neutral by default (chroma 0). A product may tint them deliberately through the Greys setting. Check: Default tokens have chroma 0.
- [ ] **must** `color.single-accent` *both* One accent, used only on primary and key action buttons. Active nav, charts and numbers stay neutral, and nothing changes colour when clicked. Check: Count `bg-brand|text-brand` per screen: one primary action, plus the one attention pill if present.
- [ ] **must** `color.state-contrast` *both* Hover, active and selected states differ clearly from rest, in both themes. Never white on light grey. Check: Playwright: compare the computed background of rest, hover and selected states. ΔL in OKLCH ≥ 0.04 between each.
- [ ] **must** `color.not-colour-alone` *both* Status is never colour alone: a small dot plus text, or an icon. A soft coloured pill only for the one status that needs attention. Check: Axe and a visual check. Every coloured badge has text.
- [ ] **must** `color.contrast-min` *both* Text contrast is at least 4.5:1, large text and UI parts at least 3:1. Prefer APCA Lc 60+ for body text. Check: Axe `color-contrast` in Playwright, both themes.
- [ ] **should** `color.oklch-palette` *both* Build palettes in OKLCH. Keep hue and chroma and step lightness. Check: `rg -n "hsl\(|#[0-9a-fA-F]{6}" src/styles/tokens.css` (tokens should be oklch).
- [ ] **should** `color.gradient-oklch` *both* Interpolate gradients in OKLCH or OKLab. Check: `rg -n "linear-gradient\((?!.*in ok)"`.
- [ ] **should** `color.accent-by-contrast` *both* When choosing a product’s accent, contrast it with the page temperature: a warm page takes a cool accent, a cool page a warm one. Where it goes still follows the one-accent rule. Check: Compare the hues in tokens.
- [ ] **should** `color.lower-chroma` *both* If a colour looks garish, lower its chroma before you change its hue. Check: A visual check.
- [ ] **should** `color.no-grey-on-colour` *both* On a coloured background, secondary text is a tint of that colour, not grey. Check: A visual check.
- [ ] **should** `color.hue-consistent-tints` *both* On a tinted background, tint the borders, shadows and muted text toward the same hue. Check: A visual check.
- [ ] **should** `color.chart-palette` *both* Chart series are colour-blind safe, and in a mono-accent system they are shades of one hue plus neutrals. Check: Run series colours through a colour-blindness simulator.
- [ ] **should** `color.color-scheme` *both* Declare the theme to the browser. Check: Computed `color-scheme` on html. A `theme-color` meta exists.
- [ ] **should** `color.selection` *both* Style `::selection` to the brand, and unset it on gradient text. Check: Grep the base CSS.
- [ ] **should** `color.multiply-product-shots` *both* Product photos on white backgrounds use `mix-blend-mode: multiply` on light surfaces, so the white box disappears. Check: A visual check in both themes.
- [ ] **showcase** `color.film-grain` *both* On showcase pages, big gradients get a faint 2–4% noise layer to stop banding. Check: A visual check for banding at 100% zoom. This is for marketing or showcase only.

## Layout

- [ ] **must** `layout.concentric-radius` *both* Nested corners are concentric: the inner radius equals the outer radius minus the padding between them. Check: For each rounded child inset by p, child radius ≈ parent radius − p (±1 px).
- [ ] **must** `layout.radius-tokens` *both* Radius comes from a few tokens, and siblings of one kind (all buttons in a view) share one radius. Check: `rg -n "rounded-\[|border-radius:\s*[0-9]" src/components` finds no literal radii.
- [ ] **must** `layout.spacing-scale` *both* Spacing comes from one scale (4 px base). No arbitrary values. Check: `rg -n "(p|m|gap)-\[[0-9]+px\]" src/components` (review each hit).
- [ ] **must** `layout.alpha-borders` *both* No borders, outlines, rings or dividing lines: not between rows, list items, stats, columns or sections, and not on selected or open states. Separate with space, soft fills and shadows. Check: `./scripts/shots` flags visible borders; `rg -n "border-|divide-|ring-|outline-" src/components` (review each hit).
- [ ] **must** `layout.align-everything` *both* Every element aligns to a grid, a baseline, an edge or an optical centre. Controls in one toolbar share one height and one centre line. Check: Playwright: in each toolbar, every child’s `getBoundingClientRect` centre-y is equal within ±0.5 px.
- [ ] **must** `layout.no-layout-shift` *both* Nothing jumps while loading or updating. Reserve space for images, async content and late fonts. Check: Playwright: collect the `layout-shift` PerformanceObserver during load and filter changes. CLS < 0.01.
- [ ] **must** `layout.dvh` *mobile* Full-height sections use `dvh`, not `vh`. Check: `rg -n "100vh|h-screen\b|min-h-screen\b"`.
- [ ] **must** `layout.scrollbars` *desktop* Show only useful scrollbars, style them once, and never put content under one. Check: No horizontal scroll on the page at 360–1440 px (`scrollWidth > clientWidth` on html is a fail).
- [ ] **should** `layout.proximity` *both* Related items sit closer together than unrelated ones. The gap inside a group is smaller than the gap between groups. Check: A visual check: intra-group gap < inter-group gap.
- [ ] **should** `layout.fewer-containers` *both* Avoid a box inside a box inside a box. Let content run edge to edge and float controls on top. Check: Count nested bordered or shadowed ancestors per element. More than 2 is a fail.
- [ ] **should** `layout.layered-shadows` *both* Shadows are layered (2–4 layers, growing blur, falling opacity) from one light source above. Check: `rg -n "shadow-\[0_[0-9]+px_[0-9]+px_rgba?\(0,0,0,0\.[2-9]"` (single heavy shadow).
- [ ] **should** `layout.elevation-scale` *both* Higher elements get bigger offset and blur with lower opacity, on a fixed scale (card, popover, modal). Check: A token review.
- [ ] **should** `layout.no-pure-black-shadow` *both* Shadows use low-alpha neutral or hue-matched colours, never solid black at high alpha. Check: `rg -n "rgba\(0,\s*0,\s*0,\s*0\.[3-9]"` in shadows.
- [ ] **should** `layout.dark-elevation` *both* In dark mode, depth comes from lighter surfaces, not shadows or edges. Check: Computed background L rises with z-level in dark mode.
- [ ] **should** `layout.animate-shadow-cheaply` *both* To animate a shadow (hover lift), fade a pseudo-element that holds the bigger shadow. Check: `rg -n "transition-shadow|transition:[^;]*box-shadow"` on large lists.
- [ ] **should** `layout.optical-alignment` *both* Align by eye where geometry looks wrong. Icon-side padding on a button is slightly smaller, and play icons shift right. Check: A visual check at 400% zoom.
- [ ] **should** `layout.safe-areas` *mobile* Respect notches and home indicators. Check: `rg -n "safe-area-inset"` in fixed bars. At 390 × 844 in the phone frame nothing sits under the status bar or the home indicator.
- [ ] **should** `layout.intrinsic-sizing` *both* Let CSS size things (flex, grid, `fit-content`) rather than measuring in JS. Check: `rg -n "getBoundingClientRect|offsetWidth"` in layout code needs a reason.
- [ ] **should** `layout.size-to-content` *both* Triggers, stat cards and table columns are as wide as their content needs, not stretched. Check: A visual check.
- [ ] **should** `layout.edge-fade` *both* Horizontal scrollers fade at their edges instead of hard-cutting. Check: A visual check.
- [ ] **should** `layout.radial-not-blurred-rects` *both* Make glows with radial gradients, not blurred or scaled rectangles. Check: `rg -n "blur-3xl|blur\(100px\)"`.
- [ ] **should** `layout.materiality` *both* Textures and materials (glass, refraction, grain) must have a reason. Check: Every `backdrop-blur` sits on a floating layer.
- [ ] **should** `layout.responsive-coverage` *both* Check every screen at phone (390 px), laptop (1280 px) and ultra-wide (zoom out to 50%). Check: Screenshots at each width.

## Forms

- [ ] **must** `form.labels` *both* Every control has a label (visible, or at least an accessible name). Check: Axe `label`.
- [ ] **must** `form.enter-submits` *both* Wrap fields in a `<form>`, so Enter submits single-line inputs. In a textarea, ⌘/Ctrl+Enter submits. Check: Playwright: press Enter in the last field and confirm a submit request.
- [ ] **must** `form.no-paste-block` *both* Never block paste. Never block typing invalid characters: accept, then validate. Check: `rg -n "onPaste"`.
- [ ] **must** `form.placeholders` *both* No helper text under fields. A placeholder may show an example or format, never the label. Check: No placeholder equals its label, and no `<p>` sits under a field except an error.
- [ ] **should** `form.input-types` *both* Use the right `type`, `inputmode`, `autocomplete` and `enterkeyhint`. Check: `rg -n "name=\"(email|phone|otp|code)\""` and confirm the matching type or inputmode.
- [ ] **should** `form.spellcheck-off` *both* Spellcheck off for emails, codes, usernames, SKUs and search. Correct `autocomplete` tokens on personal and sign-in fields; `autocomplete="off"` only on search and non-sign-in fields. Check: Grep code and email inputs.
- [ ] **should** `form.postel` *both* Accept messy input and normalise it (spaces in phone numbers, "12.400.000" or "12400000", trailing spaces from IME). Check: Unit tests with messy samples.
- [ ] **should** `form.reward-early-punish-late` *both* Show positive progress as soon as the user types. Show errors only after they leave the field or submit, then re-check live while they fix it. Check: Playwright: type one character in an email field. No error is shown until blur.
- [ ] **should** `form.inline-validation` *both* Validate in place, next to the field. On submit, focus the first invalid field. Check: Playwright: submit an empty form and confirm `document.activeElement` is the first invalid field.
- [ ] **should** `form.dont-pre-disable` *both* Keep Submit enabled until it’s pressed, so pressing it reveals what’s missing. Check: `rg -n "disabled=\{!isValid"`.
- [ ] **should** `form.error-shake` *both* A wrong code or password may shake the field sideways along with the error. Sign-in and code entry only. Check: Only sign-in or code inputs shake, and not under reduced motion.
- [ ] **should** `form.chunking` *both* Long codes and numbers display in readable groups. Check: A visual check.
- [ ] **should** `form.prefix-icons-inside` *both* Icons and prefixes (search glass, "Rp") sit inside the input with padding, and clicking them focuses the input. Check: Playwright: clicking the icon focuses the input.
- [ ] **should** `form.edit-in-place` *both* An editable cell edits where it stands: the editing box is the resting box, so the text, the right edge and the row don’t move. Units stay fixed beside the value and number grouping survives typing. Enter or leaving the cell saves, Tab saves and edits the next cell, Esc reverts. Check: Playwright: screenshot the cell, click it, hide the caret and screenshot again. The text pixels are identical and no other cell in the row moved.
- [ ] **should** `form.unsaved-changes` *both* Warn before leaving with unsaved changes. Make the dirty state visible on long forms. Check: Playwright: edit a field, navigate away, and expect a dialog.
- [ ] **should** `form.autofocus-desktop-only` *desktop* Autofocus the single main input on desktop only (search, command, a one-field dialog). Check: `rg -n "autoFocus"`.
- [ ] **should** `form.reserved-names` *both* Non-auth fields avoid names like "password", so password managers stay out. Check: `rg -n "name=\"password\""` outside auth.
- [ ] **should** `form.closure-strength` *both* Show strength or progress as a shape that completes, rather than a "weak/strong" label. Check: A visual check.
- [ ] **should** `form.continuity-monospace` *both* When characters reveal or morph (masked password to plain text), keep their positions stable with a monospaced or tabular face. Check: A visual check.

## Mobile and touch

- [ ] **must** `mobile.input-16px` *mobile* Inputs, selects and textareas are at least 16 px on phones. Check: Playwright at a 390 px viewport: every `input, select, textarea` has computed `font-size` ≥ 16 px.
- [ ] **must** `mobile.never-disable-zoom` *mobile* Never disable pinch zoom. No `maximum-scale=1` or `user-scalable=no`. Check: `rg -n "maximum-scale|user-scalable"`.
- [ ] **must** `mobile.hover-media` *mobile* Hover styles apply only on devices that hover. Check: `rg -n ":hover" --glob "*.css"` hits outside `@media (hover: hover)`.
- [ ] **must** `mobile.overscroll-contain` *mobile* Sheets, modals, popovers and side panes contain their scroll. Check: Computed `overscroll-behavior` on `[role=dialog] [data-scroll]` is `contain`.
- [ ] **must** `mobile.no-autofocus` *mobile* Never autofocus a field on a touch device. Check: `rg -n "autoFocus"`: each use is gated on the pointer type.
- [ ] **must** `mobile.touch-targets` *mobile* Everything you can tap on a phone is at least 44 × 44 px, and a row is one target from edge to edge. Check: Smoke at 390 px: every button, link, input and option inside the phone frame has an offset box of at least 44 × 44 (a switch counts its row).
- [ ] **must** `mobile.no-hover-only` *mobile* On a phone, nothing is reachable only by hovering: no hover-only buttons, tooltips or reveals. Press feedback replaces hover feedback. Check: `rg -n "hover:" src/components/mobile` shows only `[@media(hover:hover)]:hover:` forms; each `group-hover` reveal has a tap path.
- [ ] **must** `mobile.gesture-alternative` *mobile* Swipe, pull, drag-to-dismiss and long-press are shortcuts. The same action is also a visible control. Check: For each SwipeRow, PullToRefresh and MobileSheet, find the matching button. A Playwright run that never drags can still reach every action.
- [ ] **must** `mobile.keyboard-avoidance` *mobile* Bars and sheets ride on top of the on-screen keyboard, and the focused field stays visible. Check: Phone frame with the keyboard drawn (`?keyboard=1` on /mobile/mobile-action-bar): the action bar sits above it.
- [ ] **should** `mobile.tap-highlight` *mobile* Remove the grey tap flash and give every control its own `:active` state instead. Check: Grep the base CSS. Every button has an `active:` class.
- [ ] **should** `mobile.touch-action` *mobile* Controls use `touch-action: manipulation`. Custom pan or zoom surfaces use `touch-action: none`. Check: Computed `touch-action` on buttons.
- [ ] **should** `mobile.scroll-snap` *mobile* Swipeable carousels snap to cards. Check: Grep carousel components.
- [ ] **should** `mobile.video-inline` *mobile* Autoplay video needs `muted` and `playsinline`. Pause it off-screen. Check: `rg -n "<video" | rg -v "playsInline"`.
- [ ] **should** `mobile.touch-visibility` *mobile* When a finger covers the content being adjusted, show a magnified value above it. Check: A visual check.
- [ ] **should** `mobile.thumb-zone` *mobile* The primary action and tabs sit within thumb reach at the bottom of the screen. Check: A visual check at 390 × 844.
- [ ] **should** `mobile.sheet-detents` *mobile* A bottom sheet rests at set heights (half, full, or its content). A drag picks the detent it is heading for by position and speed; a flick down or a drag past the smallest closes it. Check: Drag the handle up from half: it settles at full; flick down: it closes; the footer button is visible at both detents.
- [ ] **should** `mobile.motion-feedback` *mobile* Without haptics, motion carries the feel: a press dips, a release springs back, a choice slides, a drop snaps. Check: Press and hold a tab and a row at 390 px: each shows its press state at once.
- [ ] **should** `mobile.one-main-action` *mobile* A phone screen's main action is a full-width button in a bar pinned at the bottom, above the home indicator and the keyboard, not a floating round button. Check: No `Fab` in new phone screens; each screen has at most one accent button.
- [ ] **should** `mobile.tab-bar` *mobile* The tab bar holds three to five top-level destinations, each a real screen, with icon and label; it floats above the home indicator and hides on pushed detail screens. Check: Tap every tab in the example app: each opens its own screen.
- [ ] **should** `mobile.push-pages` *mobile* On a phone, details open as a full screen that slides in from the right, with a back button naming where it goes. Check: Open an order in /mobile/app: it slides in from the right; Back slides it out.

## Feedback and states

- [ ] **must** `state.skeleton-matches` *both* Loading is a pulsing skeleton that matches the final layout exactly. Never a spinner. Check: Playwright: screenshot the skeleton and the loaded state and diff the element rects. Each matching box is within ±1 px.
- [ ] **must** `state.loading-delay` *both* Every load, filter changes included, shows its skeleton first. Loads stay under 0.5 s. Check: Change a filter on an example page: the list shows its skeleton, then the result, with no shift.
- [ ] **must** `state.loading-button` *both* A busy button keeps its width and changes its label ("Saving…"). No spinner. Check: The button width is unchanged between idle and pending.
- [ ] **must** `state.toasts` *both* Toasts are short, sit at the far right, leave the way they came, pause on hover and in a hidden tab, and never cover action buttons. Check: Playwright: show a toast on each page with bottom-right actions. The toast rect doesn’t intersect any visible button.
- [ ] **must** `state.empty-states` *both* An empty state is one large line icon and a short title. No sentence, button or illustration. A section without data shows one plain line and hides controls that can’t act on nothing. Check: Render each list with `[]`: one icon and a title, nothing else.
- [ ] **must** `state.no-dead-ends` *both* Every screen, including errors, offers a next step. Check: A visual check of the 404, 500 and empty-permission screens.
- [ ] **should** `state.design-all-states` *both* Design every state: loading, empty, one item, many, very long content, error, offline, no permission. Check: Each data component has stories named `Loading`, `Empty`, `Error` and `Long`.
- [ ] **should** `state.response-limits` *both* Under 0.1 s needs no indicator. From 1 s, show that work is happening. Over 10 s, show percent done and a way to cancel. Check: Code review of long-running actions.
- [ ] **should** `state.labour-illusion` *both* For slow or high-stakes work, show the steps as they happen. Check: A visual check.
- [ ] **should** `state.feedback-near-trigger` *both* Confirm small actions where they happened (copy shows a check on the button) rather than in a distant toast. Check: A visual check.
- [ ] **should** `state.undo-over-confirm` *both* Prefer undo for reversible destructive actions. Confirm only the truly irreversible ones. Check: Code review.
- [ ] **should** `state.error-messages` *both* An error says what happened and how to fix it, in plain words, next to the problem. Check: `rg -n "(Something went wrong|Error occurred|Invalid input)"`.
- [ ] **should** `state.hover-cues` *desktop* Interactive things show a hover change before they’re pressed. Check: Playwright: hover each `button` and `[role=button]`. The computed background or transform changes.
- [ ] **should** `state.hover-children-sync` *desktop* A row’s background and its child elements change at the same instant on hover. Check: A visual check at 0.25× speed.
- [ ] **should** `state.peak-end` *both* End flows with a clear success state. The last screen is what people remember. Check: A visual check of the last step of each flow.
- [ ] **should** `state.goal-gradient` *both* Show progress in multi-step tasks. Start it slightly advanced if you can do so honestly. Check: A visual check.
- [ ] **should** `state.zeigarnik` *both* Show unfinished items (setup checklist, drafts) so people come back to them. Check: A visual check.
- [ ] **showcase** `state.multimodal` *both* Sound and haptics are off in product screens. On showcase pages they may reinforce an event, always with a visual change and a way to turn them off. Check: Every `play()` call is behind a settings flag and has a visual counterpart.

## Data display

- [ ] **must** `data.locale-formats` *both* Dates, numbers and currency follow the locale. Check: `rg -n "toFixed\(|toLocaleString\(\)"` without a locale.
- [ ] **must** `data.progressive-disclosure` *both* Disclose technical detail only: ids, hosts and logs go behind one quiet "Details" disclosure or are dropped. Never hide a data table or the main facts. Check: No table or facts section sits inside a closed Collapsible or Accordion.
- [ ] **should** `data.labels-last-resort` *both* Skip the "Label: value" pattern when the format or context already explains the value. Combine label and value into a phrase when that’s clearer ("12 left"). Check: A visual check.
- [ ] **should** `data.labels-secondary` *both* When labels are needed, they are quieter than values: smaller, lighter or muted colour, never bolder. Check: A visual check.
- [ ] **should** `data.chunk-groups` *both* Break long sets into groups of about 5–9: grouped settings, digit groups, sectioned menus. Check: Menus with more than 9 ungrouped items get flagged.
- [ ] **should** `data.currency-decimals` *both* Within one context, show currency with either 0 or 2 decimals, not a mix. Check: Unit test.
- [ ] **should** `data.virtualize` *both* Long lists are paginated (50 per page in tables) or virtualised. Check: Count DOM rows with 1,000 items.
- [ ] **should** `data.handle-long-content` *both* Layouts survive short, average and very long values (names, SKUs, numbers in the billions). Check: A fixture with 120-character strings and 13-digit numbers.
- [ ] **should** `data.missing-values` *both* Missing values show a consistent placeholder ("—"), never blank or "null". Check: `rg -n "\?\? ''|\|\| ''"` in cells.
- [ ] **should** `data.translate-no` *both* Brand names, product names, codes and IDs carry `translate="no"`. Check: Grep SKU and brand cells.

## Accessibility

- [ ] **must** `a11y.keyboard-all` *both* Everything works by keyboard, following the WAI-ARIA patterns. Check: `rg -n "<div[^>]*onClick"`. Run a Playwright Tab walk.
- [ ] **must** `a11y.focus-visible` *both* Keyboard focus is always visible as a fill change, the same token as hover. Never a ring, outline or border-colour change. Check: Tab through a page: each focused control’s background differs from rest, and no outline, ring or border appears.
- [ ] **must** `a11y.focus-management` *both* Dialogs trap focus and return it to the trigger on close. Check: Playwright: open, Escape, and confirm `activeElement === trigger`.
- [ ] **must** `a11y.icon-button-names` *both* Icon-only buttons have an `aria-label`. Decorative icons are `aria-hidden`. Check: Axe `button-name`.
- [ ] **must** `a11y.img-alt` *both* Meaningful images have alt text, decorative ones `alt=""`. Illustrations built from HTML get `role="img"` and `aria-label`. Check: Axe `image-alt`.
- [ ] **must** `a11y.select-colours` *both* Dropdowns, popovers, tooltips, dialogs and date or time pickers are always our own components, never the browser’s. Check: `rg -n "<select|title=|type=\"date|alert\(|confirm\(" src` has no hits on user-facing UI.
- [ ] **should** `a11y.semantic-first` *both* Use native elements (`button`, `a`, `label`, `table`, `h1`–`h6`) before ARIA. Check: Axe and code review.
- [ ] **should** `a11y.live-regions` *both* Toasts, inline validation and async status use polite live regions. Check: Inspect the DOM.
- [ ] **should** `a11y.skip-link` *both* Pages have a "Skip to content" link and a logical heading order. Check: Tab once on load.
- [ ] **should** `a11y.page-title` *both* `<title>` reflects the current view. Check: Playwright reads `document.title` per route.
- [ ] **should** `a11y.svg-favicon-scheme` *both* The favicon is an SVG that adapts to light and dark. Check: Inspect the file.

## Performance

- [ ] **should** `perf.mutations-fast` *both* POST, PATCH and DELETE complete in under 500 ms. Pages show their skeleton immediately and load in under 0.5 s. Check: Playwright network timings.
- [ ] **should** `perf.refs-for-realtime` *both* High-frequency values (drag position, scroll progress, timers) update the DOM through refs, not React state. Check: `rg -n "setState\(.*(clientX|scrollY|pageX)"`.
- [ ] **should** `perf.will-change-sparingly` *both* Use `will-change` and `translateZ(0)` only to fix measured jank, and only while it’s animating. Check: `rg -n "will-change"`. Each needs a comment.
- [ ] **should** `perf.pause-offscreen` *both* Pause looping animations and videos that are off-screen. Check: Code review.
- [ ] **should** `perf.images` *both* Images have explicit sizes. Preload images above the fold and lazy-load the rest. Check: Lighthouse.
- [ ] **should** `perf.prefetch-intent` *both* Prefetch likely next routes on intent (hover, focus, or pointer heading towards a link), not everything in view. Check: Code review.
- [ ] **should** `perf.low-power-test` *both* Test on iOS Low Power Mode, Safari, and a throttled CPU. Check: Record a profile.

## UX laws

- [ ] **must** `law.hick` *both* Fewer, clearer choices at a time, without cutting features: one primary action visible, the rest grouped in one menu. Check: Count primary buttons per view: one at most.
- [ ] **must** `law.similarity` *both* Things that work the same look the same, and things that differ look different. Check: `rg -n "<button className="` (raw buttons outside the library).
- [ ] **must** `law.uniform-connectedness` *both* Show that things belong together with a shared fill or card, never with connecting lines or frames. Check: A visual check: no connector lines or frames used for grouping.
- [ ] **must** `law.cognitive-load` *both* Remove anything that doesn’t help the task: duplicate text, decoration, unneeded choices. Check: A visual check.
- [ ] **should** `law.jakob` *both* Use the patterns people already know (table sort on header click, ⌘K, Esc closes, a logo that goes home). Check: A visual check.
- [ ] **should** `law.tesler` *both* Move complexity into the system, not onto the user (smart defaults, auto-detect, inference). Check: A visual check.
- [ ] **should** `law.pareto` *both* Put the polish and prominence on the features used most, without cutting the rest. Check: N/a.
- [ ] **should** `law.serial-position` *both* Put the most important items first or last in lists and navigation. Check: A visual check.
- [ ] **should** `law.common-region` *both* Put related items inside a shared region (a soft card or background), not just under a heading. Check: A visual check.
- [ ] **should** `law.pragnanz` *both* Simplify shapes and visuals to the simplest form that works. Check: A visual check.
- [ ] **should** `law.aesthetic-usability` *both* Polish raises perceived usability, but don’t let it hide real usability problems. Check: N/a.
- [ ] **should** `law.visual-hierarchy` *both* The thing being chosen or read is the biggest or strongest thing on screen. Check: A visual check.
- [ ] **should** `law.unslop-process` *both* Start every visual direction from human-chosen references, fonts and colours, then have agents produce variants and lock a design system. Check: N/a (process).
- [ ] **showcase** `law.skeuomorphic-affordance` *both* On showcase pages, a control that mimics a real object (dial, switch) behaves like that object. Product screens use them sparingly. Check: A visual check. Use sparingly in ERP.
- [ ] **showcase** `law.anthropomorphism` *both* Character touches (a mascot that looks away while a password shows) belong on showcase pages and rare personal moments only. Check: A visual check of product screens.

## Sources

- [userinterface.wiki (Raphael Salaja)](https://www.userinterface.wiki) (MIT)
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) (MIT)
- [Rauno Freiberg, Web Interface Guidelines](https://interfaces.rauno.me) (No licence stated; paraphrased)
- [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) (No licence stated; paraphrased)
- [Emil Kowalski, writing on animation and components](https://emilkowal.ski/ui/7-practical-animation-tips) (No licence stated; paraphrased)
- [Laws of UX (Jon Yablonski)](https://lawsofux.com) (Public research, credited and linked)
- [Josh W. Comeau, shadows, springs and reduced motion](https://www.joshwcomeau.com/css/designing-shadows/) (All rights reserved; paraphrased)
- [Jakub Krehel, Details that make interfaces feel better](https://jakub.kr/writing/details-that-make-interfaces-feel-better) (No licence stated; paraphrased)
- [Paco Coursey, Disable theme transitions](https://paco.me/writing/disable-theme-transitions) (No licence stated; paraphrased)
- [Benji Taylor, Family Values](https://benji.org/family-values) (No licence stated; paraphrased)
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) (Apple terms; paraphrased)
- [Material Design 3: motion tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) (Apache-2.0 (token tables); paraphrased)
- [Nielsen Norman Group, Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) (© NN/g; paraphrased)
- [Refactoring UI (Adam Wathan, Steve Schoger), free previews](https://www.refactoringui.com) (© the authors; paraphrased)
- [W3C, Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) (W3C Document License)
- [W3C, WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) (W3C Document License)
- [Evil Martians, OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) (© Evil Martians; paraphrased)
- [Smashing Magazine, Better context menus with safe triangles](https://www.smashingmagazine.com/2023/08/better-context-menus-safe-triangles/) (© Smashing Magazine; paraphrased)
- [Thomas and Johnston, The Illusion of Life: the 12 principles of animation](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation) (Principle names only; our own readings)
- [charles.unemployed, short videos on UI craft](https://www.tiktok.com/@charles.unemployed) (Social posts, credited; rewritten in our words)
- [web.dev, Cumulative Layout Shift](https://web.dev/articles/cls) (CC BY 4.0; paraphrased)
