import { AsyncLocalStorage } from "node:async_hooks";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { freemem } from "node:os";
import { chromium } from "playwright-core";
import { SECTIONS, routeEntry } from "./lib/smoke-map.mjs";

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
const outDir = process.env.SITE_DIST ? ["--outDir", process.env.SITE_DIST] : [];
const server = spawn("node_modules/.bin/vite", ["preview", ...outDir, "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let serving = false;
for (let i = 0; i < 300 && !serving; i++) {
  try {
    serving = (await fetch(BASE)).ok;
  } catch {}
  if (!serving) await sleep(50);
}
if (!serving) {
  console.log(`FAIL preview server did not answer on port ${PORT}`);
  console.log("SMOKE FAIL (1)");
  process.exit(1);
}

const freeGiB = freemem() / 1024 ** 3;
const WORKERS = process.env.SMOKE_WORKERS ? Number(process.env.SMOKE_WORKERS) : freeGiB >= 5.5 ? 4 : freeGiB >= 4.5 ? 3 : 2;
const ONLY = process.env.SMOKE_SECTIONS === undefined ? null : new Set(process.env.SMOKE_SECTIONS.split(",").filter(Boolean));
if (!Number.isInteger(WORKERS) || WORKERS < 1 || ONLY?.size === 0) {
  console.log(`FAIL bad smoke settings (SMOKE_WORKERS=${process.env.SMOKE_WORKERS}, SMOKE_SECTIONS=${process.env.SMOKE_SECTIONS})`);
  console.log("SMOKE FAIL (1)");
  process.exit(1);
}

const settled = (pg, selector = "[data-page], [data-customize-panel]") =>
  pg
    .waitForFunction(
      (sel) => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity || !a.effect?.target?.matches?.(sel)),
      selector,
      { timeout: 4000 },
    )
    .catch(() => {});
const frames = (pg) => pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const failures = [];
const inSection = new AsyncLocalStorage();
const check = (ok, msg) => (ok ? console.log(`ok   ${msg}`) : (failures.push({ msg, section: inSection.getStore() }), console.log(`FAIL ${msg}`)));
const near = (a, b) => Math.abs(a - b) <= 0.5;
const chunks = (xs, n) => Array.from({ length: n }, (_, i) => xs.filter((_, j) => j % n === i));
const browser = await chromium.launch();
let classicBrowser;
const classic = () => (classicBrowser ??= chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] }));
const allErrors = [];

const probe = await browser.newContext();
const Page = Object.getPrototypeOf(await probe.newPage());
await probe.close();
const navigate = Page.goto;
Page.goto = async function (url, options) {
  const response = await navigate.call(this, url, { waitUntil: "load", ...options });
  await this.waitForFunction(
    () =>
      document.readyState === "complete" &&
      document.querySelector("#root")?.childElementCount > 0 &&
      document.querySelector("#content, [data-mobile-app]")?.childElementCount > 0 &&
      document.fonts.status === "loaded" &&
      [...document.images].every((i) => i.complete || i.loading === "lazy"),
    null,
    { timeout: 15000 },
  );
  await this.waitForFunction(
    () =>
      ![...document.querySelectorAll(".animate-ad-pulse")].some((el) => {
        if (!el.style.aspectRatio && !el.closest("[data-phone-screen], [data-mobile-app]")) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.bottom > -600 && r.top < innerHeight + 600;
      }),
    null,
    { timeout: 2000 },
  ).catch(() => {});
  await frames(this);
  return response;
};

const sections = [];
/** Register a section. A name can have several parts (a long sweep split across workers). */
const section = (name, run) => sections.push({ name, run });

const MOBILE = ["mobile-tab-bar", "mobile-nav-bar", "mobile-action-bar", "mobile-list", "mobile-swipe-row", "mobile-pull-refresh", "mobile-list-skeleton", "mobile-empty-state", "mobile-sheet", "mobile-action-sheet", "mobile-date-picker", "mobile-segmented", "mobile-search-bar", "mobile-stepper", "mobile-snackbar"];
const MOBILE_2 = ["mobile-filter-chips", "mobile-top-tabs", "mobile-choice-rows", "mobile-person-row", "mobile-index-list", "mobile-picker-sheet", "mobile-multi-select", "mobile-date-range", "mobile-context-menu", "mobile-modal", "mobile-alert", "mobile-text-field", "mobile-keypad", "mobile-slider", "mobile-photo-picker", "mobile-scanner", "mobile-signature", "mobile-otp", "mobile-stat-tiles", "mobile-kpi-carousel", "mobile-scrub-chart", "mobile-timeline", "mobile-steps", "mobile-receipt", "mobile-badge", "mobile-banner", "mobile-upload-row", "mobile-onboarding", "mobile-chat"];
MOBILE.push(...MOBILE_2);
const MOBILE_PWA = ["mobile-install-prompt", "mobile-passkey", "mobile-push-ask", "mobile-app-header", "mobile-app-badge", "mobile-sync-status", "mobile-update-toast", "mobile-page-stack", "mobile-share", "mobile-camera", "mobile-wake-lock", "mobile-state-button"];
const APP_SCREENS = ["home", "notifications", "search", "reports", "orders", "order", "delivery", "products", "product", "product-edit", "stock-count", "inbox", "chat", "assistant", "more", "customers", "customer", "pos", "pos-pay", "pos-receipt", "approvals", "schedule", "settings", "account", "login", "otp", "onboarding"];
const APP_STATES = ["home?state=offline", "notifications?state=empty", "search?state=empty", "reports?state=error", "approvals?state=empty"];
const drag = async (page, from, dx, dy, steps = 12) => {
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

section("routes", async ({ page }) => {
  for (const [path, text] of [
    ["/", "just some random ui styling"],
    ["/", "Orders"],
    ["/", "Metric card"],
    ["/components", "Components"],
    ["/components/menu", "Menu"],
    ["/components/command-palette", "Command palette"],
    ["/components/fee-row", "Fee row"],
    ["/gallery/fee-row", "Fee row"],
    ["/ai", "Late orders this week"],
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
    await page.goto(BASE + path);
    check(await page.getByText(text, { exact: true }).first().waitFor({ timeout: 5000 }).then(() => true, () => false), `${path} shows "${text}"`);
  }
});

section("flap", async ({ page }) => {
  await page.goto(BASE + "/");
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

  await page.goto(BASE + "/");
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
  await page.mouse.move(panelBox.x + panelBox.width / 2, 30);
  await page.mouse.wheel(0, 600);
  await sleep(300);
  const s2 = await scrolls();
  await page.mouse.move(1200, 500);
  await page.mouse.wheel(0, 700);
  await sleep(400);
  const s3 = await scrolls();
  check(s1.page === 0 && s1.panel > 0 && s2.page === 0 && s3.page > 0 && s3.panel === s2.panel, `panel and page scroll separately (${JSON.stringify([s1, s2, s3])})`);
  await page.setViewportSize({ width: 1440, height: 2600 });
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(400);
  await page.mouse.move(panelBox.x + panelBox.width / 2, 600);
  await page.mouse.wheel(0, 500);
  await sleep(300);
  const s4 = await scrolls();
  check(s4.page === 0, `wheel over a panel that fits never scrolls the page (${JSON.stringify(s4)})`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Escape");
});

section("landing", async ({ page }) => {
  await page.goto(BASE + "/");
  const logo = await page.evaluate(() => {
    const a = document.querySelector("header [data-logo]");
    return { svg: !!a?.querySelector("svg path"), text: a?.textContent?.trim(), label: a?.querySelector("[role=img]")?.getAttribute("aria-label") };
  });
  check(logo.svg && logo.text === "design" && logo.label === "Alora Design", `header shows the Alora logo (${JSON.stringify(logo)})`);
  check((await page.getAttribute("a:has-text('erp-ui skill')", "href")) === "https://github.com/JoshD94/ai-skills/tree/main/erp-ui", "hero links the erp-ui skill");

  await page.goto(BASE + "/");
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
  await page.locator("[data-moment=otp] input").first().click();
  await page.keyboard.type("123456");
  await sleep(1600);
  const otpOpen = await page.locator("[data-moment=otp] [aria-live]").textContent();
  check(/Welcome back/.test(otpOpen ?? ""), `landing OTP: 123456 signs in (${otpOpen})`);
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
});

section("ai-composer", async ({ page }) => {
  await page.goto(BASE + "/ai");
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
    agent.left && agent.chatsWidth >= 240 && agent.chatsWidth <= 280 && agent.sameHeight && agent.height >= 520 && new Set(agent.insets).size === 1 && agent.centred && agent.sameSize && agent.concentric && agent.grows,
    `AI band: chat sidebar left, thread right; composer one row, centred, concentric, grows up (${JSON.stringify(agent)})`,
  );
});

section("phone-widths", async ({ errors, open }) => {
  const phone = await open({ viewport: { width: 390, height: 844 }, isMobile: true });
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(BASE + "/");
  const pw = await phone.evaluate(() => [document.scrollingElement.scrollWidth, document.documentElement.clientWidth]);
  check(pw[0] <= pw[1], `landing has no horizontal scroll on phone (${pw.join(" vs ")})`);
  await phone.close();

  const small = await open({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  small.on("pageerror", (e) => errors.push(e.message));
  for (const path of ["/", "/components", "/components/select", "/ai", "/ai/thinking-orbs", "/backgrounds", "/backgrounds/sand-field", "/examples/dashboard", "/examples/orders", "/encyclopedia", "/export"]) {
    await small.goto(BASE + path);
    const w = await small.evaluate(() => ({
      scroll: document.scrollingElement.scrollWidth,
      client: document.documentElement.clientWidth,
      logo: Math.round(document.querySelector("header [data-logo]").getBoundingClientRect().height),
    }));
    check(w.scroll <= w.client && w.logo <= 32, `360 ${path}: no horizontal scroll, logo on one line (${JSON.stringify(w)})`);
  }
  await small.close();
});

section("phone-customize", async ({ open }) => {
  const short = await open({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  await short.goto(BASE + "/");
  await short.locator("header button[aria-label=Customize]").tap();
  await sleep(400);
  const pop = await short.locator("[data-own-scroll]").boundingBox();
  const cdp = await short.context().newCDPSession(short);
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
  await touchScroll(pop.x + 6, pop.y + pop.height * 0.8, 300);
  await touchScroll(pop.x + 6, pop.y + pop.height * 0.8, 300);
  const t1 = await phoneScroll();
  const popW = await short.evaluate(() => { const b = document.querySelector("[data-own-scroll]"); return [b.scrollWidth, b.clientWidth]; });
  check(t1.page === 0 && t1.box > 0 && popW[0] <= popW[1], `phone customize scrolls on its own, nothing clipped (${JSON.stringify({ ...t1, width: popW })})`);
  await short.close();
});

section("defaults", async ({ page }) => {
  await page.goto(BASE + "/");
  const def = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    page: getComputedStyle(document.documentElement).getPropertyValue("--ad-page").trim(),
    brand: getComputedStyle(document.documentElement).getPropertyValue("--ad-brand").trim(),
  }));
  const rgb = def.page.match(/[0-9a-f]{2}/gi)?.map((h) => parseInt(h, 16)) ?? [];
  check(def.dark && rgb.length === 3 && Math.max(...rgb) - Math.min(...rgb) <= 1, `dark and neutral by default (page ${def.page}, brand ${def.brand})`);

  const boxes = new Set();
  for (const path of ["/", "/components", "/ai", "/backgrounds", "/examples/dashboard", "/encyclopedia", "/export"]) {
    await page.goto(BASE + path);
    boxes.add(await page.evaluate(() => JSON.stringify([document.querySelector("header")?.getBoundingClientRect(), document.querySelector("header a")?.getBoundingClientRect()])));
  }
  check(boxes.size === 1, `header sits in the same place on every page${boxes.size === 1 ? "" : ` (${[...boxes].join(" vs ")})`}`);
});

section("inline-edit", async ({ page }) => {
  await page.goto(BASE + "/examples/products");
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
});

section("press-scale", async ({ page }) => {
  await page.goto(BASE + "/examples/orders");
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
  const colsBtn = page.locator("#content [data-filter-button]").first();
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
  check(menuOpen && (!menuPressed || (near(menuOpen.x, menuPressed.x) && near(menuOpen.y, menuPressed.y))), `Filter popover stays put when its trigger is pressed again (${JSON.stringify({ menuOpen, menuPressed })})`);
  await page.goto(BASE + "/components/dialog");
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
});

section("nav-tabs", async ({ page }) => {
  await page.goto(BASE + "/components/button");
  const tabs = await page.evaluate(() => {
    const nav = document.querySelector("header nav[aria-label=Sections]");
    return { labels: [...nav.querySelectorAll("a")].map((a) => a.textContent), active: nav.querySelector("[aria-current=page]")?.textContent };
  });
  check(tabs.labels.join() === "Components,Mobile,AI,Backgrounds,Examples,Encyclopedia,Export" && tabs.active === "Components", `header tabs (${JSON.stringify(tabs)})`);
});

section("encyclopedia", async ({ page }) => {
  await page.goto(BASE + "/encyclopedia");
  const enc = async () =>
    page.evaluate(() => ({ rows: document.querySelectorAll("[data-encyclopedia] [data-rule]").length, count: document.querySelector("[data-rule-count]")?.textContent }));
  const encAll = await enc();
  check(encAll.rows >= 200 && encAll.count === String(encAll.rows), `encyclopedia renders every rule (${JSON.stringify(encAll)})`);
  await page.getByRole("searchbox", { name: "Search rules" }).fill("tabular");
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
});

section("components-index", async ({ page }) => {
  await page.goto(BASE + "/components");
  const index = await page.evaluate(() => ({
    spots: document.querySelectorAll("[data-spot]").length,
    missing: (document.querySelector("[data-components]")?.dataset.components.split(",") ?? ["(no list)"]).filter((n) => document.querySelectorAll(`[data-spot="${n}"]`).length !== 1),
    groups: [...document.querySelectorAll("[data-group]")].map((g) => g.dataset.group),
    tiles: document.querySelectorAll("[data-fit], [inert] [data-spot]").length,
  }));
  check(index.spots >= 60 && index.missing.length === 0 && index.groups[0] === "Foundations" && index.tiles === 0, `components page: every component live exactly once, in category bento tiles (${JSON.stringify(index)})`);
  await page.locator("[data-spot=select]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  let selBox = null;
  for (let i = 0; i < 20; i++) {
    await sleep(250);
    const b = await page.locator("[data-spot=select]").boundingBox();
    if (selBox && Math.abs(b.y - selBox.y) < 0.5) break;
    selBox = b;
    await page.locator("[data-spot=select]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  }
  selBox = await page.locator("[data-spot=select]").boundingBox();
  await page.mouse.move(selBox.x + selBox.width / 2, selBox.y + selBox.height / 2);
  await sleep(300);
  const chipBox = await page.locator("[data-spot=select] > a").boundingBox();
  await page.mouse.move(selBox.x + 12, selBox.y + 2, { steps: 4 });
  await page.mouse.move(chipBox.x + chipBox.width / 2, chipBox.y + chipBox.height / 2, { steps: 4 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForURL("**/components/select*", { timeout: 8000 }).catch(() => {});
  check(await page.locator("[data-stage]").waitFor({ timeout: 4000 }).then(() => true, () => false), "a spot opens its component page");
  await page.goto(BASE + "/ai");
  await page.locator("[data-spot=thinking-orbs] > a").click();
  await page.waitForURL("**/ai/thinking-orbs*");
  await page.locator("[role=slider][aria-label=Size]").focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  const orbBox = await page.evaluate(() => Math.round(document.querySelector("[data-stage] canvas").parentElement.getBoundingClientRect().width));
  check(orbBox === 32, `orb size slider resizes the orbs (${orbBox} px)`);
});

section("footer-tablet", async ({ page, open }) => {
  for (const path of ["/", "/components", "/ai", "/export"]) {
    await page.goto(BASE + path);
    const f = await page.evaluate(() => {
      const footers = document.querySelectorAll("footer");
      const credit = [...(footers[0]?.querySelectorAll("p") ?? [])].find((p) => p.textContent.includes("Curated by"));
      const body = getComputedStyle(document.documentElement).getPropertyValue("--ad-text-body").trim();
      return { count: footers.length, text: credit?.innerText.trim(), href: credit?.querySelector("a")?.getAttribute("href"), size: credit && getComputedStyle(credit).fontSize, body };
    });
    check(f.count === 1 && f.text === "Curated by Joshua Dirga · 2026" && f.href === "https://joshuadirga.com" && f.size === f.body, `${path} footer credit (${JSON.stringify(f)})`);
  }

  const tablet = await open({ viewport: { width: 768, height: 900 } });
  for (const path of ["/", "/components", "/examples/dashboard"]) {
    await tablet.goto(BASE + path);
    const g = await tablet.evaluate(() => ({ flap: Math.round(document.querySelector("[data-customize-flap]").getBoundingClientRect().right), logo: Math.round(document.querySelector("header [data-logo]").getBoundingClientRect().left), main: Math.round(document.querySelector("main h1")?.getBoundingClientRect().left ?? 999) }));
    check(g.flap + 4 <= g.logo && g.flap + 4 <= g.main, `768 ${path}: customize tab clear of the page (${JSON.stringify(g)})`);
  }
  await tablet.close();
});

section("examples-nav", async ({ page }) => {
  await page.goto(BASE + "/examples/dashboard");
  for (const label of ["Products", "Promotions", "Cancellations", "Team"]) {
    await page.click(`nav a:has-text('${label}')`);
    await page.waitForURL(`**/examples/${label.toLowerCase()}*`);
    const ok = await page.locator(`h1:text-is('${label}')`).waitFor({ timeout: 4000 }).then(() => true, () => false);
    check(ok, `sidebar ${label} opens its page`);
  }
});

section("palette-config", async ({ page }) => {
  await page.goto(BASE + "/components");
  await page.keyboard.press("Control+k");
  await sleep(200);
  check(await page.locator("[role=listbox] >> text=Fee row").isVisible(), "Ctrl+K opens the command palette");
  await page.keyboard.press("Escape");

  await page.goto(`${BASE}/?r=20&c=r&a=d9622b&t=l`);
  const vars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return { r: s.getPropertyValue("--ad-radius-control").trim(), brand: s.getPropertyValue("--ad-brand").trim(), dark: document.documentElement.classList.contains("dark") };
  });
  check(vars.r === "20px" && !vars.dark, `URL config applies (radius ${vars.r}, light ${!vars.dark})`);
  check((await page.getAttribute("a:has-text('Explore components')", "href"))?.includes("r=20"), "links carry the settings");
});

section("select-menu", async ({ page }) => {
  await page.goto(`${BASE}/components/select`);
  await page.click("[data-stage] [aria-haspopup=listbox]");
  await page.click("[role=option]:has-text('Dago')");
  check(await page.locator("[data-stage] [aria-haspopup=listbox]:has-text('Dago')").isVisible(), "select picks an option");

  await page.goto(`${BASE}/components/menu`);
  await page.click("main button:has-text('Actions')");
  await page.click("[role=menuitem]:has-text('Move to')");
  check(await page.locator("[role=menuitem]:has-text('To pack')").isVisible(), "submenu opens on click");
  await page.mouse.move(0, 0);
  for (let i = 0; i < 4 && (await page.locator("[role=menu]").count()); i++) {
    await page.keyboard.press("Escape");
    await sleep(100);
  }
  await page.locator("[role=menu]").first().waitFor({ state: "detached", timeout: 5000 });
  await page.focus("main button:has-text('Actions')");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.closest("[role=menu]"), null, { timeout: 5000 });
  for (let i = 0; i < 8 && !(await page.evaluate(() => document.activeElement?.textContent?.startsWith("Move to"))); i++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  const viaKey = await page.locator("[role=menuitem]:has-text('To pack')").waitFor({ timeout: 2000 }).then(() => true, () => false);
  check(viaKey, `submenu opens with ArrowRight (focused: ${await page.evaluate(() => document.activeElement?.textContent?.slice(0, 30))})`);
});

section("orders-settings", async ({ page }) => {
  await page.goto(`${BASE}/examples/orders`);
  await page.click("tbody tr >> nth=0");
  check(await page.locator("[role=dialog] >> text=You receive").isVisible(), "row click opens the side pane");
  check(await page.locator("text=1–50 of").isVisible(), "table bar shows count");

  await page.goto(`${BASE}/examples/settings`);
  await page.fill("input[aria-label='Shop name']", "Rimba Home");
  check(await page.locator("text=Unsaved changes").isVisible(), "save bar appears on edit");
});

section("page-semantics", async ({ page }) => {
  await page.goto(BASE + "/");
  await page.mouse.move(1000, 450);
  await page.keyboard.press("Tab");
  const firstTab = await page.evaluate(() => document.activeElement?.textContent?.trim());
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  await sleep(400);
  const flapAfterTabs = await page.locator("[data-customize-panel]").getAttribute("data-state");
  check(firstTab === "Skip to content" && flapAfterTabs === "closed", `Tab 1 focuses the skip link, the flap stays closed (${firstTab}, ${flapAfterTabs})`);

  await page.goto(BASE + "/examples/orders");
  check((await page.locator("a a").count()) === 0, "no nested links on /examples/orders");

  await page.goto(BASE + "/components/button");
  check((await page.title()) === "Button · Alora Design", `document title on /components/button (${await page.title()})`);

  await page.goto(BASE + "/components/pagination");
  const pagerLabels = await page.evaluate(() => [...document.querySelectorAll('[data-stage] nav[aria-label="Pages"] button[aria-label]')].map((b) => b.getAttribute("aria-label")));
  check(pagerLabels.includes("Previous page, 3") && pagerLabels.includes("Next page, 5"), `pagination arrows name their page (${JSON.stringify(pagerLabels)})`);
});

section("scroll-through", async ({ page, errors }) => {
  const beforeScroll = errors.length;
  await page.goto(BASE + "/components");
  for (let y = 0, h = await page.evaluate(() => document.documentElement.scrollHeight); y < h; y += 700) {
    await page.evaluate((top) => scrollTo(0, top), y);
    await sleep(120);
  }
  await sleep(400);
  check(errors.length === beforeScroll, `no page errors on /components after a scroll-through${errors.length > beforeScroll ? `: ${errors.slice(beforeScroll, beforeScroll + 3).join(" | ")}` : ""}`);
});

section("component-pages", async ({ page, errors }) => {
  const MORE = ["button-group", "textarea", "input-group", "input-otp", "label", "calendar", "toggle", "data-table", "item", "accordion", "collapsible", "carousel", "aspect-ratio", "typography", "chart", "line-chart", "area-chart", "pie-chart", "radar-chart", "radial-chart", "breadcrumb", "navigation-menu", "menubar", "pagination", "alert-dialog", "resizable", "scroll-area", "message", "message-scroller", "marker", "trace", "attachment", "questionnaire", "code-block", "number-dial", "password-input", "theme-switch", "step-form", "brush", "prompt-suggestions", "streaming-text", "citation", "proposed-change", "reactions"];
  const before = errors.length;
  for (const name of MORE) {
    await page.goto(`${BASE}/components/${name}`);
    const r = await page.evaluate(() => ({ h1: document.querySelector("main h1, h1")?.textContent, stage: !!document.querySelector("[data-stage]")?.children.length }));
    check(!!r.h1 && r.stage && !/No component/.test(r.h1), `/components/${name} renders (${r.h1})`);
  }
  check(errors.length === before, `new component pages throw nothing (${errors.slice(before, before + 3).join(" | ")})`);
});

section("motion-set", async ({ page }) => {
  await page.goto(BASE + "/components/number-dial");
  const dial = page.locator("[data-stage] [role=slider]");
  await dial.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const dialAfterKeys = await dial.getAttribute("aria-valuenow");
  await page.keyboard.type("42");
  await sleep(150);
  check(dialAfterKeys === "26" && (await dial.getAttribute("aria-valuenow")) === "42", `number dial: arrows step, typing sets (${dialAfterKeys}, ${await dial.getAttribute("aria-valuenow")})`);
  await page.goto(BASE + "/components/password-input");
  const pwField = page.locator("[data-stage] input[autocomplete=new-password]");
  await pwField.fill("kopi");
  const earlyError = await page.locator("[data-stage] [role=status]").count();
  await pwField.blur();
  const lateError = await page.locator("[data-stage] >> text=Use 8 or more characters").isVisible();
  await pwField.fill("Password1!");
  const common = await page.locator("[data-stage] >> text=This password is too common").isVisible();
  check(earlyError === 0 && lateError && common, `password: no error while typing, short after leaving, common at once (${earlyError}, ${lateError}, ${common})`);
  await page.goto(BASE + "/components/step-form");
  await page.click("[data-stage] button[type=submit]");
  const stayed = await page.locator("[data-stage] >> text=Choose who you’re ordering from").isVisible();
  await page.fill("#po-supplier", "Keramik Plered");
  await page.click("[data-stage] button[type=submit]");
  await sleep(400);
  check(stayed && (await page.locator("[data-stage] >> text=Piring keramik 24 cm").isVisible()), `step form: Next shows the missing field, then moves on (${stayed})`);
  await page.goto(BASE + "/components/brush");
  const row = page.locator("[data-stage] tbody tr").nth(2);
  await row.hover();
  await sleep(150);
  const linkedTip = await page.locator("[data-stage] [role=status]").first().innerText().catch(() => "");
  const rowDay = await row.locator("td").first().innerText();
  check(linkedTip.includes(rowDay), `linked highlight: hovering a row shows that day on the chart (${JSON.stringify(rowDay)} in ${JSON.stringify(linkedTip)})`);
});

section("chart-switch-pill", async ({ page }) => {
  await page.goto(BASE + "/components/line-chart");
  const svg = page.locator("[data-stage] figure svg").first();
  const sb = await svg.boundingBox();
  await page.mouse.move(sb.x + sb.width * 0.6, sb.y + sb.height / 2);
  await sleep(200);
  const tip = await page.locator("[data-stage] [role=status]").first().innerText().catch(() => "");
  check(/This fortnight/.test(tip) && /The one before/.test(tip), `line chart crosshair tooltip lists both series (${JSON.stringify(tip)})`);

  for (const size of ["default", "lg"]) {
    for (const f of [13, 15]) {
      await page.goto(`${BASE}/components/switch?size=${size}&f=${f}`);
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

  await page.goto(BASE + "/components/sliding-pill");
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
});

section("mobile-index", async ({ page }) => {
  await page.goto(BASE + "/components");
  check(!(await page.locator('[role=radiogroup][aria-label="Platform"]').count()), "/components has no Desktop | Mobile switch");
  await page.goto(BASE + "/mobile");
  const mobIndex = await page.evaluate(() => ({
    tab: document.querySelector('header a[aria-current="page"]')?.textContent,
    pieces: [...document.querySelectorAll("[data-pwa-piece]")].map((s) => s.dataset.pwaPiece),
    tiles: document.querySelectorAll("[data-mobile-screen-tile]").length,
    parts: [...new Set([...document.querySelectorAll("[data-mobile-part]")].map((a) => a.dataset.mobilePart))],
  }));
  check(mobIndex.tab === "Mobile", `/mobile: Mobile tab lit (${mobIndex.tab})`);
  const unshown = MOBILE_PWA.filter((n) => n !== "mobile-state-button" && !mobIndex.pieces.includes(n));
  check(!unshown.length, `/mobile shows every installed-app part in a phone (missing: ${unshown.join(", ") || "none"})`);
  const tiled = MOBILE.filter((n) => n !== "mobile-upload-row");
  check(mobIndex.tiles === 21 && tiled.every((n) => mobIndex.parts.includes(n)), `/mobile links every mobile component from its screens (${mobIndex.tiles} tiles; missing: ${tiled.filter((n) => !mobIndex.parts.includes(n)).join(", ") || "none"})`);
  check(await page.locator('a[data-all-screens][href^="/mobile/screens"]').count(), "/mobile links to the screens gallery");
  await page.goto(BASE + "/mobile/screens");
  const gallery = await page.evaluate(() => ({
    tiles: [...document.querySelectorAll("[data-screen-tile]")].map((t) => t.querySelector("a")?.getAttribute("href")),
    tab: document.querySelector('header a[aria-current="page"]')?.textContent,
  }));
  const wantTiles = [...APP_SCREENS.map((s) => `/mobile/app/${s}`), ...APP_STATES.map((s) => `/mobile/app/${s}`)];
  check(gallery.tiles.length === wantTiles.length && wantTiles.every((h) => gallery.tiles.some((t) => t?.split("&")[0].startsWith(h))) && gallery.tab === "Mobile", `/mobile/screens: a live phone per screen and state, each linking to its full-screen route (${gallery.tiles.length}/${wantTiles.length})`);
  for (const [from, to] of [["/components/mobile-sheet", "/mobile/mobile-sheet"]]) {
    await page.goto(BASE + from);
    check(new URL(page.url()).pathname === to, `${from} redirects to ${to} (${new URL(page.url()).pathname})`);
  }
});

section("mobile-pwa", async ({ page }) => {
  await page.goto(BASE + "/mobile/mobile-install-prompt");
  const install = page.locator("[data-phone-screen] [role=dialog] button", { hasText: "Install" }).last();
  await install.waitFor();
  const w0 = (await install.boundingBox()).width;
  await install.click();
  await sleep(250);
  const w1 = (await install.boundingBox()).width;
  await page.locator("[data-phone-screen] [role=dialog] button", { hasText: "Open" }).waitFor({ timeout: 4000 });
  check(Math.abs(w0 - w1) < 0.5, `install button keeps its width while working (${w0} → ${w1})`);
  await page.goto(BASE + "/mobile/mobile-sync-status");
  const pill = page.locator('[data-phone-screen] button[aria-label^="Sync:"]');
  await pill.waitFor();
  check(/2 waiting/.test(await pill.getAttribute("aria-label")), `offline: two changes wait on the phone (${await pill.getAttribute("aria-label")})`);
  await page.locator('[role=switch]').first().click();
  await page.waitForFunction(() => /Synced/.test(document.querySelector('[data-phone-screen] button[aria-label^="Sync:"]')?.getAttribute("aria-label") ?? ""), null, { timeout: 6000 });
  check(true, "online: the queue drains to Synced");
});

section("mobile-gestures", async ({ page }) => {
  await page.goto(BASE + "/mobile/mobile-tab-bar");
  await page.locator("[data-mobile-tab-bar] button", { hasText: "Products" }).click();
  await sleep(600);
  const tabPill = await page.evaluate(() => {
    const p = document.querySelector("[data-mobile-tab-bar] [data-sliding-pill]").getBoundingClientRect();
    const t = document.querySelector('[data-mobile-tab-bar] [aria-current="page"]').getBoundingClientRect();
    return { d: Math.round(Math.abs(p.left - t.left)), title: document.querySelector("[data-phone-screen] h1")?.textContent };
  });
  check(tabPill.d <= 1 && tabPill.title === "Products", `tab bar: the pill lands on the tapped tab and its screen opens (${JSON.stringify(tabPill)})`);

  await page.goto(BASE + "/mobile/mobile-sheet");
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
  await drag(page, await centre(page.locator("[data-phone-screen] [role=dialog] .cursor-grab").first()), 0, 320);
  await sleep(700);
  check(!(await page.locator("[data-phone-screen] [role=dialog]").count()), "sheet: dragging the handle down closes it");

  await page.goto(BASE + "/mobile/mobile-swipe-row");
  const swipeRow = page.locator("[data-phone-screen] [role=listitem]").first();
  const rc = await centre(swipeRow);
  await drag(page, { x: rc.b.x + rc.b.width * 0.6, y: rc.y }, -150, 0);
  await sleep(600);
  const swiped = await swipeRow.evaluate((el) => ({ t: el.parentElement.style.transform, packed: [...el.closest(".overflow-hidden").querySelectorAll("button")].some((b) => b.textContent.includes("Packed") && getComputedStyle(b.parentElement).visibility === "visible") }));
  check(/translate3d\(-1[45]\d/.test(swiped.t) && swiped.packed, `swipe row: a left swipe opens its actions (${JSON.stringify(swiped)})`);

  await page.goto(BASE + "/mobile/mobile-pull-refresh");
  await drag(page, await centre(page.locator("[data-phone-screen] [role=listitem]").first()), 0, 220, 16);
  await sleep(250);
  check(await page.locator('[data-phone-screen] [role=status][aria-label="Refreshing"]').count(), "pull to refresh: a long pull starts a refresh (dots, no spinner)");

  await page.goto(BASE + "/mobile/mobile-snackbar");
  await page.getByRole("button", { name: /Mark .* packed/ }).first().click();
  await sleep(600);
  const snack = await page.evaluate(() => {
    const s = document.querySelector("[data-phone-screen] [role=status]")?.getBoundingClientRect();
    const t = document.querySelector("[data-mobile-tab-bar]").getBoundingClientRect();
    return s ? { above: s.bottom <= t.top - 4, text: document.querySelector("[data-phone-screen] [role=status]").textContent } : null;
  });
  check(snack?.above && /packed/.test(snack.text) && /Undo/.test(snack.text), `snackbar sits above the tab bar with Undo (${JSON.stringify(snack)})`);

  await page.goto(BASE + "/mobile/mobile-action-bar?keyboard=1");
  await sleep(400);
  const bar = await page.evaluate(() => {
    const a = document.querySelector("[data-mobile-action-bar]").getBoundingClientRect();
    const f = document.querySelector("[data-phone-screen]").getBoundingClientRect();
    return { gap: Math.round(f.bottom - a.bottom) };
  });
  check(bar.gap >= 291, `action bar rides above the keyboard (${JSON.stringify(bar)})`);
});

section("mobile-flows", async ({ page }) => {
  await page.goto(BASE + "/mobile/app");
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

  await page.goto(BASE + "/mobile/app/login");
  await page.locator("[data-mobile-action-bar] button", { hasText: "Send code" }).click();
  await page.locator("[data-phone-screen] button", { hasText: "Your Rimba code is" }).click();
  await page.waitForFunction(() => !document.querySelector("[data-app-cover]"), null, { timeout: 8000 }).catch(() => {});
  await frames(page);
  await settled(page, "[data-app-screen]");
  check(!(await page.locator("[data-app-cover]").count()) && (await topScreen()) === "home", "app: sign in → code from the message → signed in on Home");

  await page.goto(BASE + "/mobile/mobile-context-menu");
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
  await page.locator("[data-phone-screen] [role=menu]").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  check(!(await page.locator("[data-phone-screen] [role=menu]").count()), "long-press menu: Esc closes it");

  await page.goto(BASE + "/mobile/mobile-scrub-chart");
  const chart = await centre(page.locator("[data-phone-screen] [role=slider]").first());
  await page.mouse.move(chart.b.x + 20, chart.y);
  await page.mouse.down();
  await page.mouse.move(chart.b.x + chart.b.width * 0.4, chart.y, { steps: 6 });
  const scrubbed = await page.locator("[data-phone-screen] figcaption").first().textContent();
  await page.mouse.up();
  check(/Nov|Oct/.test(scrubbed) && !/last 30 days/.test(scrubbed), `scrub chart: the readout follows the finger (${scrubbed})`);

  await page.goto(BASE + "/mobile/mobile-date-range?open=1");
  await sleep(700);
  await page.getByRole("gridcell", { name: "3 November", exact: true }).click();
  await page.getByRole("gridcell", { name: "9 November", exact: true }).click();
  const rangeBtn = await page.locator("[data-phone-screen] [role=dialog] button", { hasText: /^Show / }).textContent();
  check(/3 – 9 Nov/.test(rangeBtn), `date range: start and end taps make the range (${rangeBtn})`);

  await page.goto(BASE + "/mobile/mobile-keypad");
  await page.locator("[data-phone-screen] button", { hasText: "Exact" }).click();
  await page.getByRole("button", { name: "Delete, hold to clear" }).click();
  const amount = await page.locator("[data-phone-screen] output").textContent();
  check(amount === "Rp\u00a041.200", `keypad: Exact then Delete (${amount})`);

  await page.goto(BASE + "/mobile/mobile-modal?open=1");
  await sleep(600);
  const modalSave = page.locator("[data-phone-screen] [role=dialog] [data-mobile-action-bar] button", { hasText: "Save" });
  const saveOn = await modalSave.isEnabled();
  await modalSave.click();
  await sleep(500);
  const closedClean = !(await page.locator("[data-phone-screen] [role=dialog]").count());
  await page.goto(BASE + "/mobile/mobile-modal?open=1");
  await sleep(600);
  await page.locator("[data-phone-screen] [role=dialog] input").first().fill("Gelas kopi tanah liat, biru");
  await page.locator("[data-phone-screen] [role=dialog] header button", { hasText: "Cancel" }).click();
  await sleep(400);
  const asks = await page.locator("[data-phone-screen] [role=alertdialog]", { hasText: "Discard your changes?" }).count();
  check(saveOn && closedClean && asks, `modal: Save sits in the bottom bar and is on at once, an untouched Save closes, Cancel after an edit asks (${JSON.stringify({ saveOn, closedClean, asks })})`);

  await page.goto(BASE + "/mobile/mobile-index-list");
  const strip = await page.locator('[data-phone-screen] [role=slider][aria-label="Jump to letter"]').boundingBox();
  await page.mouse.click(strip.x + strip.width / 2, strip.y + strip.height * 0.9);
  await sleep(300);
  const jumped = await page.evaluate(() => document.querySelector("[data-phone-screen] [data-mobile-screen]").scrollTop);
  check(jumped > 600, `A–Z index: tapping a letter jumps the list (${jumped})`);

  await page.goto(BASE + "/mobile/app/approvals");
  await page.locator("[data-phone-screen] article button", { hasText: "Approve" }).first().click();
  await sleep(500);
  const approved = await page.locator("[data-phone-screen] [role=status]", { hasText: "Approved" }).textContent().catch(() => "");
  check(/Approved: Bubble wrap/.test(approved) && /Undo/.test(approved), `approvals: Approve removes the request and offers Undo (${approved})`);
});

const MOBILE_PATHS = ["/mobile", "/mobile/app", "/mobile/screens", ...MOBILE.map((n) => `/mobile/${n}`), ...MOBILE_PWA.map((n) => `/mobile/${n}`), ...APP_SCREENS.map((s) => `/mobile/app/${s}`), ...APP_STATES.map((s) => `/mobile/app/${s}`)];
for (const paths of chunks(MOBILE_PATHS, 4)) {
  section("mobile-sweep", async ({ open }) => {
    const ph = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await ph.clock.install();
    const phErrors = [];
    ph.on("pageerror", (e) => phErrors.push(e.message));
    /** Interactive things smaller than 44 × 44 inside the phone (layout size, so the frame's scale doesn't count). */
    const smallTargets = () =>
      ph.evaluate(() => {
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
    for (const path of paths) {
      phErrors.length = 0;
      await ph.goto(BASE + path);
      await ph.clock.runFor(1000);
      await frames(ph);
      await settled(ph, "*");
      const r = await ph.evaluate(() => ({
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        phone: !!(document.querySelector("[data-phone-screen]") ?? document.querySelector("[data-mobile-app]")),
        cut: Math.max(0, ...[...document.querySelectorAll("[data-phone-screen]")].map((f) => Math.round(f.getBoundingClientRect().right - document.documentElement.clientWidth))),
      }));
      const small = await smallTargets();
      const tiny = await ph.evaluate(() =>
        [...document.querySelectorAll("[data-phone-screen] input, [data-phone-screen] textarea, [data-mobile-app] input, [data-mobile-app] textarea, body > [role=dialog] input")]
          .filter((el) => !["file", "checkbox", "radio", "range", "hidden"].includes(el.type) && parseFloat(getComputedStyle(el).fontSize) < 16)
          .map((el) => el.getAttribute("aria-label") || el.id || el.type)
          .slice(0, 3),
      );
      check(!phErrors.length && r.over <= 0 && r.cut === 0 && r.phone && small.length === 0 && tiny.length === 0, `390 px ${path}: renders, no sideways scroll, touch targets ≥ 44, inputs ≥ 16 px (${JSON.stringify({ ...r, errors: phErrors.slice(0, 2), small, tiny })})`);
    }
  });
}

const edges = (cpage) =>
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
      if (b.left <= document.querySelector("[data-page]").getBoundingClientRect().left + 0.5 && b.right >= cw - 0.5) continue;
      if (st.position === "absolute" && st.zIndex === "-1") continue;
      const painted = st.backgroundColor !== "rgba(0, 0, 0, 0)" || st.boxShadow !== "none" || !el.children.length;
      if (!painted && b.right - parseFloat(st.paddingRight) <= right + 0.5) continue;
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
  section("classic-scrollbars", async ({ open }) => {
    const cpage = await open({ viewport: { width: w, height: 900 } }, await classic());
    for (const path of ["/", "/components", "/ai", "/components/select"]) {
      await cpage.goto(BASE + path);
      await cpage.mouse.move(w / 2, 450);
      await sleep(300);
      const shut = await edges(cpage);
      check((shut.bar > 0 || process.platform === "darwin") && shut.over.length === 0 && Math.abs(shut.left - shut.right) <= 1, `classic scrollbar ${w} ${path}, flap closed: nothing past the gutter, margins equal (${JSON.stringify(shut)})`);
      await cpage.locator("[data-customize-flap]").hover();
      await cpage.waitForSelector("[data-customize-panel][data-state=open]", { timeout: 5000 }).catch(() => {});
      await frames(cpage);
      await settled(cpage);
      const flapOpen = await edges(cpage);
      check(flapOpen.over.length === 0 && flapOpen.right === Math.round(flapOpen.gutter), `classic scrollbar ${w} ${path}, flap open: nothing past the gutter (${JSON.stringify(flapOpen)})`);
      await cpage.mouse.move(w - 100, 450, { steps: 4 });
      await cpage.waitForSelector("[data-customize-panel][data-state=closed]", { state: "attached", timeout: 5000 }).catch(() => {});
      await frames(cpage);
      await settled(cpage);
      const after = await edges(cpage);
      check(after.over.length === 0 && Math.abs(after.left - after.right) <= 1, `classic scrollbar ${w} ${path}, after closing: margins equal (${JSON.stringify(after)})`);
    }
  });
}
section("classic-scrollbars", async ({ open }) => {
  const cpage = await open({ viewport: { width: 1440, height: 900 } }, await classic());
  const logoX = new Set();
  for (const path of ["/", "/examples/dashboard", "/encyclopedia", "/examples/orders"]) {
    await cpage.goto(BASE + path);
    await cpage.waitForSelector("header a");
    logoX.add(await cpage.evaluate(() => Math.round(document.querySelector("header a").getBoundingClientRect().x * 10) / 10));
  }
  check(logoX.size === 1, `classic scrollbar: the header logo stays put between pages (${[...logoX].join(" vs ")})`);
  await cpage.goto(BASE + "/components");
  const inner = await cpage.evaluate(() => {
    const track = document.querySelector("[aria-roledescription=carousel] > div");
    const box = document.querySelector("[data-spot=message-scroller] .overflow-y-auto");
    const content = box.firstElementChild.getBoundingClientRect();
    return { carouselBar: track.offsetHeight - track.clientHeight, lane: Math.round(box.getBoundingClientRect().left + box.clientWidth - content.right), card: Math.round(box.closest(".rounded-card, [class*=rounded-card]").getBoundingClientRect().right - box.getBoundingClientRect().right) };
  });
  check(inner.carouselBar === 0 && inner.lane >= 8 && inner.card >= 0, `inner scroll areas: no carousel bar, message bar in its own lane (${JSON.stringify(inner)})`);
});

const declared = new Set(sections.map((s) => s.name));
const mapped = new Set(Object.keys(SECTIONS));
const drift = [...declared].filter((n) => !mapped.has(n)).concat([...mapped].filter((n) => !declared.has(n)));
if (drift.length) check(false, `smoke sections and scripts/lib/smoke-map.mjs disagree: ${drift.join(", ")}`);
const unknown = ONLY ? [...ONLY].filter((n) => !declared.has(n)) : [];
if (unknown.length) check(false, `unknown SMOKE_SECTIONS: ${unknown.join(", ")}`);

const LONG_FIRST = ["mobile-sweep", "classic-scrollbars", "mobile-flows", "component-pages"];
const rank = (s) => (LONG_FIRST.includes(s.name) ? LONG_FIRST.indexOf(s.name) : LONG_FIRST.length);
const queue = sections.filter((s) => !ONLY || ONLY.has(s.name)).sort((a, b) => rank(a) - rank(b));
const timings = [];
const unmapped = new Set();
/** The host's network changing under the browser (other jobs adding Docker networks), not a fault in the site. */
const BLIP = /ERR_NETWORK_CHANGED|Failed to fetch dynamically imported module/;
const runSection = async ({ name, run }, attempt = 1) => {
  const started = Date.now();
  const contexts = [];
  /** A page in its own context, closed when the section ends. */
  const open = async (options, on = browser) => {
    const context = await on.newContext(options);
    contexts.push(context);
    const opened = await context.newPage();
    opened.on("framenavigated", (frame) => {
      if (frame !== opened.mainFrame() || !frame.url().startsWith(BASE)) return;
      const path = new URL(frame.url()).pathname;
      const entry = routeEntry(path);
      if (!SECTIONS[name]?.always && !SECTIONS[name]?.entries?.includes(entry)) unmapped.add(`${name} visits ${path}`);
    });
    return opened;
  };
  const page = await open({ viewport: { width: 1440, height: 900 } });
  const local = [];
  page.on("pageerror", (e) => local.push(e.message));
  let crash = null;
  try {
    await inSection.run(name, () => run({ page, errors: local, open }));
  } catch (e) {
    crash = String(e?.message ?? e).split("\n")[0];
  } finally {
    await Promise.all(contexts.map((c) => c.close().catch(() => {})));
    timings.push([name, Date.now() - started]);
  }
  if (attempt === 1 && (BLIP.test(crash ?? "") || local.some((m) => BLIP.test(m)))) {
    console.log(`retry ${name}: host network blip (${crash ?? local.find((m) => BLIP.test(m))})`);
    for (let i = failures.length - 1; i >= 0; i--) if (failures[i].section === name) failures.splice(i, 1);
    return runSection({ name, run }, 2);
  }
  if (crash) inSection.run(name, () => check(false, `section ${name} crashed (${crash})`));
  allErrors.push(...local);
};
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) await runSection(next);
  }),
);
check(unmapped.size === 0, `smoke map names every route its sections visit${unmapped.size ? ` (${[...unmapped].slice(0, 8).join("; ")})` : ""}`);
check(allErrors.length === 0, `no page errors${allErrors.length ? `: ${allErrors.slice(0, 3).join(" | ")}` : ""}`);

console.log(`${WORKERS} workers, ${(timings.reduce((sum, [, ms]) => sum + ms, 0) / 1000).toFixed(0)}s of section work`);
console.log(`slowest sections: ${timings.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, ms]) => `${n} ${(ms / 1000).toFixed(1)}s`).join(", ")}`);

await classicBrowser?.then((b) => b.close());
await browser.close();
server.kill("SIGTERM");
console.log(failures.length ? `SMOKE FAIL (${failures.length})` : "SMOKE PASS");
process.exit(failures.length ? 1 : 0);
