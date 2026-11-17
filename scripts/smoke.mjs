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
  ["/gallery", "Gallery"],
  ["/gallery/menu", "Menu"],
  ["/gallery/command-palette", "Command palette"],
  ["/gallery/fee-row", "Fee row"],
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
  tiles: document.querySelectorAll("main a[href^='/gallery/']").length,
}));
check(landing.bands === 6 && !landing.corners && landing.tiles === 0, `landing is the bento (${JSON.stringify(landing)})`);
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
for (const path of ["/", "/gallery", "/gallery/select", "/examples/dashboard", "/examples/orders", "/export"]) {
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
const touchScroll = async (x, y, dy) => {
  await cdp.send("Input.synthesizeScrollGesture", { x: Math.round(x), y: Math.round(y), yDistance: -dy, gestureSourceType: "touch", speed: 1200 });
  await sleep(300);
};
const phoneScroll = () => short.evaluate(() => ({ page: Math.round(scrollY), box: Math.round(document.querySelector("[data-own-scroll]")?.scrollTop ?? -1) }));
await touchScroll(pop.x + pop.width / 2, pop.y + pop.height / 2, 900);
await touchScroll(pop.x + pop.width / 2, pop.y + pop.height / 2, 900);
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
for (const path of ["/", "/gallery", "/examples/dashboard", "/export"]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  boxes.add(await page.evaluate(() => JSON.stringify([document.querySelector("header")?.getBoundingClientRect(), document.querySelector("header a")?.getBoundingClientRect()])));
}
check(boxes.size === 1, "header sits in the same place on every page");

// Every example nav item opens a real page
await page.goto(BASE + "/examples/dashboard", { waitUntil: "networkidle" });
for (const label of ["Products", "Promotions", "Cancellations", "Team"]) {
  await page.click(`nav a:has-text('${label}')`);
  await page.waitForURL(`**/examples/${label.toLowerCase()}*`);
  const ok = await page.locator(`h1:text-is('${label}')`).waitFor({ timeout: 4000 }).then(() => true, () => false);
  check(ok, `sidebar ${label} opens its page`);
}

// Command palette opens with Ctrl+K
await page.goto(BASE + "/gallery", { waitUntil: "networkidle" });
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
check((await page.getAttribute("a:has-text('Explore gallery')", "href"))?.includes("r=20"), "links carry the settings");

// Select opens and picks
await page.goto(`${BASE}/gallery/select`, { waitUntil: "networkidle" });
await page.click("[data-stage] [aria-haspopup=listbox]");
await page.click("[role=option]:has-text('Dago')");
check(await page.locator("[data-stage] [aria-haspopup=listbox]:has-text('Dago')").isVisible(), "select picks an option");

// Menu: submenu opens on click and on keyboard
await page.goto(`${BASE}/gallery/menu`, { waitUntil: "networkidle" });
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
await sleep(200);
check(await page.locator("[role=menuitem]:has-text('To pack')").isVisible(), "submenu opens with ArrowRight");

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
console.log(failures.length ? `SMOKE FAIL (${failures.length})` : "SMOKE PASS");
process.exit(failures.length ? 1 : 0);
