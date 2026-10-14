/**
 * Mide el desbordamiento horizontal en emulacion de telefono (iPhone 375px)
 * y lista los elementos culpables. Usa CDP sobre Chrome headless.
 */
import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const BASE = "https://sorteo.novalinkdo.com";
const PAGES = ["/", "/rifas", "/rifa/rifa-10-playstation-5", "/verificar", "/ganadores"];

const child = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=C:/Users/bueno/AppData/Local/Temp/chrome-cdp-mob",
    "about:blank",
  ],
  { stdio: "ignore" }
);

async function waitDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("DevTools no responde");
}

await waitDevtools();
const target = await (
  await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
).json();

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res) => (ws.onopen = res));

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else events.push(msg);
};
function send(method, params = {}) {
  const myId = ++id;
  ws.send(JSON.stringify({ id: myId, method, params }));
  return new Promise((res) => pending.set(myId, res));
}

await send("Page.enable");
await send("Runtime.enable");
// Emulacion de telefono: viewport CSS de 375px, movil, DPR 3
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 3,
  mobile: true,
});

const probe = `(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 || r.right > vw + 1 || r.left < -1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 70),
        w: Math.round(r.width), l: Math.round(r.left), r: Math.round(r.right),
        txt: (el.textContent || '').trim().slice(0, 34),
      });
    }
  });
  return JSON.stringify({ vw, sw: de.scrollWidth, bw: document.body.scrollWidth, n: out.length, offenders: out.slice(0, 14) });
})()`;

for (const p of PAGES) {
  events.length = 0;
  await send("Page.navigate", { url: BASE + p });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), 20000);
    const tick = setInterval(() => {
      if (events.some((e) => e.method === "Page.loadEventFired")) {
        clearInterval(tick);
        clearTimeout(t);
        res();
      }
    }, 100);
  });
  await new Promise((r) => setTimeout(r, 2500)); // que renderice React y carguen datos
  const r = await send("Runtime.evaluate", {
    expression: probe,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = JSON.parse(r.result.result.value);
  const overflow = data.sw - data.vw;
  console.log(
    `\n${p.padEnd(30)} viewport=${data.vw}  scrollWidth=${data.sw}  ` +
      (overflow > 1 ? `DESBORDA +${overflow}px  <-- MAL` : "OK")
  );
  if (data.n) console.table(data.offenders);
}

ws.close();
child.kill();
console.log("");
