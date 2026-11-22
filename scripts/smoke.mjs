// Headless smoke test on its own port: every route renders without errors and the key interactions work.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright-core";

// A free port per run: on a fixed one a second run would silently test the first run's build.
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
const PORT = Number(process.env.SMOKE_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${PORT}`;
// SITE_DIST: the build folder (scripts/verify builds into TMPDIR); default is vite's own dist/.
const outDir = process.env.SITE_DIST ? ["--outDir", process.env.SITE_DIST] : [];
const server = spawn("npx", ["vite", "preview", ...outDir, "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let serving = false;
for (let i = 0; i < 60 && !serving; i++) {
  try {
    serving = (await fetch(BASE)).ok;
  } catch {}
  if (!serving) await sleep(250);
}
if (!serving) {
  console.log(`FAIL preview server did not answer on port ${PORT}`);
  console.log("SMOKE FAIL (1)");
  process.exit(1);
}

// The flap pushes the page with a FLIP slide; on a loaded machine it can still be moving after a fixed wait, so wait
// for every finite animation and transition to end (looping ones, like the AI orbs, never do).
const settled = (pg) =>
  pg
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 4000 })
    .catch(() => {});
const failures = [];
const check = (ok, msg) => (ok ? console.log(`ok   ${msg}`) : (failures.push(msg), console.log(`FAIL ${msg}`)));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// "networkidle" means the bundle arrived, not that it ran: on a loaded machine React can mount after it, and a check then
// reads an empty page. Every navigation, on every page of this run, also waits for the app to mount.
const Page = Object.getPrototypeOf(page);
const navigate = Page.goto;
Page.goto = async function (url, options) {
  const response = await navigate.call(this, url, options);
  await this.waitForFunction(() => document.querySelector("#root")?.childElementCount > 0, null, { timeout: 15000 });
  return response;
};

for (const [path, text] of [
  ["/", "just some random ui styling"],
  ["/", "Orders"],
  ["/", "Where should we start?"],
  ["/components", "Components"],
  ["/components/menu", "Menu"],
  ["/components/command-palette", "Command palette"],
  ["/components/fee-row", "Fee row"],
  ["/gallery/fee-row", "Fee row"],
  ["/ai", "In use"],
  ["/ai/thinking-orbs", "Thinking orbs"],
  ["/ai/run-status", "Run status"],
  ["/ai/composer-glow", "Composer glow"],
  ["/backgrounds", "Where should we start?"],
  ["/backgrounds/sand-field", "Sand field"],
  ["/examples/dashboard", "Dashboard"],
  ["/examples/orders", "Orders"],
  ["/examples/products", "Products"],
  ["/examples/promotions", "Promotions"],
  ["/examples/cancellations", "Cancellations"],
  ["/examples/team", "Team"],
  ["/examples/settings", "Settings"],
  ["/encyclopedia", "Encyclopedia"],
  ["/export", "Export"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  check(await page.getByText(text, { exact: true }).first().isVisible(), `${path} shows "${text}"`);
}

// Customize flap: hover opens the left panel and pushes the page flush right; leaving closes it.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.mouse.move(700, 450);
await page.locator("[data-customize-flap]").hover();
await page.waitForSelector("[data-customize-panel][data-state=open]", { timeout: 3000 }).catch(() => {});
await sleep(300);
await settled(page);
const pushed = await page.evaluate(() => {
  const p = document.querySelector("[data-customize-panel]");
  const h = document.querySelector("header > div").getBoundingClientRect();
  return { state: p?.getAttribute("data-state"), panel: Math.round(p.getBoundingClientRect().right), left: Math.round(h.left), right: Math.round(h.right), vw: document.documentElement.clientWidth };
});
check(pushed.state === "open" && pushed.left === pushed.panel && pushed.right === pushed.vw, `flap opens and pushes the page (${JSON.stringify(pushed)})`);
await page.mouse.move(1000, 450, { steps: 4 });
await sleep(800);
check((await page.locator("[data-customize-panel]").getAttribute("data-state")) === "closed", "flap closes on leave");

// The open panel scrolls on its own: wheel over it never moves the page, wheel over the page never moves it.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.locator("[data-customize-flap]").click();
await sleep(500);
const scrolls = () => page.evaluate(() => ({ page: Math.round(scrollY), panel: Math.round(document.querySelector("[data-customize-scroll]").scrollTop) }));
const panelBox = await page.locator("[data-customize-scroll]").boundingBox();
await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, 400);
  await sleep(60);
}
await sleep(300);
const s1 = await scrolls();
await page.mouse.move(panelBox.x + panelBox.width / 2, 30); // the panel's title row
await page.mouse.wheel(0, 600);
await sleep(300);
const s2 = await scrolls();
await page.mouse.move(1200, 500);
await page.mouse.wheel(0, 700);
await sleep(400);
const s3 = await scrolls();
check(s1.page === 0 && s1.panel > 0 && s2.page === 0 && s3.page > 0 && s3.panel === s2.panel, `panel and page scroll separately (${JSON.stringify([s1, s2, s3])})`);
await page.setViewportSize({ width: 1440, height: 2600 }); // the panel's list now fits: nothing to chain from
await page.evaluate(() => scrollTo(0, 0));
await sleep(400);
await page.mouse.move(panelBox.x + panelBox.width / 2, 600);
await page.mouse.wheel(0, 500);
await sleep(300);
const s4 = await scrolls();
check(s4.page === 0, `wheel over a panel that fits never scrolls the page (${JSON.stringify(s4)})`);
await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press("Escape");

// Header: the traced Alora wordmark (not typed text) + "design", same on every page
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const logo = await page.evaluate(() => {
  const a = document.querySelector("header [data-logo]");
  return { svg: !!a?.querySelector("svg path"), text: a?.textContent?.trim(), label: a?.querySelector("[role=img]")?.getAttribute("aria-label") };
});
check(logo.svg && logo.text === "design" && logo.label === "Alora Design", `header shows the Alora logo (${JSON.stringify(logo)})`);
check((await page.getAttribute("a:has-text('erp-ui skill')", "href")) === "https://github.com/JoshD94/ai-skills/tree/main/erp-ui", "hero links the erp-ui skill");

// Landing: one component at a time. Each moment is a linked title over one component. No tables, AI or backgrounds
// (they live on the Components, Examples, AI and Backgrounds pages).
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const landing = await page.evaluate(() => ({
  moments: [...document.querySelectorAll("main [data-moment]")].map((m) => m.dataset.moment),
  titled: [...document.querySelectorAll("main [data-moment]")].every((m) => m.querySelector(":scope > h2 a[href]")),
  tables: document.querySelectorAll("main table").length,
  order: [...document.querySelectorAll("main [data-landing]")].map((e) => e.dataset.landing),
}));
check(
  landing.moments[0] === "metric" && landing.moments.length >= 6 && landing.titled && landing.tables === 0,
  `landing: one titled component per moment, metric card first, no tables (${JSON.stringify(landing)})`,
);
check(landing.order.join() === "moments,footer", `landing: the component moments, then the closing footer (${JSON.stringify(landing)})`);
// The OTP opens on 123456 (shown faintly in the boxes); the dial's number takes typing and glides there; the palette
// keeps its height while it filters.
await page.locator("[data-moment=otp] input").first().click();
await page.keyboard.type("123456");
await sleep(1600);
const otpOpen = await page.locator("[data-moment=otp] [aria-live]").textContent();
check(/Till open/.test(otpOpen ?? ""), `landing OTP: 123456 opens the till (${otpOpen})`);
await page.locator("[data-moment=dial] button[aria-label$='type a number']").click();
await page.keyboard.type("48");
await page.keyboard.press("Enter");
await sleep(1200);
check((await page.locator("[data-moment=dial] [role=slider]").getAttribute("aria-valuenow")) === "48", "landing dial: typing 48 glides the ruler to 48");
const palH = async () => (await page.locator("[data-moment=palette] > div").boundingBox())?.height;
const palBefore = await palH();
await page.locator("[data-moment=palette] [role=combobox][aria-label='Search commands']").fill("zzzz");
check((await palH()) === palBefore, `landing palette: filtering keeps its height (${palBefore})`);
await page.locator("[data-moment=palette] [role=combobox][aria-label='Search commands']").fill("sync");
check((await page.locator("[data-moment=palette] [role=option]").count()) === 1, "inline command palette filters");
await page.locator("[data-moment=palette] [role=combobox][aria-label='Search commands']").fill("");
await page.goto(BASE + "/ai", { waitUntil: "networkidle" });
// AI app (on /ai): the chat list is a sidebar left of the thread (240 to 280 px), the same height. The message box is one row,
// attach | text | send: both buttons one size, one inset on every side, a single text line centred on the buttons, and
// the radius is the button radius plus that inset (concentric). Three lines grow the box upward, buttons stay at the bottom.
const agent = await page.evaluate(async () => {
  const c = document.querySelector("[data-agent-app] [data-chats]").getBoundingClientRect();
  const t = document.querySelector("[data-agent-app] [data-thread]").getBoundingClientRect();
  const box = document.querySelector("[data-agent-app] [data-composer]");
  const ta = box.querySelector("textarea");
  const geo = () => {
    const b = box.getBoundingClientRect();
    const [a, z] = [...box.querySelectorAll("button")].map((x) => x.getBoundingClientRect());
    const tr = ta.getBoundingClientRect();
    return {
      b, a, z, tr,
      insets: [a.left - b.left, a.top - b.top, b.bottom - a.bottom, b.right - z.right, z.top - b.top, b.bottom - z.bottom].map(Math.round),
      centre: Math.abs(tr.top + tr.height / 2 - (a.top + a.height / 2)),
    };
  };
  const one = geo();
  const r = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius);
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  set.call(ta, "One\nTwo\nThree");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  const three = geo();
  set.call(ta, "");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  return {
    left: c.right <= t.left,
    chatsWidth: Math.round(c.width),
    sameHeight: Math.round(c.height) === Math.round(t.height),
    height: Math.round(t.height),
    insets: one.insets,
    centred: one.centre < 1,
    sameSize: one.a.width === one.z.width && one.a.height === one.z.height && one.a.width === one.a.height,
    concentric: Math.abs(r(box) - r(box.querySelector("button")) - one.insets[0]) < 0.6,
    grows: three.b.height > one.b.height + 20 && Math.round(three.b.bottom) === Math.round(one.b.bottom) && three.insets[2] === one.insets[2] && three.insets[5] === one.insets[5],
  };
});
check(
  agent.left && agent.chatsWidth >= 240 && agent.chatsWidth <= 280 && agent.sameHeight && agent.height >= 520 && agent.height <= 620 && new Set(agent.insets).size === 1 && agent.centred && agent.sameSize && agent.concentric && agent.grows,
  `AI band: chat sidebar left, thread right; composer one row, centred, concentric, grows up (${JSON.stringify(agent)})`,
);
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
phone.on("pageerror", (e) => errors.push(e.message));
await phone.goto(BASE + "/", { waitUntil: "networkidle" });
const pw = await phone.evaluate(() => [document.scrollingElement.scrollWidth, document.documentElement.clientWidth]);
check(pw[0] <= pw[1], `landing has no horizontal scroll on phone (${pw.join(" vs ")})`);
await phone.close();

// 360 px: no horizontal page scroll anywhere; the header stays on one line
const small = await (await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true })).newPage();
small.on("pageerror", (e) => errors.push(e.message));
for (const path of ["/", "/components", "/components/select", "/ai", "/ai/thinking-orbs", "/backgrounds", "/backgrounds/sand-field", "/examples/dashboard", "/examples/orders", "/encyclopedia", "/export"]) {
  await small.goto(BASE + path, { waitUntil: "networkidle" });
  const w = await small.evaluate(() => ({
    scroll: document.scrollingElement.scrollWidth,
    client: document.documentElement.clientWidth,
    logo: Math.round(document.querySelector("header [data-logo]").getBoundingClientRect().height),
  }));
  check(w.scroll <= w.client && w.logo <= 32, `360 ${path}: no horizontal scroll, logo on one line (${JSON.stringify(w)})`);
}
await small.close();
// Phone customize popover (a short phone, so it overflows): a touch scroll inside it never moves the page
const short = await (await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true })).newPage();
await short.goto(BASE + "/", { waitUntil: "networkidle" });
await short.locator("header button[aria-label=Customize]").tap();
await sleep(400);
const pop = await short.locator("[data-own-scroll]").boundingBox();
const cdp = await short.context().newCDPSession(short);
// Real touch events: Chromium 158's headless shell ignores synthesizeScrollGesture (nothing scrolls, the page neither).
const touchScroll = async (x, y, dy) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: Math.round(x), y: Math.round(y) }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: Math.round(x), y: Math.round(y - (dy * i) / 12) }] });
    await sleep(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(400);
};
const phoneScroll = () => short.evaluate(() => ({ page: Math.round(scrollY), box: Math.round(document.querySelector("[data-own-scroll]")?.scrollTop ?? -1) }));
// Start on the panel's own padding (a swipe that starts on a slider drags the slider); the second swipe is at the end.
await touchScroll(pop.x + 6, pop.y + pop.height * 0.8, 300);
await touchScroll(pop.x + 6, pop.y + pop.height * 0.8, 300);
const t1 = await phoneScroll();
const popW = await short.evaluate(() => { const b = document.querySelector("[data-own-scroll]"); return [b.scrollWidth, b.clientWidth]; });
check(t1.page === 0 && t1.box > 0 && popW[0] <= popW[1], `phone customize scrolls on its own, nothing clipped (${JSON.stringify({ ...t1, width: popW })})`);
await short.close();

// Dark by default, neutral (no blue tint in the page colour)
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const def = await page.evaluate(() => ({
  dark: document.documentElement.classList.contains("dark"),
  page: getComputedStyle(document.documentElement).getPropertyValue("--ad-page").trim(),
  brand: getComputedStyle(document.documentElement).getPropertyValue("--ad-brand").trim(),
}));
const rgb = def.page.match(/[0-9a-f]{2}/gi)?.map((h) => parseInt(h, 16)) ?? [];
check(def.dark && rgb.length === 3 && Math.max(...rgb) - Math.min(...rgb) <= 1, `dark and neutral by default (page ${def.page}, brand ${def.brand})`);

// One header: same box on every page
const boxes = new Set();
for (const path of ["/", "/components", "/ai", "/backgrounds", "/examples/dashboard", "/encyclopedia", "/export"]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  boxes.add(await page.evaluate(() => JSON.stringify([document.querySelector("header")?.getBoundingClientRect(), document.querySelector("header a")?.getBoundingClientRect()])));
}
check(boxes.size === 1, `header sits in the same place on every page${boxes.size === 1 ? "" : ` (${[...boxes].join(" vs ")})`}`);

// Inline edit, the spreadsheet way: the editing box is the resting box (same rect, same text right edge, no input
// scroll, the row keeps its height), "Rp" stays outside the input, digits regroup while typing, Esc reverts, Tab moves to
// the next cell, a bad value is refused with its message, Enter saves.
await page.goto(BASE + "/examples/products", { waitUntil: "networkidle" });
await sleep(800);
const price = page.locator('button[data-inline-edit][aria-label$=" price"]').first();
const ieRest = await price.evaluate((el) => ({
  box: el.getBoundingClientRect().toJSON(),
  text: el.querySelector("[data-value]").getBoundingClientRect().right,
  row: el.closest("tr").getBoundingClientRect().height,
  label: el.getAttribute("aria-label").replace(/^Edit /, ""),
  value: el.querySelector("[data-value]").textContent,
}));
await price.click({ position: { x: ieRest.box.width - 14, y: ieRest.box.height / 2 } });
await sleep(150);
const ieEdit = await page.evaluate(() => {
  const box = document.querySelector("[data-inline-edit][data-editing]");
  const input = box?.querySelector("input");
  return box && {
    box: box.getBoundingClientRect().toJSON(),
    // Where the typed digits really end: the input's left plus the drawn text width (the hidden [data-value] copy
    // could sit right while the visible text in a too-wide input sits left).
    text: (() => {
      const cs = getComputedStyle(input);
      const c = document.createElement("canvas").getContext("2d");
      c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      return input.getBoundingClientRect().left + c.measureText(input.value).width;
    })(),
    row: box.closest("tr").getBoundingClientRect().height,
    value: input.value,
    focused: document.activeElement === input,
    scroll: input.scrollLeft,
    prefix: box.textContent.startsWith("Rp"),
  };
});
const near = (a, b) => Math.abs(a - b) <= 0.5;
check(
  ieEdit && ["x", "y", "width", "height"].every((k) => near(ieEdit.box[k], ieRest.box[k])) && Math.abs(ieEdit.text - ieRest.text) <= 1 && ieEdit.row === ieRest.row && ieEdit.scroll === 0 && ieEdit.focused && /^\d{1,3}(\.\d{3})*$/.test(ieEdit.value) && ieEdit.prefix,
  `inline edit opens in place (${JSON.stringify({ ieRest, ieEdit })})`,
);
const ieInput = page.locator("[data-inline-edit][data-editing] input");
await ieInput.press("ControlOrMeta+a");
await ieInput.pressSequentially("1234567");
const grouped = await ieInput.inputValue();
await ieInput.press("Escape");
await sleep(100);
const reverted = await page.locator(`button[data-inline-edit][aria-label="Edit ${ieRest.label}"] [data-value]`).textContent();
check(grouped === "1.234.567" && reverted === ieRest.value && !(await page.locator("[data-inline-edit][data-editing]").count()), `inline edit regroups digits and Esc reverts (${grouped}, ${reverted})`);
await price.click();
await page.keyboard.press("Tab");
await sleep(150);
const tabbed = await page.evaluate(() => document.activeElement?.closest("[data-inline-edit]")?.querySelector("input")?.getAttribute("aria-label"));
check(tabbed === ieRest.label.replace(/ price$/, " stock"), `inline edit Tab saves and edits the next cell (${tabbed})`);
await page.keyboard.press("Escape");
await price.click();
await ieInput.press("ControlOrMeta+a");
await ieInput.pressSequentially("12a");
await ieInput.press("Enter");
await sleep(400);
const refused = await page.evaluate(() => ({ open: !!document.querySelector("[data-inline-edit][data-editing]"), tip: document.querySelector("[role=tooltip]")?.textContent }));
check(refused.open && refused.tip === "Numbers only", `inline edit refuses a bad value with its message (${JSON.stringify(refused)})`);
await ieInput.press("ControlOrMeta+a");
await ieInput.pressSequentially("150000");
await ieInput.press("Enter");
await sleep(300);
const savedText = await page.locator(`button[data-inline-edit][aria-label="Edit ${ieRest.label}"] [data-value]`).textContent();
check(savedText === "150.000", `inline edit Enter saves (${savedText})`);

// Anchored pop-up triggers keep their size while pressed: a menu is placed against its trigger, so a press-shrink nudged
// the open menu on the click that closes it. Every anchored trigger on Orders (Shop, Status, Columns, …) stays at scale
// none under the mouse, and the open Columns menu doesn't move when its trigger is pressed again. Dialog triggers aren't
// anchored, so they still press to 0.97.
await page.goto(BASE + "/examples/orders", { waitUntil: "networkidle" });
await sleep(600);
const triggers = page.locator('#content :is([data-ad-anchor], [aria-haspopup="menu"], [aria-haspopup="listbox"], [role="combobox"]):visible');
const pressed = [];
for (let i = 0; i < (await triggers.count()); i++) {
  const t = triggers.nth(i);
  const b = await t.boundingBox();
  if (!b) continue;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await sleep(180);
  pressed.push(await t.evaluate((el) => `${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 16)}:${getComputedStyle(el).scale}`));
  await page.mouse.up();
  await page.keyboard.press("Escape");
  await sleep(250);
}
check(pressed.length >= 3 && pressed.every((p) => p.endsWith(":none")), `pop-up triggers don't shrink on press (${pressed.join(", ")})`);
const colsBtn = page.locator('#content button[aria-haspopup]:has-text("Columns")').first();
await colsBtn.click();
await sleep(400);
const menuAt = () => page.evaluate(() => document.querySelector("[data-radix-popper-content-wrapper]")?.getBoundingClientRect().toJSON() ?? null);
const menuOpen = await menuAt();
const cb = await colsBtn.boundingBox();
await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
await page.mouse.down();
await sleep(60);
const menuPressed = await menuAt();
await page.mouse.up();
await page.keyboard.press("Escape");
check(menuOpen && (!menuPressed || (near(menuOpen.x, menuPressed.x) && near(menuOpen.y, menuPressed.y))), `Columns menu stays put when its trigger is pressed again (${JSON.stringify({ menuOpen, menuPressed })})`);
await page.goto(BASE + "/components/dialog", { waitUntil: "networkidle" });
const dlgTrigger = page.locator('[data-stage] [aria-haspopup="dialog"]:not([data-ad-anchor]):visible').first();
const db = await dlgTrigger.boundingBox();
await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2);
await page.mouse.down();
await sleep(250);
const dlgScale = await dlgTrigger.evaluate((el) => getComputedStyle(el).scale);
await page.mouse.move(0, 0);
await page.mouse.up();
await page.keyboard.press("Escape");
check(dlgScale === "0.97", `a Dialog trigger still presses to 0.97 (${dlgScale})`);

// Nav tabs: Components first, then AI, Backgrounds, Examples, Encyclopedia, Export; the current section is highlighted
await page.goto(BASE + "/components/button", { waitUntil: "networkidle" });
const tabs = await page.evaluate(() => {
  const nav = document.querySelector("header nav[aria-label=Sections]");
  return { labels: [...nav.querySelectorAll("a")].map((a) => a.textContent), active: nav.querySelector("[aria-current=page]")?.textContent };
});
check(tabs.labels.join() === "Components,AI,Backgrounds,Examples,Encyclopedia,Export" && tabs.active === "Components", `header tabs (${JSON.stringify(tabs)})`);

// Encyclopedia: every rule renders as a row, search filters them (and the URL keeps it), a row opens to its why/how/check,
// a rule with a demo shows it, and a search with no match shows the empty state.
await page.goto(BASE + "/encyclopedia", { waitUntil: "networkidle" });
const enc = async () =>
  page.evaluate(() => ({ rows: document.querySelectorAll("[data-encyclopedia] [data-rule]").length, count: document.querySelector("[data-rule-count]")?.textContent }));
const encAll = await enc();
check(encAll.rows >= 200 && encAll.count === String(encAll.rows), `encyclopedia renders every rule (${JSON.stringify(encAll)})`);
await page.getByRole("searchbox", { name: "Search rules" }).fill("tabular");
// The list filters at once; the URL is written once typing stops.
await page.waitForURL(/q=tabular/, { timeout: 3000 }).catch(() => {});
const encQ = await enc();
check(encQ.rows > 0 && encQ.rows < encAll.rows && encQ.count === `${encQ.rows} of ${encAll.rows}` && page.url().includes("q=tabular"), `encyclopedia search filters rules (${JSON.stringify(encQ)}, ${page.url()})`);
await page.locator('[data-rule="type.tabular-nums"]').click();
await sleep(400);
const encOpen = await page.evaluate(() => {
  const body = document.querySelector('[data-rule="type.tabular-nums"]').closest("h3").parentElement;
  return { text: body.textContent.includes("Check") && body.textContent.includes("Why"), demo: !!body.querySelector("[data-demo]") };
});
check(encOpen.text && encOpen.demo, `encyclopedia row opens to why/how/check with its demo (${JSON.stringify(encOpen)})`);
await page.getByRole("searchbox", { name: "Search rules" }).fill("zzqx-no-such-rule");
await sleep(300);
check((await enc()).rows === 0 && (await page.getByText("No rules match").isVisible()), "encyclopedia search with no match shows the empty state");

// Components page: every component live in category bento tiles (each exactly once); a component's chip opens its sliders.
await page.goto(BASE + "/components", { waitUntil: "networkidle" });
const index = await page.evaluate(() => ({
  spots: document.querySelectorAll("[data-spot]").length,
  missing: (document.querySelector("[data-components]")?.dataset.components.split(",") ?? ["(no list)"]).filter((n) => document.querySelectorAll(`[data-spot="${n}"]`).length !== 1),
  groups: [...document.querySelectorAll("[data-group]")].map((g) => g.dataset.group),
  tiles: document.querySelectorAll("[data-fit], [inert] [data-spot]").length,
}));
check(index.spots >= 60 && index.missing.length === 0 && index.groups[0] === "Foundations" && index.tiles === 0, `components page: every component live exactly once, in category bento tiles (${JSON.stringify(index)})`);
// Like a person: centre it (clear of the sticky header), hover it, then move up onto its chip and click.
await page.locator("[data-spot=select]").evaluate((el) => el.scrollIntoView({ block: "center" }));
await sleep(300);
const selBox = await page.locator("[data-spot=select]").boundingBox();
await page.mouse.move(selBox.x + selBox.width / 2, selBox.y + selBox.height / 2);
await sleep(300);
const chipBox = await page.locator("[data-spot=select] > a").boundingBox();
await page.mouse.move(selBox.x + 12, selBox.y + 2, { steps: 4 });
await page.mouse.move(chipBox.x + chipBox.width / 2, chipBox.y + chipBox.height / 2, { steps: 4 });
await page.mouse.down();
await page.mouse.up();
await page.waitForURL("**/components/select*");
check(await page.locator("[data-stage]").waitFor({ timeout: 4000 }).then(() => true, () => false), "a spot opens its component page");
await page.goto(BASE + "/ai", { waitUntil: "networkidle" });
await page.locator("[data-spot=thinking-orbs] > a").click();
await page.waitForURL("**/ai/thinking-orbs*");
await page.locator("[role=slider][aria-label=Size]").focus();
for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
const orbBox = await page.evaluate(() => Math.round(document.querySelector("[data-stage] canvas").parentElement.getBoundingClientRect().width));
check(orbBox === 32, `orb size slider resizes the orbs (${orbBox} px)`);

// Footer: the credit on every page (the landing's closing card carries it), body size, one footer per page
for (const path of ["/", "/components", "/ai", "/export"]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const f = await page.evaluate(() => {
    const footers = document.querySelectorAll("footer");
    const credit = [...(footers[0]?.querySelectorAll("p") ?? [])].find((p) => p.textContent.includes("Curated by"));
    const body = getComputedStyle(document.documentElement).getPropertyValue("--ad-text-body").trim();
    return { count: footers.length, text: credit?.innerText.trim(), href: credit?.querySelector("a")?.getAttribute("href"), size: credit && getComputedStyle(credit).fontSize, body };
  });
  check(f.count === 1 && f.text === "Curated by Joshua Dirga · 2026" && f.href === "https://joshuadirga.com" && f.size === f.body, `${path} footer credit (${JSON.stringify(f)})`);
}

// The customize tab never covers the page at tablet width
const tablet = await (await browser.newContext({ viewport: { width: 768, height: 900 } })).newPage();
for (const path of ["/", "/components", "/examples/dashboard"]) {
  await tablet.goto(BASE + path, { waitUntil: "networkidle" });
  const g = await tablet.evaluate(() => ({ flap: Math.round(document.querySelector("[data-customize-flap]").getBoundingClientRect().right), logo: Math.round(document.querySelector("header [data-logo]").getBoundingClientRect().left), main: Math.round(document.querySelector("main h1")?.getBoundingClientRect().left ?? 999) }));
  check(g.flap + 4 <= g.logo && g.flap + 4 <= g.main, `768 ${path}: customize tab clear of the page (${JSON.stringify(g)})`);
}
await tablet.close();

// Every example nav item opens a real page
await page.goto(BASE + "/examples/dashboard", { waitUntil: "networkidle" });
for (const label of ["Products", "Promotions", "Cancellations", "Team"]) {
  await page.click(`nav a:has-text('${label}')`);
  await page.waitForURL(`**/examples/${label.toLowerCase()}*`);
  const ok = await page.locator(`h1:text-is('${label}')`).waitFor({ timeout: 4000 }).then(() => true, () => false);
  check(ok, `sidebar ${label} opens its page`);
}

// Command palette opens with Ctrl+K
await page.goto(BASE + "/components", { waitUntil: "networkidle" });
await page.keyboard.press("Control+k");
await sleep(200);
check(await page.locator("[role=listbox] >> text=Fee row").isVisible(), "Ctrl+K opens the command palette");
await page.keyboard.press("Escape");

// Config travels in the URL and restyles tokens
await page.goto(`${BASE}/?r=20&c=r&a=d9622b&t=l`, { waitUntil: "networkidle" });
const vars = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return { r: s.getPropertyValue("--ad-radius-control").trim(), brand: s.getPropertyValue("--ad-brand").trim(), dark: document.documentElement.classList.contains("dark") };
});
check(vars.r === "20px" && !vars.dark, `URL config applies (radius ${vars.r}, light ${!vars.dark})`);
check((await page.getAttribute("a:has-text('Explore components')", "href"))?.includes("r=20"), "links carry the settings");

// Select opens and picks
await page.goto(`${BASE}/components/select`, { waitUntil: "networkidle" });
await page.click("[data-stage] [aria-haspopup=listbox]");
await page.click("[role=option]:has-text('Dago')");
check(await page.locator("[data-stage] [aria-haspopup=listbox]:has-text('Dago')").isVisible(), "select picks an option");

// Menu: submenu opens on click and on keyboard
await page.goto(`${BASE}/components/menu`, { waitUntil: "networkidle" });
await page.click("main button:has-text('Actions')");
await page.click("[role=menuitem]:has-text('Move to')");
check(await page.locator("[role=menuitem]:has-text('To pack')").isVisible(), "submenu opens on click");
// Start from a closed menu. Escape closes one level at a time, and a pointer resting on "Move to" would reopen the submenu.
await page.mouse.move(0, 0);
for (let i = 0; i < 4 && (await page.locator("[role=menu]").count()); i++) {
  await page.keyboard.press("Escape");
  await sleep(100);
}
await page.locator("[role=menu]").first().waitFor({ state: "detached", timeout: 5000 });
await page.focus("main button:has-text('Actions')");
await page.keyboard.press("Enter");
// The menu takes focus on the frame after it opens; keys pressed before that go to the trigger.
await page.waitForFunction(() => document.activeElement?.closest("[role=menu]"), null, { timeout: 5000 });
for (let i = 0; i < 8 && !(await page.evaluate(() => document.activeElement?.textContent?.startsWith("Move to"))); i++) await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowRight");
const viaKey = await page.locator("[role=menuitem]:has-text('To pack')").waitFor({ timeout: 2000 }).then(() => true, () => false);
check(viaKey, `submenu opens with ArrowRight (focused: ${await page.evaluate(() => document.activeElement?.textContent?.slice(0, 30))})`);

// Orders: row click opens the pane, pager moves
await page.goto(`${BASE}/examples/orders`, { waitUntil: "networkidle" });
await page.click("tbody tr >> nth=0");
check(await page.locator("[role=dialog] >> text=You receive").isVisible(), "row click opens the side pane");
check(await page.locator("text=1–50 of").isVisible(), "table bar shows count");

// Settings: editing shows the save bar
await page.goto(`${BASE}/examples/settings`, { waitUntil: "networkidle" });
await page.fill("input[aria-label='Shop name']", "Rimba Home");
check(await page.locator("text=Unsaved changes").isVisible(), "save bar appears on edit");

// Keyboard path: the first Tab lands on "Skip to content"; tabbing on never opens the Customize flap.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.mouse.move(1000, 450);
await page.keyboard.press("Tab");
const firstTab = await page.evaluate(() => document.activeElement?.textContent?.trim());
for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
await sleep(400);
const flapAfterTabs = await page.locator("[data-customize-panel]").getAttribute("data-state");
check(firstTab === "Skip to content" && flapAfterTabs === "closed", `Tab 1 focuses the skip link, the flap stays closed (${firstTab}, ${flapAfterTabs})`);

// No link inside a link (two tab stops, read twice): the example sidebar rows are one link each.
await page.goto(BASE + "/examples/orders", { waitUntil: "networkidle" });
check((await page.locator("a a").count()) === 0, "no nested links on /examples/orders");

// Each page names itself in the tab.
await page.goto(BASE + "/components/button", { waitUntil: "networkidle" });
check((await page.title()) === "Button · Alora Design", `document title on /components/button (${await page.title()})`);

// Pagination arrows say where they go.
await page.goto(BASE + "/components/pagination", { waitUntil: "networkidle" });
const pagerLabels = await page.evaluate(() => [...document.querySelectorAll('[data-stage] nav[aria-label="Pages"] button[aria-label]')].map((b) => b.getAttribute("aria-label")));
check(pagerLabels.includes("Previous page, 3") && pagerLabels.includes("Next page, 5"), `pagination arrows name their page (${JSON.stringify(pagerLabels)})`);

// /components: a full scroll-through mounts every tile and none throws.
const beforeScroll = errors.length;
await page.goto(BASE + "/components", { waitUntil: "networkidle" });
for (let y = 0, h = await page.evaluate(() => document.documentElement.scrollHeight); y < h; y += 700) {
  await page.evaluate((top) => scrollTo(0, top), y);
  await sleep(120);
}
await sleep(400);
check(errors.length === beforeScroll, `no page errors on /components after a scroll-through${errors.length > beforeScroll ? `: ${errors.slice(beforeScroll, beforeScroll + 3).join(" | ")}` : ""}`);

check(errors.length === 0, `no page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`);
// The shadcn-parity components: each detail page renders its title and stage without errors (the Components page
// check above covers showing each one live exactly once).
const MORE = ["button-group", "textarea", "input-group", "input-otp", "label", "calendar", "toggle", "data-table", "item", "accordion", "collapsible", "carousel", "aspect-ratio", "typography", "chart", "line-chart", "area-chart", "pie-chart", "radar-chart", "radial-chart", "breadcrumb", "navigation-menu", "menubar", "pagination", "alert-dialog", "resizable", "scroll-area", "message", "message-scroller", "marker", "trace", "attachment", "questionnaire", "code-block", "number-dial", "password-input", "theme-switch", "step-form", "brush", "prompt-suggestions", "streaming-text", "citation", "proposed-change", "reactions"];
const before = errors.length;
for (const name of MORE) {
  await page.goto(`${BASE}/components/${name}`, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => ({ h1: document.querySelector("main h1, h1")?.textContent, stage: !!document.querySelector("[data-stage]")?.children.length }));
  check(!!r.h1 && r.stage && !/No component/.test(r.h1), `/components/${name} renders (${r.h1})`);
}
check(errors.length === before, `new component pages throw nothing (${errors.slice(before, before + 3).join(" | ")})`);
// The motion set: the dial steps by key and by typing, the password flags a common one at once and a short one only
// after leaving the field, the step form shows what is missing instead of moving on, and a table row moves the chart.
await page.goto(BASE + "/components/number-dial", { waitUntil: "networkidle" });
const dial = page.locator("[data-stage] [role=slider]");
await dial.focus();
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
const dialAfterKeys = await dial.getAttribute("aria-valuenow");
await page.keyboard.type("42");
await sleep(150);
check(dialAfterKeys === "26" && (await dial.getAttribute("aria-valuenow")) === "42", `number dial: arrows step, typing sets (${dialAfterKeys}, ${await dial.getAttribute("aria-valuenow")})`);
await page.goto(BASE + "/components/password-input", { waitUntil: "networkidle" });
const pwField = page.locator("[data-stage] input[autocomplete=new-password]");
await pwField.fill("kopi");
const earlyError = await page.locator("[data-stage] [role=status]").count();
await pwField.blur();
const lateError = await page.locator("[data-stage] >> text=Use 8 or more characters").isVisible();
await pwField.fill("Password1!");
const common = await page.locator("[data-stage] >> text=This password is too common").isVisible();
check(earlyError === 0 && lateError && common, `password: no error while typing, short after leaving, common at once (${earlyError}, ${lateError}, ${common})`);
await page.goto(BASE + "/components/step-form", { waitUntil: "networkidle" });
await page.click("[data-stage] button[type=submit]");
const stayed = await page.locator("[data-stage] >> text=Choose who you’re ordering from").isVisible();
await page.fill("#po-supplier", "Keramik Plered");
await page.click("[data-stage] button[type=submit]");
await sleep(400);
check(stayed && (await page.locator("[data-stage] >> text=Piring keramik 24 cm").isVisible()), `step form: Next shows the missing field, then moves on (${stayed})`);
await page.goto(BASE + "/components/brush", { waitUntil: "networkidle" });
const row = page.locator("[data-stage] tbody tr").nth(2);
await row.hover();
await sleep(150);
const linkedTip = await page.locator("[data-stage] [role=status]").first().innerText().catch(() => "");
const rowDay = await row.locator("td").first().innerText();
check(linkedTip.includes(rowDay), `linked highlight: hovering a row shows that day on the chart (${JSON.stringify(rowDay)} in ${JSON.stringify(linkedTip)})`);

// Line chart: hovering shows one tooltip with every series.
await page.goto(BASE + "/components/line-chart", { waitUntil: "networkidle" });
const svg = page.locator("[data-stage] figure svg").first();
const sb = await svg.boundingBox();
await page.mouse.move(sb.x + sb.width * 0.6, sb.y + sb.height / 2);
await sleep(200);
const tip = await page.locator("[data-stage] [role=status]").first().innerText().catch(() => "");
check(/This fortnight/.test(tip) && /The one before/.test(tip), `line chart crosshair tooltip lists both series (${JSON.stringify(tip)})`);

// Switch: the thumb sits centred. Its inset from the track is equal (±0.5 px) on top, bottom, left (off) and right
// (on), and every size and inset is a whole pixel so the paint snaps the same on each side. Both sizes, two font sizes
// (the root font is the body size, so rem-based sizes would land on fractions).
for (const size of ["default", "lg"]) {
  for (const f of [13, 15]) {
    await page.goto(`${BASE}/components/switch?size=${size}&f=${f}`, { waitUntil: "networkidle" });
    const sw = page.locator("[data-stage] button[role=switch]");
    const n = await sw.count();
    const measure = () =>
      sw.evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          const t = e.firstElementChild.getBoundingClientRect();
          const on = e.dataset.state === "checked";
          return { on, w: r.width, h: r.height, d: t.width, top: t.top - r.top, bottom: r.bottom - t.bottom, side: on ? r.right - t.right : t.left - r.left };
        }),
      );
    const states = await measure();
    for (let i = 0; i < n; i++) await sw.nth(i).click();
    await sleep(400);
    states.push(...(await measure()));
    const bad = states.filter((s) => {
      const ins = [s.top, s.bottom, s.side];
      const whole = [s.w, s.h, s.d, ...ins].every((v) => Math.abs(v - Math.round(v)) < 0.02);
      return Math.max(...ins) - Math.min(...ins) > 0.5 || !whole;
    });
    const seen = [...new Set(states.map((s) => `${s.on ? "on" : "off"} ${s.top}/${s.bottom}/${s.side}`))].join(", ");
    check(n > 0 && states.some((s) => s.on) && states.some((s) => !s.on) && bad.length === 0, `switch ${size} f=${f}: thumb insets equal, whole px (${seen})`);
  }
}

// Sliding pill: picking another option slides one shared fill there (in-between positions on the way), it ends exactly
// on the choice, and on load it already sits on the chosen option. Segmented, chip group, single toggle group, pagination.
await page.goto(BASE + "/components/sliding-pill", { waitUntil: "networkidle" });
const pillCases = [
  ["Segmented", '[role=radiogroup][aria-label="Range"]', "Month", '[aria-checked="true"]'],
  ["chip group", '[role=group][aria-label="Order status"]', "Shipped", '[aria-pressed="true"]'],
  ["toggle group", '[aria-label="View"]', "Board", '[data-state="on"]'],
  ["pagination", 'nav[aria-label="Pages"] > div', "4", '[aria-current="page"]'],
];
for (const [label, host, pick, sel] of pillCases) {
  const h = page.locator(`[data-stage] ${host}`).first();
  const at = () =>
    h.evaluate((el, sel) => {
      const p = el.querySelector("[data-sliding-pill]").getBoundingClientRect();
      const o = el.querySelector(sel).getBoundingClientRect();
      return { p: Math.round(p.left * 10) / 10, o: Math.round(o.left * 10) / 10, w: Math.abs(p.width - o.width) < 0.6 };
    }, sel);
  const rest = await at();
  // Sample the pill every frame from the click on, in the page, so the samples are not slowed by the test.
  const sampling = h.evaluate(
    (el) =>
      new Promise((done) => {
        const xs = [];
        const t0 = performance.now();
        const f = () => (xs.push(el.querySelector("[data-sliding-pill]").getBoundingClientRect().left), performance.now() - t0 < 500 ? requestAnimationFrame(f) : done(xs));
        requestAnimationFrame(f);
      }),
  );
  await h.getByRole(label === "Segmented" ? "radio" : label === "toggle group" ? "radio" : "button", { name: pick, exact: true }).click();
  const xs = await sampling;
  const end = await at();
  const mid = xs.filter((x) => Math.abs(x - rest.p) > 1 && Math.abs(x - end.o) > 1).length;
  check(Math.abs(rest.p - rest.o) < 0.6 && rest.w && Math.abs(end.p - end.o) < 0.6 && end.w && mid >= 2, `sliding pill ${label}: starts on the choice, slides (${mid} frames between), lands on ${pick} (${JSON.stringify({ rest, end })})`);
}

// Mobile: the Desktop | Mobile split, every mobile page at a 390 px phone viewport (renders, no sideways scroll,
// every touch target at least 44 × 44), and the gestures (tab pill, sheet drag-to-dismiss, swipe row, pull to refresh,
// snackbar above the tab bar, action bar above the keyboard). Old names redirect to their mobile replacement.
const MOBILE = ["mobile-tab-bar", "mobile-nav-bar", "mobile-action-bar", "mobile-list", "mobile-swipe-row", "mobile-pull-refresh", "mobile-list-skeleton", "mobile-empty-state", "mobile-sheet", "mobile-action-sheet", "mobile-date-picker", "mobile-segmented", "mobile-search-bar", "mobile-stepper", "mobile-snackbar"];
// Mobile v2: the rest of the set, and every screen of the example app (with its forced states) at /mobile/app/<screen>.
const MOBILE_2 = ["mobile-filter-chips", "mobile-top-tabs", "mobile-choice-rows", "mobile-person-row", "mobile-index-list", "mobile-picker-sheet", "mobile-multi-select", "mobile-date-range", "mobile-context-menu", "mobile-modal", "mobile-alert", "mobile-text-field", "mobile-keypad", "mobile-slider", "mobile-photo-picker", "mobile-scanner", "mobile-signature", "mobile-otp", "mobile-stat-tiles", "mobile-kpi-carousel", "mobile-scrub-chart", "mobile-timeline", "mobile-steps", "mobile-receipt", "mobile-badge", "mobile-banner", "mobile-upload-row", "mobile-onboarding", "mobile-chat"];
MOBILE.push(...MOBILE_2);
const APP_SCREENS = ["home", "notifications", "search", "reports", "orders", "order", "delivery", "products", "product", "product-edit", "stock-count", "inbox", "chat", "assistant", "more", "customers", "customer", "pos", "pos-pay", "pos-receipt", "approvals", "schedule", "settings", "account", "login", "otp", "onboarding"];
const APP_STATES = ["home?state=offline", "notifications?state=empty", "search?state=empty", "reports?state=error", "approvals?state=empty"];
await page.goto(BASE + "/mobile", { waitUntil: "networkidle" });
const mobIndex = await page.evaluate(() => ({
  tab: document.querySelector('header a[aria-current="page"]')?.textContent,
  sw: document.querySelector('[role=radiogroup][aria-label="Platform"] [aria-checked="true"]')?.textContent,
  tiles: document.querySelectorAll("[data-mobile-screen-tile]").length,
  parts: [...new Set([...document.querySelectorAll("[data-mobile-part]")].map((a) => a.dataset.mobilePart))],
}));
check(mobIndex.tab === "Components" && /Mobile/.test(mobIndex.sw ?? ""), `/mobile: Components tab lit, switch on Mobile (${JSON.stringify({ tab: mobIndex.tab, sw: mobIndex.sw })})`);
// mobile-upload-row has its own page but no overview screen uses it (delivery photos upload in the photo strip).
const tiled = MOBILE.filter((n) => n !== "mobile-upload-row");
check(mobIndex.tiles === 21 && tiled.every((n) => mobIndex.parts.includes(n)), `/mobile links every mobile component from its screens (${mobIndex.tiles} tiles; missing: ${tiled.filter((n) => !mobIndex.parts.includes(n)).join(", ") || "none"})`);
check(await page.locator('a[data-all-screens][href^="/mobile/screens"]').count(), "/mobile links to the screens gallery");
await page.goto(BASE + "/mobile/screens", { waitUntil: "networkidle" });
const gallery = await page.evaluate(() => ({
  tiles: [...document.querySelectorAll("[data-screen-tile]")].map((t) => t.querySelector("a")?.getAttribute("href")),
  tab: document.querySelector('header a[aria-current="page"]')?.textContent,
}));
const wantTiles = [...APP_SCREENS.map((s) => `/mobile/app/${s}`), ...APP_STATES.map((s) => `/mobile/app/${s}`)];
check(gallery.tiles.length === wantTiles.length && wantTiles.every((h) => gallery.tiles.some((t) => t?.split("&")[0].startsWith(h))) && gallery.tab === "Components", `/mobile/screens: a live phone per screen and state, each linking to its full-screen route (${gallery.tiles.length}/${wantTiles.length})`);
await page.locator('[role=radiogroup][aria-label="Platform"] [role=radio]').first().click();
await page.waitForURL(/\/components$/);
check(true, "platform switch goes back to Desktop");
for (const [from, to] of [["/components/mobile-sheet", "/mobile/mobile-sheet"]]) {
  await page.goto(BASE + from, { waitUntil: "networkidle" });
  check(new URL(page.url()).pathname === to, `${from} redirects to ${to} (${new URL(page.url()).pathname})`);
}

const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const ph = await phoneCtx.newPage();
const phErrors = [];
ph.on("pageerror", (e) => phErrors.push(e.message));
/** Interactive things smaller than 44 × 44 inside the phone (layout size, so the frame's scale doesn't count). */
const smallTargets = () =>
  ph.evaluate(() => {
    // The full-screen app owns the page, so its sheets and modals (portalled to <body>) count too.
    const root = document.querySelector("[data-phone-screen]") ?? (document.querySelector("[data-mobile-app]") ? document.body : null);
    if (!root) return ["(no phone)"];
    const seen = [];
    for (const el of root.querySelectorAll("button, a[href], input, textarea, [role=radio], [role=option], [role=switch], [role=tab]")) {
      if (el.closest("[aria-hidden=true]") || !el.offsetParent || getComputedStyle(el).visibility === "hidden") continue;
      const box = el.getAttribute("role") === "switch" ? el.closest("label") ?? el : el;
      if (box.offsetWidth < 44 || box.offsetHeight < 44) seen.push(`${el.tagName.toLowerCase()}:${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 18)} ${box.offsetWidth}x${box.offsetHeight}`);
    }
    return [...new Set(seen)].slice(0, 6);
  });
for (const path of ["/mobile", "/mobile/app", "/mobile/screens", ...MOBILE.map((n) => `/mobile/${n}`), ...APP_SCREENS.map((s) => `/mobile/app/${s}`), ...APP_STATES.map((s) => `/mobile/app/${s}`)]) {
  phErrors.length = 0;
  await ph.goto(BASE + path, { waitUntil: "networkidle" });
  await sleep(path.startsWith("/mobile/app") ? 900 : 300);
  const r = await ph.evaluate(() => ({
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    phone: !!(document.querySelector("[data-phone-screen]") ?? document.querySelector("[data-mobile-app]")),
    // The phone itself fits the page (it scales down; nothing of it is cut off on the right).
    cut: Math.max(0, ...[...document.querySelectorAll("[data-phone-screen]")].map((f) => Math.round(f.getBoundingClientRect().right - document.documentElement.clientWidth))),
  }));
  const small = await smallTargets();
  // mobile.input-16px: no field on a phone zooms the page when focused.
  const tiny = await ph.evaluate(() =>
    [...document.querySelectorAll("[data-phone-screen] input, [data-phone-screen] textarea, [data-mobile-app] input, [data-mobile-app] textarea, body > [role=dialog] input")]
      // Only fields that take text zoom the page; Radix adds a hidden checkbox input for a Switch inside a form.
      .filter((el) => !["file", "checkbox", "radio", "range", "hidden"].includes(el.type) && parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => el.getAttribute("aria-label") || el.id || el.type)
      .slice(0, 3),
  );
  check(!phErrors.length && r.over <= 0 && r.cut === 0 && r.phone && small.length === 0 && tiny.length === 0, `390 px ${path}: renders, no sideways scroll, touch targets ≥ 44, inputs ≥ 16 px (${JSON.stringify({ ...r, errors: phErrors.slice(0, 2), small, tiny })})`);
}
await phoneCtx.close();

// Gestures, on the detail pages at desktop width (phone frame at full scale).
const drag = async (from, dx, dy, steps = 12) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await sleep(14);
  }
  await page.mouse.up();
};
const centre = async (loc) => {
  const b = await loc.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};
await page.goto(BASE + "/mobile/mobile-tab-bar", { waitUntil: "networkidle" });
await page.locator("[data-mobile-tab-bar] button", { hasText: "Products" }).click();
await sleep(600);
const tabPill = await page.evaluate(() => {
  const p = document.querySelector("[data-mobile-tab-bar] [data-sliding-pill]").getBoundingClientRect();
  const t = document.querySelector('[data-mobile-tab-bar] [aria-current="page"]').getBoundingClientRect();
  return { d: Math.round(Math.abs(p.left - t.left)), title: document.querySelector("[data-phone-screen] h1")?.textContent };
});
check(tabPill.d <= 1 && tabPill.title === "Products", `tab bar: the pill lands on the tapped tab and its screen opens (${JSON.stringify(tabPill)})`);

await page.goto(BASE + "/mobile/mobile-sheet", { waitUntil: "networkidle" });
await page.locator("[data-phone-screen] [role=listitem] button").first().click();
await sleep(700);
const sheetOpen = await page.evaluate(() => {
  const d = document.querySelector("[data-phone-screen] [role=dialog]");
  const f = document.querySelector("[data-phone-screen]").getBoundingClientRect();
  const btn = [...(d?.querySelectorAll("button") ?? [])].find((b) => /^Use /.test(b.textContent));
  const bb = btn?.getBoundingClientRect();
  return { open: !!d, footerVisible: !!bb && bb.bottom <= f.bottom - 30 && bb.top >= f.top };
});
check(sheetOpen.open && sheetOpen.footerVisible, `sheet opens at its half detent with the footer button on screen (${JSON.stringify(sheetOpen)})`);
await drag(await centre(page.locator("[data-phone-screen] [role=dialog] .cursor-grab").first()), 0, 320);
await sleep(700);
check(!(await page.locator("[data-phone-screen] [role=dialog]").count()), "sheet: dragging the handle down closes it");

await page.goto(BASE + "/mobile/mobile-swipe-row", { waitUntil: "networkidle" });
const swipeRow = page.locator("[data-phone-screen] [role=listitem]").first();
const rc = await centre(swipeRow);
await drag({ x: rc.b.x + rc.b.width * 0.6, y: rc.y }, -150, 0);
await sleep(600);
const swiped = await swipeRow.evaluate((el) => ({ t: el.parentElement.style.transform, packed: [...el.closest(".overflow-hidden").querySelectorAll("button")].some((b) => b.textContent.includes("Packed") && getComputedStyle(b.parentElement).visibility === "visible") }));
check(/translate3d\(-1[45]\d/.test(swiped.t) && swiped.packed, `swipe row: a left swipe opens its actions (${JSON.stringify(swiped)})`);

await page.goto(BASE + "/mobile/mobile-pull-refresh", { waitUntil: "networkidle" });
await drag(await centre(page.locator("[data-phone-screen] [role=listitem]").first()), 0, 220, 16);
await sleep(250);
check(await page.locator('[data-phone-screen] [role=status][aria-label="Refreshing"]').count(), "pull to refresh: a long pull starts a refresh (dots, no spinner)");

await page.goto(BASE + "/mobile/mobile-snackbar", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Mark .* packed/ }).first().click();
await sleep(600);
const snack = await page.evaluate(() => {
  const s = document.querySelector("[data-phone-screen] [role=status]")?.getBoundingClientRect();
  const t = document.querySelector("[data-mobile-tab-bar]").getBoundingClientRect();
  return s ? { above: s.bottom <= t.top - 4, text: document.querySelector("[data-phone-screen] [role=status]").textContent } : null;
});
check(snack?.above && /packed/.test(snack.text) && /Undo/.test(snack.text), `snackbar sits above the tab bar with Undo (${JSON.stringify(snack)})`);

await page.goto(BASE + "/mobile/mobile-action-bar?keyboard=1", { waitUntil: "networkidle" });
await sleep(400);
const bar = await page.evaluate(() => {
  const a = document.querySelector("[data-mobile-action-bar]").getBoundingClientRect();
  const f = document.querySelector("[data-phone-screen]").getBoundingClientRect();
  return { gap: Math.round(f.bottom - a.bottom) };
});
check(bar.gap >= 291, `action bar rides above the keyboard (${JSON.stringify(bar)})`);


// Mobile v2 gestures and flows (desktop width, phone frames at full scale).
// The example app: every tab opens its own screen; a row pushes its detail in from the right; Back slides it out.
await page.goto(BASE + "/mobile/app", { waitUntil: "networkidle" });
const topScreen = () => page.evaluate(() => [...document.querySelectorAll("[data-app-screen]:not([aria-hidden])")].filter((e) => getComputedStyle(e.parentElement).visibility !== "hidden").map((e) => e.dataset.appScreen).pop());
const tabsOk = [];
for (const [label, id] of [["Orders", "orders"], ["Products", "products"], ["Inbox", "inbox"], ["More", "more"], ["Home", "home"]]) {
  await page.locator("[data-mobile-tab-bar] button", { hasText: label }).click();
  await sleep(250);
  tabsOk.push((await topScreen()) === id ? id : `${label}→${await topScreen()}`);
}
check(tabsOk.every((t) => !t.includes("→")), `app: each tab opens its own screen (${tabsOk.join(", ")})`);
await page.locator("[data-mobile-tab-bar] button", { hasText: "Orders" }).click();
await sleep(1000);
await page.locator('[data-app-screen="orders"] [role=listitem] button').first().click();
await sleep(80);
const pushing = await page.evaluate(() => getComputedStyle(document.querySelector('[data-app-screen="order"]')).animationName);
await sleep(500);
const pushedApp = { top: await topScreen(), bar: await page.evaluate(() => getComputedStyle(document.querySelector("[data-mobile-tab-bar]").parentElement).opacity) };
check(pushing === "ad-push-in" && pushedApp.top === "order" && pushedApp.bar === "0", `app: an order slides in from the right and the tab bar steps away (${JSON.stringify({ pushing, ...pushedApp })})`);
await page.locator('[data-app-screen="order"] header button').first().click();
await sleep(500);
check((await topScreen()) === "orders" && !(await page.locator('[data-app-screen="order"]').count()), "app: Back slides the order out and the list is on top again");

// Sign in → code → tap the WhatsApp message → signed in, back on the tabs.
await page.goto(BASE + "/mobile/app/login", { waitUntil: "networkidle" });
await page.locator("[data-mobile-action-bar] button", { hasText: "Send code" }).click();
await sleep(1400);
await page.locator("[data-phone-screen] button", { hasText: "Your Rimba code is" }).click();
await sleep(3200);
check(!(await page.locator("[data-app-cover]").count()) && (await topScreen()) === "home", "app: sign in → code from the message → signed in on Home");

// Long press: the menu grows out of the pressed point; Esc closes it.
await page.goto(BASE + "/mobile/mobile-context-menu", { waitUntil: "networkidle" });
const lp = await centre(page.locator("[data-phone-screen] [role=listitem]").nth(1));
await page.mouse.move(lp.x - 60, lp.y);
await page.mouse.down();
await sleep(650);
await page.mouse.up();
await sleep(250);
const ctx = await page.evaluate(() => {
  const m = document.querySelector("[data-phone-screen] [role=menu]");
  return m ? { items: m.querySelectorAll("[role=menuitem]").length, origin: m.style.transformOrigin } : null;
});
check(ctx?.items === 3 && /px/.test(ctx.origin), `long-press menu opens from the pressed point (${JSON.stringify(ctx)})`);
await page.keyboard.press("Escape");
await sleep(350);
check(!(await page.locator("[data-phone-screen] [role=menu]").count()), "long-press menu: Esc closes it");

// Scrub chart: dragging across it turns the number into the point under the finger.
await page.goto(BASE + "/mobile/mobile-scrub-chart", { waitUntil: "networkidle" });
const chart = await centre(page.locator("[data-phone-screen] [role=slider]").first());
await page.mouse.move(chart.b.x + 20, chart.y);
await page.mouse.down();
await page.mouse.move(chart.b.x + chart.b.width * 0.4, chart.y, { steps: 6 });
const scrubbed = await page.locator("[data-phone-screen] figcaption").first().textContent();
await page.mouse.up();
check(/Nov|Oct/.test(scrubbed) && !/last 30 days/.test(scrubbed), `scrub chart: the readout follows the finger (${scrubbed})`);

// Date range: two taps pick a range; the button names it.
await page.goto(BASE + "/mobile/mobile-date-range?open=1", { waitUntil: "networkidle" });
await sleep(700);
await page.getByRole("gridcell", { name: "3 November", exact: true }).click();
await page.getByRole("gridcell", { name: "9 November", exact: true }).click();
const rangeBtn = await page.locator("[data-phone-screen] [role=dialog] button", { hasText: /^Show / }).textContent();
check(/3 – 9 Nov/.test(rangeBtn), `date range: start and end taps make the range (${rangeBtn})`);

// Keypad: a quick amount, then Delete drops one digit.
await page.goto(BASE + "/mobile/mobile-keypad", { waitUntil: "networkidle" });
await page.locator("[data-phone-screen] button", { hasText: "Exact" }).click();
await page.getByRole("button", { name: "Delete, hold to clear" }).click();
const amount = await page.locator("[data-phone-screen] output").textContent();
check(amount === "Rp\u00a041.200", `keypad: Exact then Delete (${amount})`);

// Full-screen modal: Save is on from the start (with nothing changed it just closes); Cancel after an edit asks first.
await page.goto(BASE + "/mobile/mobile-modal?open=1", { waitUntil: "networkidle" });
await sleep(600);
const modalSave = page.locator("[data-phone-screen] [role=dialog] [data-mobile-action-bar] button", { hasText: "Save" });
const saveOn = await modalSave.isEnabled();
await modalSave.click();
await sleep(500);
const closedClean = !(await page.locator("[data-phone-screen] [role=dialog]").count());
await page.goto(BASE + "/mobile/mobile-modal?open=1", { waitUntil: "networkidle" });
await sleep(600);
await page.locator("[data-phone-screen] [role=dialog] input").first().fill("Gelas kopi tanah liat, biru");
await page.locator("[data-phone-screen] [role=dialog] header button", { hasText: "Cancel" }).click();
await sleep(400);
const asks = await page.locator("[data-phone-screen] [role=alertdialog]", { hasText: "Discard your changes?" }).count();
check(saveOn && closedClean && asks, `modal: Save sits in the bottom bar and is on at once, an untouched Save closes, Cancel after an edit asks (${JSON.stringify({ saveOn, closedClean, asks })})`);

// A–Z index: a tap low on the strip jumps the list down.
await page.goto(BASE + "/mobile/mobile-index-list", { waitUntil: "networkidle" });
const strip = await page.locator('[data-phone-screen] [role=slider][aria-label="Jump to letter"]').boundingBox();
await page.mouse.click(strip.x + strip.width / 2, strip.y + strip.height * 0.9);
await sleep(300);
const jumped = await page.evaluate(() => document.querySelector("[data-phone-screen] [data-mobile-screen]").scrollTop);
check(jumped > 600, `A–Z index: tapping a letter jumps the list (${jumped})`);

// Approvals: the button and the swipe do the same; the snackbar offers Undo.
await page.goto(BASE + "/mobile/app/approvals", { waitUntil: "networkidle" });
await page.locator("[data-phone-screen] article button", { hasText: "Approve" }).first().click();
await sleep(500);
const approved = await page.locator("[data-phone-screen] [role=status]", { hasText: "Approved" }).textContent().catch(() => "");
check(/Approved: Bubble wrap/.test(approved) && /Undo/.test(approved), `approvals: Approve removes the request and offers Undo (${approved})`);

// Classic scrollbars (Linux, or macOS with "always show scroll bars"): headless hides them by default, so this browser
// keeps them. Nothing runs under the page scrollbar or past the page gutter, flap closed and open, and the right margin
// equals the left. Inner scroll areas: a carousel's track shows no
// bar, and the message scroller's bar sits in its own lane, clear of every message.
const classic = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const cpage = await classic.newPage({ viewport: { width: 1440, height: 900 } });
const edges = () =>
  cpage.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const inner = document.querySelector("header > div");
    const ib = inner.getBoundingClientRect();
    const cs = getComputedStyle(inner);
    const gutter = parseFloat(cs.paddingRight);
    const left = ib.left + parseFloat(cs.paddingLeft);
    const right = ib.right - gutter;
    const panel = document.querySelector("[data-customize-panel][data-state=open]")?.getBoundingClientRect().right ?? 0;
    const over = [];
    for (const el of document.querySelectorAll("[data-page] *")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0 || b.right <= right + 0.5) continue;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || st.opacity === "0") continue;
      // Page-wide bands (the sticky header's background, main) span the page; their content is checked on its own.
      if (b.left <= document.querySelector("[data-page]").getBoundingClientRect().left + 0.5 && b.right >= cw - 0.5) continue;
      // A glow drawn behind its box (z-index -1) is light, not content.
      if (st.position === "absolute" && st.zIndex === "-1") continue;
      // A transparent wrapper whose padding keeps its content inside the gutter is fine (the page sections).
      const painted = st.backgroundColor !== "rgba(0, 0, 0, 0)" || st.boxShadow !== "none" || !el.children.length;
      if (!painted && b.right - parseFloat(st.paddingRight) <= right + 0.5) continue;
      // Clipped by a scroll area or an overflow-hidden box inside the page: whatever pokes out is not painted.
      let p = el.parentElement;
      let clipped = false;
      for (; p && !p.matches("[data-page]"); p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflowX !== "visible" && b.right > p.getBoundingClientRect().right + 0.5) clipped = true;
      }
      if (!clipped) over.push(`${el.tagName.toLowerCase()}${el.dataset.spot ? `[${el.dataset.spot}]` : ""} ${Math.round(b.right)} "${(el.textContent || "").trim().slice(0, 24)}"`);
    }
    return { cw, bar: innerWidth - cw, gutter, left: Math.round(left - panel), right: Math.round(cw - right), over: over.slice(0, 6) };
  });
for (const w of [1440, 1720]) {
  await cpage.setViewportSize({ width: w, height: 900 });
  for (const path of ["/", "/components", "/ai", "/components/select"]) {
    await cpage.goto(BASE + path, { waitUntil: "networkidle" });
    await cpage.mouse.move(w / 2, 450);
    await sleep(300);
    const shut = await edges();
    // macOS headless Chromium draws overlay scrollbars (bar 0) unless the system shows them always; the gutter and
    // margin checks still hold there.
    check((shut.bar > 0 || process.platform === "darwin") && shut.over.length === 0 && Math.abs(shut.left - shut.right) <= 1, `classic scrollbar ${w} ${path}, flap closed: nothing past the gutter, margins equal (${JSON.stringify(shut)})`);
    await cpage.locator("[data-customize-flap]").hover();
    await sleep(800);
    await settled(cpage);
    const open = await edges();
    check(open.over.length === 0 && open.right === Math.round(open.gutter), `classic scrollbar ${w} ${path}, flap open: nothing past the gutter (${JSON.stringify(open)})`);
    await cpage.mouse.move(w - 100, 450, { steps: 4 });
    await sleep(900);
    await settled(cpage);
    const after = await edges();
    check(after.over.length === 0 && Math.abs(after.left - after.right) <= 1, `classic scrollbar ${w} ${path}, after closing: margins equal (${JSON.stringify(after)})`);
  }
}
await cpage.setViewportSize({ width: 1440, height: 900 });
await cpage.goto(BASE + "/components", { waitUntil: "networkidle" });
const inner = await cpage.evaluate(() => {
  const track = document.querySelector("[aria-roledescription=carousel] > div");
  const box = document.querySelector("[data-spot=message-scroller] .overflow-y-auto");
  const content = box.firstElementChild.getBoundingClientRect();
  return { carouselBar: track.offsetHeight - track.clientHeight, lane: Math.round(box.getBoundingClientRect().left + box.clientWidth - content.right), card: Math.round(box.closest(".rounded-card, [class*=rounded-card]").getBoundingClientRect().right - box.getBoundingClientRect().right) };
});
check(inner.carouselBar === 0 && inner.lane >= 8 && inner.card >= 0, `inner scroll areas: no carousel bar, message bar in its own lane (${JSON.stringify(inner)})`);
await classic.close();

await browser.close();
server.kill("SIGTERM");
console.log(failures.length ? `SMOKE FAIL (${failures.length})` : "SMOKE PASS");
process.exit(failures.length ? 1 : 0);
