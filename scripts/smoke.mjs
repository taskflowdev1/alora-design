// Headless smoke test on its own port: every route renders without errors and the key interactions work.
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SMOKE_PORT || 5196);
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {}
  await sleep(250);
}

const failures = [];
const check = (ok, msg) => (ok ? console.log(`ok   ${msg}`) : (failures.push(msg), console.log(`FAIL ${msg}`)));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

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
  ["/export", "Export"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  check(await page.getByText(text, { exact: true }).first().isVisible(), `${path} shows "${text}"`);
}

// Customize flap: hover opens the left panel and pushes the page flush right; leaving closes it.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.mouse.move(700, 450);
await page.locator("[data-customize-flap]").hover();
await sleep(800);
const pushed = await page.evaluate(() => {
  const p = document.querySelector("[data-customize-panel]");
  const h = document.querySelector("header > div").getBoundingClientRect();
  return { state: p?.getAttribute("data-state"), panel: Math.round(p.getBoundingClientRect().right), left: Math.round(h.left), right: Math.round(h.right), vw: innerWidth };
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

// Landing: one bento of components in use; no tile grid, no corner demo, nothing wider than a phone
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const landing = await page.evaluate(() => ({
  bands: document.querySelectorAll("[data-bento]").length,
  corners: document.body.innerText.includes("Corners that agree"),
  tiles: document.querySelectorAll("main a[href^='/components/'], main a[href^='/gallery/']").length,
  order: [...document.querySelectorAll("main [data-bento='1'], main [data-landing]")].map((e) => e.dataset.landing ?? "bento"),
  orbs: document.querySelectorAll("[data-landing=ai] canvas").length,
  sand: document.querySelectorAll("[data-landing=backgrounds] [data-sand-field]").length,
}));
check(landing.bands === 6 && !landing.corners && landing.tiles === 0, `landing is the bento (${JSON.stringify(landing)})`);
check(landing.order.join() === "bento,more,ai,backgrounds,footer" && landing.orbs > 0 && landing.sand === 1, `landing: components first (original bento, then the category bands), then AI, Backgrounds, the closing footer (${JSON.stringify(landing)})`);
// AI band: the chat list is a sidebar left of the thread (240 to 280 px), the same height. The message box is one row,
// attach | text | send: both buttons one size, one inset on every side, a single text line centred on the buttons, and
// the radius is the button radius plus that inset (concentric). Three lines grow the box upward, buttons stay at the bottom.
const agent = await page.evaluate(async () => {
  const c = document.querySelector("[data-landing=ai] [data-chats]").getBoundingClientRect();
  const t = document.querySelector("[data-landing=ai] [data-thread]").getBoundingClientRect();
  const box = document.querySelector("[data-landing=ai] [data-composer]");
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
await page.locator("[data-bento] [role=combobox][aria-label='Search commands']").fill("sync");
check((await page.locator("[data-bento] [role=option]").count()) === 1, "inline command palette filters");
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
phone.on("pageerror", (e) => errors.push(e.message));
await phone.goto(BASE + "/", { waitUntil: "networkidle" });
const pw = await phone.evaluate(() => [document.scrollingElement.scrollWidth, document.documentElement.clientWidth]);
check(pw[0] <= pw[1], `landing has no horizontal scroll on phone (${pw.join(" vs ")})`);
await phone.close();

// 360 px: no horizontal page scroll anywhere; the header stays on one line
const small = await (await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true })).newPage();
small.on("pageerror", (e) => errors.push(e.message));
for (const path of ["/", "/components", "/components/select", "/ai", "/ai/thinking-orbs", "/backgrounds", "/backgrounds/sand-field", "/examples/dashboard", "/examples/orders", "/export"]) {
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
for (const path of ["/", "/components", "/ai", "/backgrounds", "/examples/dashboard", "/export"]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  boxes.add(await page.evaluate(() => JSON.stringify([document.querySelector("header")?.getBoundingClientRect(), document.querySelector("header a")?.getBoundingClientRect()])));
}
check(boxes.size === 1, "header sits in the same place on every page");

// Nav tabs: Components first, then AI, Backgrounds, Examples, Export; the current section is highlighted
await page.goto(BASE + "/components/button", { waitUntil: "networkidle" });
const tabs = await page.evaluate(() => {
  const nav = document.querySelector("header nav[aria-label=Sections]");
  return { labels: [...nav.querySelectorAll("a")].map((a) => a.textContent), active: nav.querySelector("[aria-current=page]")?.textContent };
});
check(tabs.labels.join() === "Components,AI,Backgrounds,Examples,Export" && tabs.active === "Components", `header tabs (${JSON.stringify(tabs)})`);

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
await page.keyboard.press("Escape");
await page.focus("main button:has-text('Actions')");
await page.keyboard.press("Enter");
await sleep(200);
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowDown");
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

check(errors.length === 0, `no page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`);
await browser.close();
server.kill("SIGTERM");
// The shadcn-parity components: each detail page renders its title and stage without errors, and the landing shows
// every one of them live exactly once in its category bands.
const MORE = ["button-group", "textarea", "input-group", "input-otp", "label", "native-select", "calendar", "toggle", "data-table", "item", "accordion", "collapsible", "carousel", "aspect-ratio", "typography", "chart", "line-chart", "area-chart", "pie-chart", "radar-chart", "radial-chart", "breadcrumb", "navigation-menu", "menubar", "pagination", "alert-dialog", "drawer", "resizable", "scroll-area", "message", "message-scroller", "marker", "trace", "attachment", "questionnaire", "code-block"];
const before = errors.length;
for (const name of MORE) {
  await page.goto(`${BASE}/components/${name}`, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => ({ h1: document.querySelector("main h1, h1")?.textContent, stage: !!document.querySelector("[data-stage]")?.children.length }));
  check(!!r.h1 && r.stage && !/No component/.test(r.h1), `/components/${name} renders (${r.h1})`);
}
check(errors.length === before, `new component pages throw nothing (${errors.slice(before, before + 3).join(" | ")})`);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const landingMore = await page.evaluate((names) => {
  const band = document.querySelector("[data-landing=more]");
  return { missing: names.filter((n) => band?.querySelectorAll(`[data-spot="${n}"]`).length !== 1), bands: [...(band?.querySelectorAll("[data-band]") ?? [])].map((b) => b.dataset.band) };
}, MORE);
check(landingMore.missing.length === 0 && landingMore.bands.length >= 6, `landing shows every new component once, by category (${JSON.stringify(landingMore)})`);
// Line chart: hovering shows one tooltip with every series.
await page.goto(BASE + "/components/line-chart", { waitUntil: "networkidle" });
const svg = page.locator("[data-stage] figure svg").first();
const sb = await svg.boundingBox();
await page.mouse.move(sb.x + sb.width * 0.6, sb.y + sb.height / 2);
await sleep(200);
const tip = await page.locator("[data-stage] [role=status]").first().innerText().catch(() => "");
check(/This fortnight/.test(tip) && /The one before/.test(tip), `line chart crosshair tooltip lists both series (${JSON.stringify(tip)})`);

console.log(failures.length ? `SMOKE FAIL (${failures.length})` : "SMOKE PASS");
process.exit(failures.length ? 1 : 0);
