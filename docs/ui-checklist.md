# UI checklist

Generated from `src/lib/encyclopedia.ts` by `node scripts/gen-docs.mjs`; do not edit by hand.
Why, how (with values) and sources for every rule: https://design.alorawork.com/encyclopedia

Run every UI change through this list before review. Cite a rule by its id. *Exempt:* names the parts a rule doesn’t apply to; don’t hold them to it.
Each rule is tagged *desktop*, *mobile* or *both*: a phone screen runs the mobile and both rules, a desktop screen the desktop and both rules. Content drawn inside a phone frame (`PhoneFrame`) on a desktop page is a phone screen.
**must** (82) blocks review. **should** (130) is the default unless the PR says why not. **showcase** (13) is decoration, allowed only on showcase and demo pages, never in product screens.

## Motion purpose

- [ ] **must** `motion.frequency-of-use` *both* The more often an action happens, the less it animates. Context menus, the command palette, list and option highlights, table row hover and keyboard moves are instant. Check: Highlight and hover states on rows, options and palette items are 0 ms; the context menu and the command palette are at opacity 1 on the frame after they open. Exempt: Menus, selects and popovers keep the short scale-in; one-of-N pills slide.
- [ ] **must** `motion.no-keyboard-animation` *desktop* Keyboard-driven changes (arrow keys in lists, Tab focus, shortcuts) never animate. Check: `rg -n "data-\[highlighted\].*transition|focus-visible.*transition"`. In Playwright, press ArrowDown 10 times in 200 ms; the highlight must follow every key.
- [ ] **must** `motion.context-menu-exit-only` *desktop* Context menus and right-click menus appear instantly and may fade out briefly. Check: Open a ContextMenu in Playwright. The content must be at opacity 1 on the very next frame.
- [ ] **must** `motion.delight-budget` *both* Playful motion (confetti, bounces, easter eggs) never appears in product screens. It is allowed on showcase and demo pages, and for one-time moments such as finishing setup. Success never pops or bounces, showcase included: it finishes the motion already running and draws the check. Check: `rg -n "confetti|bounce:\s*0\.[3-9]"` only hits showcase or one-time onboarding code, and no success state scales past 1.
- [ ] **must** `motion.reduced-motion` *both* Respect `prefers-reduced-motion`. Replace movement (translate, scale, blur) with a short fade, or nothing. Check: Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`, open each overlay, and confirm no animation of `transform`, `translate` or `scale` runs longer than 1 ms (base.css cuts every animation to 0.01 ms, so a keyframe that still lists a scale doesn't move).
- [ ] **should** `motion.purpose` *both* Animate only to explain cause and effect, show where something came from or went, or give feedback. Check: Review each `transition`, `animate=` and `@keyframes` and ask "what does this explain?". Delete any without an answer.
- [ ] **should** `motion.no-autoplay-loops` *both* Motion the user didn’t start (loops, marquees, video, ambient backgrounds) is muted and pauses off-screen and in a hidden tab. Ambient loops longer than 5 s get a pause control or stop under reduced motion. Check: `rg -n "animation-iteration-count:\s*infinite|repeat:\s*Infinity|animate-(spin|pulse|ping|bounce)"`: every hit is a skeleton, a loader, or pauses off-screen. `rg -n "<video" | rg -v playsInline` has no hits. Exempt: The skeleton pulse and AI loaders (Thinking orbs, Run status) while work runs.

## Timing and easing

- [ ] **must** `motion.under-300ms` *both* User-triggered state changes finish within 300 ms. The default is 220 ms with ease-out. Check: `rg -n "duration-(3[5-9][0-9]|[4-9][0-9]{2}|[0-9]{4})|duration:\s*0?\.([4-9]|3[5-9])|transition[^;]*\b([4-9][0-9]{2}|[0-9]{4})ms"`. Exempt: Springs after a drag or flick (judged by when they are within 2 px), hold feedback that runs as long as its hold (the long-press dip), the one wrong-code shake (≤ 360 ms), a success sequence that plays once, a page-level push such as the Customize flap (≤ 320 ms), AI glow and loader fades (≤ 500 ms, ambient), and the theme reveal circle (450–520 ms with soft ends, from the nearest edge of the area that changes: faster, it flashed). A page-wide theme toggle may swap at once; only a switch that themes part of a page uses the reveal.
- [ ] **must** `motion.ease-out-default` *both* Use a strong ease-out for things that enter, and for feedback. Never use plain `ease-in` on something the user is waiting for. Check: `rg -n "ease-in\b|ease-in[^-]"` has no hits on entering or feedback animations.
- [ ] **must** `motion.no-transition-all` *both* Never write `transition: all` or Tailwind `transition-all`. List the properties. Check: `rg -n "transition-all|transition:\s*all"`.
- [ ] **should** `motion.ease-in-out-for-morphs` *both* When something moves or morphs between two on-screen states (tab pill, layout change), use ease-in-out, or a spring with no visible bounce. Check: Look at the segmented control pill and the accordion.
- [ ] **should** `motion.linear-only-for-time` *both* Use linear easing only for things that show time or progress: progress bars, timers, marquees and scrubbing. Check: Every `rg -n "ease-linear|linear\b"` hit outside progress, timer or marquee code is a fail.
- [ ] **should** `motion.consistent-timing` *both* Similar elements share the same duration and curve tokens, on one scale where bigger and farther moves take longer. Check: `rg -n "duration-\[[0-9]+ms\]" src/components` only shows values from that scale, and every curve is `ease-ad` or `var(--ad-ease)`.

## Enter, exit and origin

- [ ] **must** `motion.enter-scale` *both* Pop-ups enter from scale 0.95–0.97 with opacity 0, never from scale 0. Check: `rg -n "scale\(0(\.([0-8]|9[0-4])[0-9]*)?\)|scale:\s*0[,; }]|scale-0\b|zoom-in-[0-8]?[0-9]\b"` has no hits on a pop-up’s keyframes (a long-press menu from `scale(0.6)` fails too). Exempt: Things that aren’t pop-ups: a typed OTP digit settling in, a count badge’s first appearance.
- [ ] **must** `motion.origin-aware` *both* Popovers, dropdowns and tooltips grow out of the thing that opened them. Check: Every Radix content element in `src/components` sets `origin-(--radix-…-transform-origin)`.
- [ ] **must** `motion.theme-switch-no-transition` *both* Turn every element transition off while the theme changes. A full-page switch may crossfade the whole page as one picture, in 240 ms. Check: The theme setter goes through `crossfadeTheme` or `switchTheme`, and `.ad-theme-switch` is gone when it ends.
- [ ] **must** `motion.presence-keys` *both* Animated lists use stable ids as keys, never the array index. Check: `rg -n "key=\{(i|idx|index)\}"`.
- [ ] **should** `motion.symmetry` *both* An exit leaves the way it came (same direction), about 20% shorter (180 ms), on the same ease-out, and may travel only part of the way. An accelerate curve is only for something leaving the screen entirely. Check: In each overlay component the exit runs in the same direction as the enter, at about 0.8 × its duration, on `var(--ad-ease)` (accelerate only for a sheet leaving the screen).
- [ ] **should** `motion.directional-steps` *both* Steppers, wizards, carousels and real page changes slide in the direction of travel. Forward comes from the right, back from the left. Check: Click Next and then Back in Playwright. Assert the sign of `translateX` at frame 1. Exempt: Tab panels swap in place; only the tab pill slides.
- [ ] **should** `motion.spatial-continuity` *both* A change spreads out from the control that caused it, or the shared element moves rather than being swapped. Check: A visual check of 4× slowed recordings.
- [ ] **should** `motion.object-constancy` *both* When a value changes, the same object moves or morphs. It doesn’t vanish and reappear. Check: A visual check that list reorders animate positions with `layout`, not remounts.
- [ ] **should** `motion.animate-delta-only` *both* When a number changes while it’s on screen, animate only the digits that changed. Check: A visual check: change 1,234 to 1,235 and only the last digit should move. Exempt: Values that load once render still: never roll or count up a static value on load. Count up only where the data is really live.
- [ ] **should** `motion.icon-swap-blur` *both* When an icon swaps (copy → check, play → pause), crossfade it with scale and a little blur. Check: Icon swaps (copy → check, play → pause) animate `filter: blur` and `scale`, not only opacity.
- [ ] **should** `motion.blur-cap` *both* Keep animated blur small: 2–8 px, never above 20 px. Check: `rg -n "blur\((2[0-9]|[3-9][0-9])px\)|blur-(xl|2xl|3xl)"` on animated elements.
- [ ] **should** `motion.stagger-small` *both* List stagger is 20–40 ms per item, with the total capped at about 300 ms, and only on a list’s first entrance. Check: `rg -n "staggerChildren:\s*0?\.(0[5-9]|[1-9])"`. Exempt: Refetches, filter changes and page turns swap in place after the skeleton.
- [ ] **should** `motion.one-focal-point` *both* Only one prominent animation runs at a time. Everything else stays still. Check: A visual check of a recorded flow.
- [ ] **should** `motion.dim-behind-modal` *both* Modal dialogs and modal sheets dim and freeze the page behind them. Check: Dialogs and sheets render the shared `overlayClass` from dialog.tsx. Exempt: A non-modal side pane next to a list (`modal={false}`) doesn’t dim, so another row can be clicked.
- [ ] **should** `motion.interruptible` *both* Any animation can be reversed or redirected mid-way by new input. Check: Double-click every pop-up trigger in Playwright: the panel ends open, with no frame at full opacity before its enter finishes. Hover a control in and out within 50 ms: no stuck or jumping state. Exempt: Overlay enter and exit keyframes, reversed by the presence layer.
- [ ] **should** `motion.transform-opacity-only` *both* Animate only `transform`, `opacity`, `filter` and `clip-path`. Never animate `top`, `left`, `width`, `height`, `margin` or `padding`. Check: `rg -n "transition-\[(top|left|right|bottom|width|height|margin|padding)|animate=\{\{[^}]*(top|left|width|height):"`. Exempt: Measured size on one small container or pill (`motion.height-auto`: accordion, collapsible, StepPanels, SlidingPill), sheet detents and the keyboard inset.
- [ ] **should** `motion.height-auto` *both* To animate a container to its content’s size, use `interpolate-size` or Radix’s measured variable; otherwise animate an outer div to the measured size of an inner div. Where only a reveal is needed, use `clip-path`. Check: `rg -n "max-height:\s*[0-9]{3,}px"` has no hits; each `ResizeObserver` size animation measures one element and animates its parent.
- [ ] **should** `motion.view-transitions` *both* Prefer the View Transitions API for page-level morphs. Each `view-transition-name` must be unique and removed afterwards. Check: `rg -n "view-transition-name"` must not set the same name on list items.
- [ ] **should** `motion.presence-disable-exiting` *both* An element that is animating out can’t be clicked. Check: Code review of elements that animate out before unmounting.
- [ ] **should** `motion.presence-wait-halves` *both* When an exit and an enter run one after the other (swap content, wait, then show), halve each duration. Check: Sequential swaps total no more than about 220 ms.
- [ ] **showcase** `motion.choreography` *both* When many items react to one input, stagger them by distance from the input point, not all at once. Check: A visual check.

## Springs and physics

- [ ] **must** `motion.press-scale` *both* Buttons, chips, cards, tabs and icon buttons shrink while pressed: 0.97 over 150 ms ease-out, 0.98–0.99 for cards, wide triggers and edge-to-edge rows. On desktop the colour doesn’t change on press. Check: After `mouse.down()` on a button, its computed `scale` passes through in-between values to 0.96–0.99 over about 150 ms and its background is unchanged; a table row stays at `scale: none`. Exempt: Triggers whose pop-up is anchored to them (popover, menu, select, combobox, date pickers, hover and context menus) carry `data-ad-anchor` and don’t scale (base.css): a shrinking trigger nudged its pop-up on every open and close. Dialog, alert dialog and sheet triggers press normally. On a phone, glyph-only 44 px icon buttons dip to 0.92 and the tab bar dips only its icon, to 0.86. Table rows, menu items, list options, inputs and inline links don’t scale. On touch, edge-to-edge rows press with an instant fill (`mobile.no-hover-only`).
- [ ] **must** `motion.one-of-n-slides` *both* Whenever exactly one option is chosen in a horizontal picker (segmented control, tabs, filter chips, a single toggle group, nav items, the current page), one shared fill moves from the old option to the new one. Two fills never blink in and out. Check: Click from the first option to the last: the `[data-sliding-pill]` element's transform passes through in-between x values over about 250 ms. Reload: it starts on the chosen option, not at x = 0. Grep pickers for a selected `bg-fill-strong`/`bg-sel` on the option itself: there should be none. Exempt: Vertical option lists (select options, time columns, radio and questionnaire choices), value presets that light up from typing (keypad quick amounts), and page dots (a carousel’s or onboarding’s position indicator, not a picker).
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
- [ ] **must** `ix.disabled-keeps-tooltip` *desktop* Icon-only buttons keep their tooltip, also when disabled, and the tooltip says why it’s disabled. Check: Every icon-only `Button` (prop `icon`) sits inside a `Tooltip` or has visible text next to it. Exempt: Glyphs inside a field with their standard meaning (the search clear ×, the password eye, a chip’s remove ×): they have an aria-label and no tooltip. Everything else (a bell, Close, Attach, Send) keeps one.
- [ ] **must** `ix.hit-area` *both* The clickable area can be larger than what you see. Small controls get a hit area of at least 24 × 24 px on desktop and 44 × 44 px on touch, and the visible size doesn’t change. Check: Playwright: each interactive element’s hit box (including `::after`) is at least 24×24 at a 1280 px viewport and at least 44×44 at a 390 px viewport. Exempt: Inline targets in running text (citation markers, links): 24 px or the line height, whichever is smaller.
- [ ] **must** `ix.label-focuses-input` *both* Clicking a label focuses or toggles its control. Check: Axe rule `label`. Playwright: clicking the label puts focus on the input.
- [ ] **must** `ix.links-are-links` *both* Navigation uses `<a>` or `<Link>`, never `onClick` on a div or button. Check: `rg -n "onClick=\{\(\) => (router\.push|navigate)\("`.
- [ ] **must** `ix.safe-triangle` *desktop* Nested menus keep a safe area between the parent item and the submenu, so a diagonal move doesn’t close the submenu. Check: Playwright: hover the parent, then move diagonally through a sibling to the submenu. The submenu stays open.
- [ ] **must** `ix.hover-and-click` *desktop* Every hover-opened menu also opens on click, tap and keyboard. Check: Playwright on mobile emulation: tap opens the menu.
- [ ] **must** `ix.no-double-submit` *both* Once submitted, a button ignores further clicks until the request ends, and shows it’s busy in the same width (`state.loading-button`). Check: Playwright: double-click Save and count the network requests (must be 1).
- [ ] **must** `ix.human-in-the-loop` *both* AI and automation may suggest anything, but they ask before changing user data. Check: Code review: no AI-triggered mutation without a confirm step.
- [ ] **must** `ix.one-filter-button` *both* Shop, period, status, date range and every other filter live behind one Filter button: a popover on desktop, a bottom sheet on a phone. It shows how many filters differ from their defaults and has Clear inside. Check: Set a filter: the count appears and the button’s width is unchanged. Clear resets every filter and the count goes. At 390 the same button opens a sheet with 44 px options. Exempt: Summary rows and chart bars that filter the list stay where they are (`ix.summary-filters`) and set the same filter, so the count includes them. A page with nothing to narrow has no Filter button.
- [ ] **must** `ix.overflow-actions` *both* A page shows one primary action. Export, Columns, Print, Sync, view switches and every other page action go in one ⋯ menu. Check: In the header, count visible buttons other than search and Filter: one ⋯ and at most one primary. Exempt: A bulk action bar while rows are selected, and the footer of a pane or dialog, which carry their own actions.
- [ ] **must** `ix.summary-filters` *both* Clicking a summary row or chart bar filters the list below it. Check: A visual check.
- [ ] **must** `ix.drag-alternatives` *both* Every drag, swipe, pinch, pull or long-press also has a visible click, tap or keyboard way to do it. Check: Per gesture, find the matching control. A Playwright run that never drags reaches every action (SwipeRow, PullToRefresh, MobileSheet included).
- [ ] **should** `ix.fitts-placement` *both* Put frequent targets large and close to where the pointer or thumb already is. Screen edges and corners are effectively infinite targets. Check: A visual check.
- [ ] **should** `ix.no-dead-zones` *both* If part of a control looks clickable, all of it is. Lists have no dead gaps between items. Use padding, not margins. Check: Playwright: click at the midpoint between two adjacent list items. It must hit one of them.
- [ ] **should** `ix.url-state` *both* Filters, tabs, pagination, sort and open panels live in the URL. Check: Playwright: change a filter, reload, and the filter is still applied. Exempt: View and debug toggles (Slow motion, an open Customize panel, the docs demo toggles such as Open, Detents, Kind and Keyboard). Settings and filters still go in the URL.
- [ ] **should** `ix.scroll-restore` *both* Back and Forward restore scroll position, and anchored headings stop below a sticky header. Check: Playwright: scroll, open a detail, go back, compare `scrollY`.
- [ ] **should** `ix.dropdown-on-pointerdown` *desktop* With a mouse, menus open on pointer down, not on click. Check: `rg -n "DropdownMenuTrigger[^>]*onClick"`. Exempt: Touch: menus open on tap release, so scrolling past a trigger never opens it.
- [ ] **should** `ix.toggle-immediate` *both* A standalone switch takes effect at once, with no confirm step. Inside a form with Save, it saves with the form. Check: Code review of Switch handlers: no `confirm()`; a standalone switch saves on change, a form switch waits for Save. Exempt: Switches inside a form with a Save button.
- [ ] **should** `ix.no-select-on-controls` *both* Text inside buttons, tabs and draggable handles isn’t selectable. Decorative layers don’t catch pointer events. Check: `rg -n "<button" | rg -v "select-none"` (review the hits). Every absolutely positioned decorative element has `pointer-events-none`.
- [ ] **should** `ix.list-keyboard` *desktop* Focusable lists move with ↑ and ↓, Home and End, and Enter to open. Typing jumps to matches. Check: Playwright keyboard walk.
- [ ] **should** `ix.shortcuts-shown` *desktop* Show shortcuts with platform symbols (⌘ on Mac, Ctrl elsewhere) and keep them working on non-QWERTY layouts. Check: Code review.
- [ ] **should** `ix.optimistic` *both* Show reversible small edits (switches, inline cells, reorder, reactions) at once and sync in the background. Roll back with a message if the save fails. Check: Playwright with throttled network: the UI updates before the response. Exempt: Creates, payments and submits show the busy label until the response (`state.loading-button`, `ix.no-double-submit`).
- [ ] **should** `ix.recognition-over-recall` *both* Input surfaces (composer, search, command palette, combobox) offer recent or suggested picks rather than an empty box. Check: A visual check of empty inputs. Exempt: Empty data lists stay quiet (`state.empty-states`).
- [ ] **should** `ix.brushing-linking` *desktop* Hovering an item highlights related items elsewhere (a chart bar and its table row, a citation and its source). Check: A visual check.
- [ ] **should** `ix.natural-mapping` *both* Control direction and range map naturally onto the effect: drag up for more, right for forward, clockwise to increase, and distance in proportion to the change. Check: A visual check.
- [ ] **should** `ix.respond-under-100ms` *both* Every input gets some visible response within 100 ms (press state, highlight, optimistic change). Check: Playwright: pointerdown to the first DOM mutation, under 100 ms, on an idle machine and next to a baseline (opening a menu). On a loaded host, judge the ratio to the baseline, not the raw number. INP under 200 ms.

## Typography

- [ ] **must** `type.tabular-nums` *both* Numbers that change, or that line up in columns (tables, totals, timers, prices), use tabular figures. Check: Playwright: `getComputedStyle(td).fontVariantNumeric` includes `tabular-nums` for every numeric cell (`[data-numeric]`).
- [ ] **must** `type.numbers-right-aligned` *both* Numeric table columns are right-aligned, headers included. Check: Computed `text-align` on numeric `th` and `td` is `right` or `end`.
- [ ] **must** `type.no-weight-shift` *both* Selected or hovered text never changes width. If you bold a tab label, reserve the bold width. Check: Playwright: measure the tab width before and after selection. The delta is 0.
- [ ] **must** `type.min-weight-400` *both* No weight below 400. Body 400, active labels 500, headings and big numbers 600. Check: `rg -n "font-(thin|extralight|light)|font-weight:\s*[1-3]00"`.
- [ ] **must** `type.few-faces` *both* One typeface: the system sans stack, with tabular figures and a plain 1 (no foot serif). Mono only in code blocks. No uppercase labels. Build hierarchy with size, weight and colour. Check: `rg -n "font-family|font-serif|font-mono|uppercase" src/components` only references the token or code blocks.
- [ ] **must** `type.icon-stroke-matches-text` *both* Icons are Feather at 16 px beside 13–14 px text, 1.75 stroke with round caps, in the same colour as the text, with no container behind them. Check: Computed icon width is 16 px beside body text and 14 px for in-field glyphs (on a phone: 20 px beside 15–17 px text in rows, 22 px in bars and tabs, 24 px for the back chevron); no icon sits in a filled circle or square. Exempt: The Thumb placeholder for a missing image is an image slot with an icon in it, not an icon in a container.
- [ ] **should** `type.text-wrap` *both* Headings use `text-wrap: balance`. Paragraphs use `text-wrap: pretty`. Check: `rg -n "<h[1-3]" | rg -v "text-balance"` (review the hits).
- [ ] **should** `type.measure` *both* Paragraphs are at most about 65 characters wide. Check: Computed width ÷ `ch` ≤ 75 on prose blocks. Exempt: One-line summaries that truncate (encyclopedia rows, table cells).
- [ ] **should** `type.underline-for-links-only` *both* Underline only links. Use weight for emphasis, and italics only for citations. Check: `rg -n "underline" | rg -v "<a|Link"`.
- [ ] **should** `type.text-box-trim` *both* Trim the extra space above caps and below the baseline on labels and buttons, so text is optically centred. Check: A visual check: a button label’s cap height is centred within ±0.5 px.
- [ ] **should** `type.curly-quotes` *both* Use real curly quotes and apostrophes (“ ” ‘ ’) and the single ellipsis character (…). Check: `rg -n "[A-Za-z]'[A-Za-z]|\"[A-Z][^\"]{2,}\"|\.\.\." --glob "*.{tsx,json}"`, restricted to user-facing strings.
- [ ] **should** `type.ellipsis-labels` *both* Menu items that open a further step end with "…" ("Rename…"), and so do in-progress labels ("Saving…"). Check: `rg -n "(Rename|Export|Delete|Saving|Loading)\.\.\."` (should use `…`).
- [ ] **should** `type.nbsp` *both* Use non-breaking spaces between numbers and units, and inside shortcuts and brand names. Check: `rg -n "[0-9] (MB|GB|KB|ms|px|%)"` in copy.
- [ ] **should** `type.truncate-middle-filenames` *both* File names truncate in the middle so the extension stays visible. Check: A visual check with a 60-character file name.
- [ ] **should** `type.line-clamp` *both* Card titles and descriptions cap at 1–2 lines with a clean ellipsis. Check: Render with 200-character titles and check card height doesn’t grow.
- [ ] **should** `type.font-loading` *both* A loaded webfont (showcase pages only; app screens use the system stack) must not hide text or shift layout. Check: Lighthouse: no CLS from fonts.
- [ ] **should** `type.disambiguation` *both* Codes, vouchers and IDs may use a slashed zero so 0 and O differ. Never a stylistic set that changes the system font’s 1. Check: `rg -n "font-feature-settings|ss0[0-9]" src` has no stylistic sets.
- [ ] **should** `type.hierarchy-weight-colour` *both* Show hierarchy with weight and colour (primary, secondary grey) before size. Check: A visual check.
- [ ] **showcase** `type.fluid-headlines` *both* Showcase headlines may scale smoothly with `clamp()`. App screens use the fixed type scale. Check: `rg -n "text-[0-9]xl md:text-[0-9]xl lg:text"` on display headings.
- [ ] **showcase** `type.ai-looking-fonts` *both* Brand and showcase display type avoids the faces most often defaulted to by AI builders. App screens keep the system stack. Check: Showcase font config doesn’t land on one of those by default.

## Colour

- [ ] **must** `color.shade-scale` *both* Greys come from one fixed ramp of six per theme: page, surface, fill, fill-strong, ink-muted, ink. Never add another grey. Check: `node scripts/greys.mjs --check` passes.
- [ ] **must** `color.neutral-greys` *both* Greys are neutral by default (chroma 0). A product may tint them deliberately through the Greys setting. Check: Default tokens have chroma 0.
- [ ] **must** `color.single-accent` *both* One accent, on primary and key action buttons, and in shades for charts. Active nav, numbers and selected states stay neutral, and nothing changes colour when clicked. Check: Count `bg-brand|text-brand` per screen: one primary action, plus the one attention fill if present; charts use the chart tokens. Exempt: Charts (accent shades) and one soft `brand-soft` fill per view for the one thing that needs attention.
- [ ] **must** `color.state-contrast` *both* Hover, active and selected states differ clearly from rest in both themes. A raised pill on a track gets its contrast from the grey step, its soft shadow and the label weight, never from inverting to ink. An ‘on’ state is never white on white. Check: Playwright: compare the computed background of rest, hover and selected states. ΔL in OKLCH ≥ 0.04 between each.
- [ ] **must** `color.not-colour-alone` *both* Status is never colour alone: a small dot plus text, or an icon. A soft coloured pill only for the one status that needs attention. Check: Axe and a visual check. Every coloured badge has text.
- [ ] **must** `color.contrast-min` *both* Text contrast is at least 4.5:1 in both themes, the accent button’s label included; large text at least 3:1. Prefer APCA Lc 60+ for body text. Check: Axe `color-contrast` in Playwright, both themes. Exempt: Soft control fills (inputs, unchecked boxes) don’t reach 3:1 against their surface; they differ by at least one grey step and have a label beside them.
- [ ] **should** `color.oklch-palette` *both* Build palettes in OKLCH. Keep hue and chroma and step lightness. Check: `rg -n "oklchToHex" src/lib/config.ts src/lib/color.ts` finds the accent ramp built in OKLCH, and `rg -n "hsl\(" src/lib` has no hits.
- [ ] **should** `color.gradient-oklch` *both* Interpolate gradients in OKLCH or OKLab. Check: `rg -n "linear-gradient\((?!.*in ok)"`.
- [ ] **should** `color.lower-chroma` *both* If a colour looks garish, lower its chroma before you change its hue. Check: A visual check.
- [ ] **should** `color.no-grey-on-colour` *both* On a coloured surface (soft status pill, alert, accent button), secondary text and icons take that colour’s own ink, not grey. Check: A visual check.
- [ ] **should** `color.chart-palette` *both* Chart series are colour-blind safe, and in a mono-accent system they are shades of one hue plus neutrals. Check: Run series colours through a colour-blindness simulator.
- [ ] **should** `color.selection` *both* Style `::selection` to the brand, and unset it on gradient text. Check: Grep the base CSS. Exempt: A red or pink accent: the selection is neutral `fill-strong`, so it never reads as an error.
- [ ] **should** `color.multiply-product-shots` *both* Product photos on pure white use `mix-blend-mode: multiply` on light surfaces, so the white box disappears. Check: A visual check in both themes. Exempt: Illustrated thumbnails on a deliberate coloured backdrop.
- [ ] **showcase** `color.film-grain` *both* On showcase pages, big gradients get a faint 2–4% noise layer to stop banding. Check: A visual check for banding at 100% zoom. This is for marketing or showcase only.

## Layout

- [ ] **must** `layout.concentric-radius` *both* Corners are concentric where a child sits close to its parent’s edge (inset ≤ the parent’s radius): pill in a track, item in a menu, field in a composer, image in a thin frame. Inner = outer − inset. Check: For each rounded child inset by p ≤ its parent’s radius, child radius ≈ parent radius − p (±1 px). Exempt: A control well inside a padded card keeps the control radius. Message and comment bubbles keep the bubble radius inside their card. Marketplace marks, flags and avatars are artwork, not nested surfaces.
- [ ] **must** `layout.radius-tokens` *both* Radius comes from a few tokens, and siblings of one kind (all buttons in a view) share one radius. Check: `rg -n "rounded-\[|border-radius:\s*[0-9]" src/components` finds no literal radii.
- [ ] **must** `layout.spacing-scale` *both* Spacing comes from the tokens (`p-pad`, `gap-gap`, `px-bubble`) and Tailwind’s steps, which are rem on the 13 px body root: `gap-1` = 3.25 px, `gap-2` = 6.5 px, `size-4` = 13 px. No px literals for spacing. Check: `rg -n "(p|m|gap)-\[[0-9]+px\]" src/components` (review each hit); icons measure 16 px and hit areas 24 / 44 px. Exempt: Icon sizes and hit areas, set in px.
- [ ] **must** `layout.page-top` *both* A page’s top area is one title, then at most one search, one Filter button, a ⋯ menu and one primary action, all on the title’s row. Nothing else sits above the content: no second row of dropdowns, segmented periods, tabs of filters or loose buttons. Check: On each page at 1440 and 390, the header is one row and the next element is content or metrics. Count in it: one `h1`, at most one search, one `[data-filter-button]`, one accent button. Exempt: Detail panes and dialogs, which have their own title and footer. A view that switches between whole layouts of the same data goes in the ⋯ menu; real section tabs on a page without filters may sit under the title.
- [ ] **must** `layout.no-lines` *both* No borders, outlines, rings or dividing lines: not between rows, list items, stats, columns or sections, and not on selected or open states. Separate with space, soft fills and shadows. Check: `./scripts/shots` flags visible borders; `rg -n "border-|divide-|ring-|outline-" src/components` (review each hit against the exemptions). Exempt: Chart axes and faint gridlines, the radar web, link underlines, progress and step bars, a 2 px rail between timeline and stepper dots, the AvatarGroup and stacked marketplace-mark cutouts (a ring in the surface colour), and the AI Composer glow.
- [ ] **must** `layout.align-everything` *both* Every element aligns to a grid, a baseline, an edge or an optical centre. Controls in one toolbar share one height and one centre line. Check: Playwright: in each toolbar, every child’s `getBoundingClientRect` centre-y is equal within ±0.5 px.
- [ ] **must** `layout.no-layout-shift` *both* Nothing jumps while loading or updating. Reserve space for images, async content and late fonts. Check: Playwright: collect the `layout-shift` PerformanceObserver during load and filter changes. CLS < 0.01.
- [ ] **must** `layout.dvh` *mobile* Full-height sections use `dvh`, not `vh`. Check: `rg -n "100vh|h-screen\b|min-h-screen\b"`.
- [ ] **must** `layout.scrollbars` *desktop* Show only useful scrollbars, style them once, and never put content under one. Check: No horizontal scroll on the page at 360–1440 px (`scrollWidth > clientWidth` on html is a fail).
- [ ] **should** `layout.proximity` *both* Related items sit closer together than unrelated ones. The gap inside a group is smaller than the gap between groups. Check: A visual check: intra-group gap < inter-group gap.
- [ ] **should** `layout.fewer-containers` *both* One surface level per region: content sits straight on its card, never in a framed box inside a framed box. Check: Count nested bordered or shadowed ancestors per element. More than 2 is a fail. Exempt: Demo frames on showcase and encyclopedia pages, where the comparison panels are the point.
- [ ] **should** `layout.metrics-under-header` *both* When a page has metrics and filters, the filters stay in the Filter button and the metrics are the first thing under the header, in one row, before charts and tables. They show the filtered numbers. Check: On a page with metrics, the element right after the header holds the metric cards, and changing a filter changes their values. Exempt: A blocking error (the data failed to load, the account is locked) may show its alert above the metrics.
- [ ] **should** `layout.elevation-scale` *both* Shadows come from a fixed token scale (card, raised): layered (2–4 layers, growing blur, falling opacity) from one light source above, low alpha, never solid black. Check: `rg -n "shadow-\[|rgba\(0,\s*0,\s*0,\s*0\.[3-9]" src/components` has no hits: shadows are the tokens.
- [ ] **should** `layout.dark-elevation` *both* In dark mode, cards sit one step lighter than the page, and floating layers (tooltips, menus, selects, popovers, hover cards, previews) are darker than what they float over: the page grey, separated by the raised shadow. Toasts are the exception: a dark island (`bg-side-raised`), like the phone snackbar, so they never read as a hole in a card. Check: In dark, an open menu, select, popover and hover card compute to the page token, darker than the card under them; a toast computes to `side-raised`.
- [ ] **should** `layout.animate-shadow-cheaply` *both* To animate a shadow (hover lift), fade a pseudo-element that holds the bigger shadow. Check: `rg -n "transition-shadow|transition:[^;]*box-shadow"` on large lists.
- [ ] **should** `layout.optical-alignment` *both* Align by eye where geometry looks wrong. Icon-side padding on a button is slightly smaller, and play icons shift right. Check: A visual check at 400% zoom.
- [ ] **should** `layout.safe-areas` *mobile* Respect notches and home indicators. Check: `rg -n "safe-area-inset"` in fixed bars. At 390 × 844 in the phone frame nothing sits under the status bar or the home indicator.
- [ ] **should** `layout.intrinsic-sizing` *both* Let CSS size things (flex, grid, `fit-content`) rather than measuring in JS. Check: `rg -n "getBoundingClientRect|offsetWidth"` in layout code needs a reason.
- [ ] **should** `layout.size-to-content` *both* Triggers, stat cards and table columns are as wide as their content needs, not stretched. A table fills its card; its columns size to content and the slack goes to the one main text column (Product, Items). Check: A visual check. Exempt: Showcase bentos stretch tiles to their row (a stretched tile stays no more than about 25% empty); equal metric tiles in a two-column phone grid.
- [ ] **should** `layout.edge-fade` *both* Carousels, chip rows and tab strips fade at a scrollable edge instead of hard-cutting. Check: A visual check. Exempt: Data tables never fade: the money columns must stay readable.
- [ ] **should** `layout.materiality` *both* Textures and materials (glass, refraction, grain) must have a reason. Check: Every `backdrop-blur` sits on a floating layer.
- [ ] **should** `layout.responsive-coverage` *both* Check every screen at 390, 1024 and 1440 px in both themes, plus 50% zoom for ultra-wide. Check: Screenshots at each width.
- [ ] **showcase** `layout.radial-not-blurred-rects` *both* Make glows with radial gradients, not blurred or scaled rectangles. Check: `rg -n "blur-3xl|blur\(100px\)"`.

## Forms

- [ ] **must** `form.labels` *both* Every control has a label (visible, or at least an accessible name). Check: Axe `label`.
- [ ] **must** `form.enter-submits` *both* Wrap fields in a `<form>`, so Enter submits single-line inputs. In a long-form textarea (notes, descriptions), ⌘/Ctrl+Enter submits. Check: Playwright: press Enter in the last field and confirm a submit request. Exempt: Chat composers: Enter sends and Shift+Enter adds a line, as in every chat app.
- [ ] **must** `form.no-paste-block` *both* Never block paste. Never block typing invalid characters: accept, then validate. Check: `rg -n "onPaste"`.
- [ ] **must** `form.placeholders` *both* No helper text under fields. A placeholder may show an example or format, never the label. Check: No placeholder equals its label, and no `<p>` sits under a field except an error. Exempt: Instructions that make a showcase demo playable (“Type any four digits”).
- [ ] **must** `form.unsaved-changes` *both* Warn before leaving with unsaved changes. Make the dirty state visible on long forms. Check: Playwright: edit a field, navigate away, and expect a dialog.
- [ ] **must** `form.autofocus-desktop-only` *both* Autofocus the single main input (search, command, a one-field dialog) only with a fine pointer. Never autofocus on touch. Check: `rg -n "autoFocus"`: each use is gated on `(pointer: fine)`.
- [ ] **should** `form.input-types` *both* Use the right `type`, `inputmode`, `autocomplete` and `enterkeyhint`. Check: `rg -n "name=\"(email|phone|otp|code)\""` and confirm the matching type or inputmode.
- [ ] **should** `form.spellcheck-off` *both* Spellcheck off for emails, codes, usernames, SKUs and search. Correct `autocomplete` tokens on personal and sign-in fields; `autocomplete="off"` only on search and non-sign-in fields. Check: Grep code and email inputs.
- [ ] **should** `form.postel` *both* Accept messy input and normalise it (spaces in phone numbers, "12.400.000" or "12400000", trailing spaces from IME). Check: Unit tests with messy samples.
- [ ] **should** `form.reward-early-punish-late` *both* Show positive progress as soon as the user types. Show errors only after they leave the field or submit, then re-check live while they fix it. Check: Playwright: type one character in an email field. No error is shown until blur.
- [ ] **should** `form.inline-validation` *both* Validate in place, next to the field. On submit, focus the first invalid field. Check: Playwright: submit an empty form and confirm `document.activeElement` is the first invalid field.
- [ ] **should** `form.dont-pre-disable` *both* Keep Submit enabled until it’s pressed, so pressing it reveals what’s missing. Check: `rg -n "disabled=\{!isValid"`. Exempt: A disabled main action whose label says what’s missing (“Add a photo”, “Sign to finish”).
- [ ] **should** `form.error-shake` *both* A wrong code or password may shake the field sideways along with the error. Sign-in and code entry only. Check: Only sign-in or code inputs shake, and not under reduced motion.
- [ ] **should** `form.chunking` *both* Long codes and numbers display in readable groups. Check: A visual check.
- [ ] **should** `form.prefix-icons-inside` *both* Icons and prefixes (search glass, "Rp") sit inside the input with padding, and clicking them focuses the input. Check: Playwright: clicking the icon focuses the input.
- [ ] **should** `form.edit-in-place` *both* An editable cell edits where it stands: the editing box is the resting box, so the text, the right edge and the row don’t move. Units stay fixed beside the value and number grouping survives typing. Enter or leaving the cell saves, Tab saves and edits the next cell, Esc reverts. Check: Playwright: screenshot the cell, click it, hide the caret and screenshot again. The text pixels are identical and no other cell in the row moved.
- [ ] **should** `form.reserved-names` *both* Non-auth fields avoid names like "password", so password managers stay out. Check: `rg -n "name=\"password\""` outside auth.
- [ ] **should** `form.closure-strength` *both* Show strength or progress as a shape that completes, a short row of segments or a bar that fills, rather than a “weak/strong” label. Never a ring: it reads as a spinner. Check: Strength meters and progress loaders are segments or bars; none is a ring or circle. Exempt: A KPI ring that shows its number in the middle (ProgressRing: budget used, orders packed) never spins and reads as a gauge.

## Mobile and touch

- [ ] **must** `mobile.input-16px` *mobile* Inputs, selects and textareas are at least 16 px on phones. Check: Playwright at a 390 px viewport: every `input, select, textarea` has computed `font-size` ≥ 16 px.
- [ ] **must** `mobile.never-disable-zoom` *mobile* Never disable pinch zoom. No `maximum-scale=1` or `user-scalable=no`. Check: `rg -n "maximum-scale|user-scalable"`.
- [ ] **must** `mobile.overscroll-contain` *both* Sheets, modals, popovers, side panes and any panel with its own scroll contain their scroll. Check: Computed `overscroll-behavior` on `[role=dialog] [data-scroll]` is `contain`.
- [ ] **must** `mobile.touch-targets` *mobile* Every tap target on a phone has a hit area of at least 44 × 44 px (the visible part may be smaller, through `ix.hit-area`), and a row is one target from edge to edge. Check: Smoke at 390 px: every button, link, input and option inside the phone frame has a hit box (its own box, its `::after`, or its enclosing label, field or row) of at least 44 × 44. Exempt: Inline links in running text.
- [ ] **must** `mobile.no-hover-only` *mobile* On a phone, nothing is reachable only by hovering: no hover-only buttons, tooltips or reveals. Press feedback replaces hover feedback. Check: `rg -n "hover:" src/components/mobile` shows only `[@media(hover:hover)]:hover:` forms; `rg -n ":hover" --glob "*.css"` hits sit inside `@media (hover: hover)`; each `group-hover` reveal has a tap path.
- [ ] **must** `mobile.keyboard-avoidance` *mobile* Bars and sheets ride on top of the on-screen keyboard, and the focused field stays visible. Check: Phone frame with the keyboard drawn (`?keyboard=1` on /mobile/mobile-action-bar, /mobile/mobile-text-field or /mobile/mobile-chat; other pages draw no keyboard): the bar sits above it and the focused field stays visible.
- [ ] **must** `mobile.app-chrome` *mobile* A phone app’s chrome is the shop’s logo or mark top left, the profile avatar top right (notifications may sit beside it as one icon), and a bottom nav for the main sections. No sidebar and no hamburger. Check: At 390, every example page shows the mark, the avatar and the tab bar, and no sidebar or menu-drawer button. Exempt: Pushed detail screens: a back button replaces the mark and the tab bar hides (`mobile.push-pages`). An installed app where people work in one shop at a time may make the shop picker its header (`MobileAppHeader`).
- [ ] **should** `mobile.scroll-snap` *mobile* Swipeable carousels snap to cards. Check: Grep carousel components.
- [ ] **should** `mobile.touch-visibility` *mobile* When a finger covers the content being adjusted, show its value where the finger isn’t: above it, or in the label row. Check: A visual check.
- [ ] **should** `mobile.thumb-zone` *mobile* The primary action and tabs sit within thumb reach at the bottom of the screen. Check: A visual check at 390 × 844. Exempt: List screens keep the search bar under the large title, where it scrolls away with it.
- [ ] **should** `mobile.sheet-detents` *mobile* A bottom sheet rests at set heights (half, full, or its content). A drag picks the detent it is heading for by position and speed; a flick down or a drag past the smallest closes it. Check: Drag the handle up from half: it settles at full; flick down: it closes; the footer button is visible at both detents.
- [ ] **should** `mobile.motion-feedback` *mobile* Without haptics, motion carries the feel: a press dips, a release springs back, a choice slides, a drop snaps. Check: Press and hold a tab and a row at 390 px on a real phone (headless touch emulation never shows `:active` while held): each shows its press state at once.
- [ ] **should** `mobile.one-main-action` *mobile* List screens put their create action in a floating button in thumb reach. Forms and detail screens pin the main action as a full-width button at the bottom, above the home indicator and the keyboard; a form that fits one screen has Save at its bottom. Check: Each list screen with a create action has one floating button; each form and detail screen has its action bar; no screen has two accent buttons.
- [ ] **should** `mobile.tab-bar` *mobile* The tab bar holds three to five top-level destinations, each a real screen, with icon and label; it floats above the home indicator and hides on pushed detail screens. Check: Tap every tab in the example app: each opens its own screen.
- [ ] **should** `mobile.compact-metrics` *mobile* Metrics on a phone are two-up small tiles or one horizontal row that snaps, with at most one hero number. Never a stack of full-width cards. Check: At 390, the metrics take at most two rows of tiles, or one row that scrolls sideways without moving the page.
- [ ] **should** `mobile.push-pages` *mobile* On a phone, details open as a full screen that slides in from the right, with a back button naming where it goes. Check: Open an order in /mobile/app: it slides in from the right; Back slides it out.

## Feedback and states

- [ ] **must** `state.skeleton-matches` *both* Skeletons appear only for real fetches and match the loaded layout exactly: the same row count, thumb sizes and column widths, with no real data showing under them. Never a spinner. Check: Playwright: screenshot the skeleton and the loaded state and diff the element rects: the same count, each box within ±1 px, and no loaded text, number or chart inside a skeleton row.
- [ ] **must** `state.loading-delay` *both* Every real fetch, filter changes that refetch included, shows its skeleton at once. Loads stay under 0.5 s; mocked loads in demos take 300–400 ms, so the skeleton is seen. Check: Change a filter that fetches on an example page (or hold it with `?loading=1`): the list shows its skeleton, then the result, with no shift. A filter on loaded rows swaps them in the same frame. Exempt: Filtering rows already loaded swaps at once, with no skeleton: nothing stale is showing.
- [ ] **must** `state.loading-button` *both* A busy button keeps its width and shows it’s working: its label changes ("Saving…"), or on a phone’s pinned action bar the label stays and the button pulses. No spinner. Check: The button width is unchanged between idle and pending.
- [ ] **must** `state.toasts` *both* Toasts are short, sit at the far right, leave the way they came, pause on hover and in a hidden tab, and never cover action buttons. Check: Playwright: show a toast on each page with bottom-right actions. The toast rect doesn’t intersect any visible button.
- [ ] **must** `state.empty-states` *both* An empty state is one large line icon and a short title. No sentence, button or illustration. A section without data shows one plain line and hides controls that can’t act on nothing. Check: Render each list with `[]`: one icon and a title, nothing else. Exempt: Error states keep Try again, and a 404 keeps one plain link back (`state.no-dead-ends`).
- [ ] **must** `state.no-dead-ends` *both* Error, 404, offline and no-permission screens offer a retry or a way back. Check: A visual check of the 404, 500 and empty-permission screens. Exempt: Empty data lists: no button inside the empty state (`state.empty-states`).
- [ ] **must** `state.hover-cues` *desktop* Interactive things show a hover change before they’re pressed. Check: Playwright: hover each `button` and `[role=button]`. The computed background or transform changes.
- [ ] **should** `state.design-all-states` *both* Design every state: loading, empty, one item, many, very long content, error, offline, no permission. Check: Each data component’s page shows its loading, empty, long and error states; example pages hold skeletons with `?loading=1`.
- [ ] **should** `state.response-limits` *both* Long actions (imports, exports, sync): from 1 s, show that work is happening; over 10 s, show percent done and a way to cancel. Data loads follow `state.loading-delay`. Check: Code review of long-running actions.
- [ ] **should** `state.labour-illusion` *both* For slow or high-stakes work, show the steps as they happen. Check: A visual check.
- [ ] **should** `state.feedback-near-trigger` *both* Confirm small actions where they happened (copy shows a check on the button) rather than in a distant toast. Check: A visual check.
- [ ] **should** `state.undo-over-confirm` *both* Prefer undo for reversible destructive actions. Confirm only the truly irreversible ones. Check: Code review.
- [ ] **should** `state.error-messages` *both* An error says what happened and how to fix it, in plain words, next to the problem. Check: `rg -n "(Something went wrong|Error occurred|Invalid input)"`.
- [ ] **should** `state.hover-children-sync` *desktop* A row’s background and its child elements change at the same instant on hover. Check: A visual check at 0.25× speed.
- [ ] **should** `state.peak-end` *both* End flows with a clear success state. The last screen is what people remember. Check: A visual check of the last step of each flow.
- [ ] **should** `state.goal-gradient` *both* Show progress in multi-step tasks. Check: A visual check.
- [ ] **should** `state.zeigarnik` *both* Surface real unfinished work (drafts, failed syncs, unsaved imports) where it belongs. No onboarding checklists on product screens. Check: A visual check.
- [ ] **showcase** `state.multimodal` *both* Sound and haptics are off in product screens. On showcase pages they may reinforce an event, always with a visual change and a way to turn them off. Check: Every `play()` call is behind a settings flag and has a visual counterpart.

## Data display

- [ ] **must** `data.locale-formats` *both* Dates, numbers and currency follow the locale. Check: `rg -n "toFixed\(|toLocaleString\(\)"` without a locale.
- [ ] **must** `data.virtualize` *both* Tables longer than a page get the bottom bar: count and pager, 50 per page. Never “show more”. Long read-only lists may virtualise. Check: A table with 1,000 rows renders 50 and its bar reads “1–50 of 1.000”.
- [ ] **must** `data.progressive-disclosure` *both* App, ERP and ops pages show only critical information on the main page: status, what’s wrong, what to do and the headline numbers. Secondary information (history, breakdowns, per-item timings, past-run charts, config, ids, logs) sits behind exactly one click, never dropped, and the page has no loose space. Check: On each page, list what shows before any click: every item is status, a problem, an action or a headline number, and every secondary item is reachable in exactly one click. No gap between sections is wider than the page’s usual gap between cards, no card is mostly empty, and no table sits inside a closed Collapsible or Accordion. Exempt: Landing and marketing pages, and the component gallery.
- [ ] **should** `data.labels-last-resort` *both* Skip the "Label: value" pattern when the format or context already explains the value. Combine label and value into a phrase when that’s clearer ("12 left"). Check: A visual check.
- [ ] **should** `data.labels-secondary` *both* When labels are needed, they are quieter than values: smaller, lighter or muted colour, never bolder. Check: A visual check.
- [ ] **should** `data.chunk-groups` *both* Break long sets into groups of about 5–9: grouped settings, digit groups, sectioned menus. Check: Menus with more than 9 ungrouped items get flagged.
- [ ] **should** `data.currency-decimals` *both* Within one context, show currency with either 0 or 2 decimals, not a mix. Check: Unit test.
- [ ] **should** `data.handle-long-content` *both* Layouts survive short, average and very long values (names, SKUs, numbers in the billions). Check: A fixture with 120-character strings and 13-digit numbers.
- [ ] **should** `data.missing-values` *both* Missing values show one placeholder per product (“—” by default, “N/A” where the product uses it), never blank, “null” or a hidden column. Check: `rg -n "\?\? ''|\|\| ''"` in cells.
- [ ] **should** `data.translate-no` *both* Brand names, product names, codes and IDs carry `translate="no"`. Check: Grep SKU and brand cells.

## Accessibility

- [ ] **must** `a11y.keyboard-all` *both* Everything works by keyboard, following the WAI-ARIA patterns. Check: `rg -n "<div[^>]*onClick"`. Run a Playwright Tab walk.
- [ ] **must** `a11y.focus-visible` *both* Keyboard focus is visible on every focusable part, desktop and mobile, as a fill: `fill` on a surface, `fill-strong` on a fill, and on an already-filled selected item a slight darkening. Never a ring, outline or border-colour change. Check: Tab through each page: every focused part’s background differs from its rest and its selected state, and no outline, ring or border appears.
- [ ] **must** `a11y.focus-management` *both* Dialogs trap focus and return it to the trigger on close. Check: Playwright: open, Escape, and confirm `activeElement === trigger`.
- [ ] **must** `a11y.icon-button-names` *both* Icon-only buttons have an `aria-label`. Decorative icons are `aria-hidden`. Check: Axe `button-name`.
- [ ] **must** `a11y.img-alt` *both* Meaningful images have alt text, decorative ones `alt=""`. Illustrations built from HTML get `role="img"` and `aria-label`. Check: Axe `image-alt`.
- [ ] **must** `a11y.no-native-pickers` *both* Dropdowns, popovers, tooltips, dialogs and date or time pickers are always our own components, never the browser’s. Check: `rg -n "<select|title=|type=\"date|alert\(|confirm\(" src` has no hits on user-facing UI. Exempt: The OS file chooser, opened from Dropzone.
- [ ] **should** `a11y.semantic-first` *both* Use native elements (`button`, `a`, `label`, `table`, `h1`–`h6`) before ARIA. Check: Axe and code review.
- [ ] **should** `a11y.live-regions` *both* Toasts, inline validation and async status use polite live regions. Check: Inspect the DOM.
- [ ] **should** `a11y.skip-link` *desktop* Pages have a "Skip to content" link and a logical heading order. Check: Tab once on load.
- [ ] **should** `a11y.page-title` *both* `<title>` reflects the current view. Check: Playwright reads `document.title` per route.

## Performance

- [ ] **should** `perf.mutations-fast` *both* POST, PATCH and DELETE complete in under 500 ms. Check: Playwright network timings.
- [ ] **should** `perf.refs-for-realtime` *both* High-frequency values (drag position, scroll progress, timers) update the DOM through refs, not React state. Check: `rg -n "setState\(.*(clientX|scrollY|pageX)"`.
- [ ] **should** `perf.will-change-sparingly` *both* Use `will-change` and `translateZ(0)` only to fix measured jank, and only while it’s animating. Check: `rg -n "will-change"`. Each needs a comment.
- [ ] **should** `perf.images` *both* Images have explicit sizes. Preload images above the fold and lazy-load the rest. Check: Lighthouse.
- [ ] **should** `perf.prefetch-intent` *both* Prefetch likely next routes on intent (hover, focus, or pointer heading towards a link), not everything in view. Check: Code review.
- [ ] **should** `perf.low-power-test` *both* Test on iOS Low Power Mode, Safari, and a throttled CPU. Check: Record a profile with 4× throttling and compare each control with a baseline (opening a menu): one that takes several times longer is the problem, whatever the absolute numbers.

## Base styles

- [ ] **should** `base.defaults` *both* base.css sets the page-wide defaults once: grayscale antialiasing, no iOS text inflation, underlines that clear descenders, superscripts that keep the leading, no faux bold or italic, `color-scheme` and `theme-color` per theme, no tap flash, `touch-action: manipulation` on controls, and an SVG favicon that follows the scheme. Check: `rg -n "font-smoothing|text-size-adjust|font-synthesis|color-scheme|tap-highlight|touch-action|underline-offset" src/styles/base.css` finds each one, and no component file sets them again.

## UX laws

- [ ] **must** `law.hick` *both* Fewer, clearer choices at a time, without cutting features: one primary (accent) action per view, and a card’s or row’s secondary actions grouped in one menu. Check: Count primary buttons per view: one at most.
- [ ] **must** `law.similarity` *both* Things that work the same look the same, and things that differ look different. Check: `rg -n "<button className="` (raw buttons outside the library).
- [ ] **must** `law.common-region` *both* Related items share a soft fill or card, one level deep, never connecting lines or frames. Check: A visual check: groups are regions, with no connector lines or frames and no card inside a card.
- [ ] **must** `law.cognitive-load` *both* Remove anything that doesn’t help the task: duplicate text, decoration, unneeded choices. Check: A visual check.
- [ ] **should** `law.jakob` *both* Use the patterns people already know (table sort on header click, ⌘K, Esc closes, a logo that goes home). Check: A visual check.
- [ ] **should** `law.tesler` *both* Move complexity into the system, not onto the user (smart defaults, auto-detect, inference). Check: A visual check.
- [ ] **should** `law.serial-position` *both* Put the most important items first or last in lists and navigation. Check: A visual check.
- [ ] **should** `law.visual-hierarchy` *both* The thing being chosen or read is the strongest thing on screen, by weight and colour first (`type.hierarchy-weight-colour`). Check: A visual check.
- [ ] **showcase** `law.skeuomorphic-affordance` *both* On showcase pages, a control that mimics a real object (dial, knob) behaves like it. Product screens use plain controls. Check: A visual check.
- [ ] **showcase** `law.anthropomorphism` *both* Character touches (a mascot that looks away while a password shows) belong on showcase pages and rare personal moments only. Check: A visual check of product screens.

## Old ids

Merged or renamed rules still resolve; cite the current id.

- `motion.duration-by-size` → `motion.consistent-timing`
- `motion.fix-duration-first` → `motion.consistent-timing`
- `motion.exit-faster` → `motion.symmetry`
- `motion.exit-easing` → `motion.symmetry`
- `motion.subtle-exit` → `motion.symmetry`
- `motion.container-two-div` → `motion.height-auto`
- `motion.clip-path-reveal` → `motion.height-auto`
- `perf.pause-offscreen` → `motion.no-autoplay-loops`
- `mobile.video-inline` → `motion.no-autoplay-loops`
- `ix.map-range` → `ix.natural-mapping`
- `mobile.gesture-alternative` → `ix.drag-alternatives`
- `color.hue-consistent-tints` → `color.no-grey-on-colour`
- `layout.layered-shadows` → `layout.elevation-scale`
- `layout.no-pure-black-shadow` → `layout.elevation-scale`
- `mobile.no-autofocus` → `form.autofocus-desktop-only`
- `mobile.hover-media` → `mobile.no-hover-only`
- `law.uniform-connectedness` → `law.common-region`
- `law.pragnanz` → `law.cognitive-load`
- `type.antialiased` → `base.defaults`
- `type.text-size-adjust` → `base.defaults`
- `type.underline-offset` → `base.defaults`
- `type.sup-no-leading` → `base.defaults`
- `type.no-font-synthesis` → `base.defaults`
- `color.color-scheme` → `base.defaults`
- `mobile.tap-highlight` → `base.defaults`
- `mobile.touch-action` → `base.defaults`
- `a11y.svg-favicon-scheme` → `base.defaults`
- `ix.no-tooltip-on-disabled` → `ix.disabled-keeps-tooltip`
- `color.tinted-neutrals` → `color.neutral-greys`
- `a11y.select-colours` → `a11y.no-native-pickers`
- `layout.alpha-borders` → `layout.no-lines`

Dropped (don’t cite):

- `type.small-caps-acronyms`: The system stack fakes or lacks small caps per OS, and it adds a second type style. ERP acronyms are short.
- `type.uppercase-tracking`: The house has no uppercase labels (`type.few-faces`), so there is nothing to track.
- `type.hyphens-narrow`: Table cells stay on one line, and `lang="en"` hyphenates Indonesian names wrongly.
- `color.accent-by-contrast`: The accent is a per-product pick, not a hue formula.
- `form.continuity-monospace`: It contradicted `type.few-faces`: mono only in code blocks.
- `law.pareto`: Not checkable per change; `law.hick` already keeps every feature.
- `law.aesthetic-usability`: Not a UI rule; `data.handle-long-content` already tests with ugly data.
- `law.unslop-process`: A process for new visual directions; it lives in the erp-ui skill.

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
