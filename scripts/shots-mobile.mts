/** Capturas full-page en emulacion de iPhone (375px) via CDP. */
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const BASE = "https://sorteo.novalinkdo.com";
const OUT = "C:/Users/bueno/Documents/sorteo-novalinkdo/shots";
const PAGES = [
  ["admin", "/admin"],
  ["vendedor", "/vendedor"],
];

const child = spawn(
  CHROME,
  [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=C:/Users/bueno/AppData/Local/Temp/chrome-cdp-cap",
    "about:blank",
  ],
  { stdio: "ignore" }
);

for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 300));
}
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res) => (ws.onopen = res));

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else events.push(msg);
};
const send = (method, params = {}) => {
  const myId = ++id;
  ws.send(JSON.stringify({ id: myId, method, params }));
  return new Promise((res) => pending.set(myId, res));
};

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

for (const [name, p] of PAGES) {
  events.length = 0;
  await send("Page.navigate", { url: BASE + p });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout " + p)), 20000);
    const tick = setInterval(() => {
      if (events.some((e) => e.method === "Page.loadEventFired")) { clearInterval(tick); clearTimeout(t); res(); }
    }, 100);
  });
  await new Promise((r) => setTimeout(r, 3000));
  const lm = await send("Page.getLayoutMetrics");
  const h = Math.min(Math.ceil(lm.result.cssContentSize.height), 6000);
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 375, height: h, scale: 1 },
  });
  const file = `${OUT}/p-${name}.png`;
  fs.writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  console.log(`${name.padEnd(10)} ${375}x${h}  -> ${file}`);
}
ws.close();
child.kill();
