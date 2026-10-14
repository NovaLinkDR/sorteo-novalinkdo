import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const API = "https://h5pjlau67p0274rthx9hu870.smarttesting.com.do";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Novalink3e785753!";
const DEST = "rsbueno25@gmail.com";

const root = "C:/Users/bueno/Documents/sorteo-novalinkdo";
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// PNG 1x1 valido para el comprobante
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

console.log(`\n=== 1) COMPRA REAL en ${API}/api/participar ===`);
const fd = new FormData();
fd.append("rifaId", "1");
fd.append("name", "PRUEBA CORREO");
fd.append("phone", "8090000000");
fd.append("email", DEST);
fd.append("quantity", "1");
fd.append("receipt", new Blob([png], { type: "image/png" }), "prueba.png");

const buy = await fetch(`${API}/api/participar`, { method: "POST", body: fd });
const buyBody = await buy.json().catch(() => ({}));
console.log(`  status=${buy.status}`);
console.log(`  orden=${buyBody?.order?.code} id=${buyBody?.order?.id} boletos=${JSON.stringify(buyBody?.tickets)}`);
const orderId = buyBody?.order?.id;
if (!orderId) {
  console.log("  respuesta:", JSON.stringify(buyBody).slice(0, 300));
  await pool.end();
  process.exit(1);
}

console.log(`\n=== 2) LOGIN admin ===`);
const login = await fetch(`${API}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: ADMIN_PASSWORD }),
});
console.log(`  status=${login.status}`);
const cookies = login.headers.getSetCookie?.() || [];
const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
if (!login.ok) {
  console.log("  login falló; no se puede continuar");
  await pool.query("DELETE FROM tickets WHERE order_id=$1", [orderId]);
  await pool.query("DELETE FROM orders WHERE id=$1", [orderId]);
  await pool.end();
  process.exit(1);
}

console.log(`\n=== 3) REENVIO de correo (POST /api/admin/orders/${orderId}) ===`);
const re = await fetch(`${API}/api/admin/orders/${orderId}`, {
  method: "POST",
  headers: { Cookie: cookie },
});
const reBody = await re.text();
console.log(`  status=${re.status}`);
console.log(`  body=${reBody.slice(0, 400)}`);

console.log(`\n=== 4) LIMPIEZA de la orden de prueba ${orderId} ===`);
await pool.query("DELETE FROM tickets WHERE order_id=$1", [orderId]);
await pool.query("DELETE FROM orders WHERE id=$1", [orderId]);
const cnt = await pool.query("SELECT COUNT(*)::int c FROM orders");
console.log(`  pedidos restantes: ${cnt.rows[0].c}`);

await pool.end();

console.log(
  `\nVEREDICTO: ${
    re.status === 200
      ? "EL CORREO FUNCIONA ✔ (Zoho aceptó el envío)"
      : re.status === 503
        ? "SMTP SIN CONFIGURAR en Coolify ✘"
        : "EL CORREO FALLA ✘ -> ver el error de arriba"
  }\n`
);
