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
  ["/", "Corners that agree."],
  ["/gallery", "Gallery"],
  ["/gallery/menu", "Menu"],
  ["/examples/dashboard", "Dashboard"],
  ["/examples/orders", "Orders"],
  ["/examples/settings", "Settings"],
  ["/export", "Export"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  check(await page.getByText(text, { exact: true }).first().isVisible(), `${path} shows "${text}"`);
}

// Config travels in the URL and restyles tokens
await page.goto(`${BASE}/?r=20&c=r&a=d9622b&t=d`, { waitUntil: "networkidle" });
const vars = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return { r: s.getPropertyValue("--ad-radius-control").trim(), brand: s.getPropertyValue("--ad-brand").trim(), dark: document.documentElement.classList.contains("dark") };
});
check(vars.r === "20px" && vars.dark, `URL config applies (radius ${vars.r}, dark ${vars.dark})`);
check((await page.getAttribute("a:has-text('Explore gallery')", "href"))?.includes("r=20"), "links carry the settings");

// Select opens and picks
await page.goto(`${BASE}/gallery/select`, { waitUntil: "networkidle" });
await page.click("main [aria-haspopup=listbox]");
await page.click("[role=option]:has-text('Dago')");
check(await page.locator("main [aria-haspopup=listbox]:has-text('Dago')").isVisible(), "select picks an option");

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
