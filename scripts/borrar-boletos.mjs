import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = "C:/Users/bueno/Documents/sorteo-novalinkdo";
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const q = async (s, p = []) => (await pool.query(s, p)).rows;

console.log("--- ANTES ---");
console.table(await q(`SELECT id, code, name, phone, ticket_quantity, status FROM orders ORDER BY id`));
console.table(await q(`SELECT id, rifa_id, order_id, number FROM tickets ORDER BY id`));

// Borrar TODO rastro de prueba: boletos + pedidos (ambos eran pruebas)
await q("DELETE FROM tickets");
await q("DELETE FROM orders");

// Revisar si quedaron filas de rifas temporales de la prueba de concurrencia
const temp = await q("SELECT id, slug FROM rifas WHERE slug LIKE '__test_lock%'");
if (temp.length) {
  for (const { id } of temp) {
    await q("DELETE FROM tickets WHERE rifa_id=$1", [id]);
    await q("DELETE FROM orders  WHERE rifa_id=$1", [id]);
    await q("DELETE FROM rifas   WHERE id=$1", [id]);
  }
  console.log(`  (limpiadas ${temp.length} rifas temporales restantes)`);
}

console.log("\n--- DESPUES ---");
console.table(await q(`SELECT
  (SELECT COUNT(*) FROM orders)::int   AS orders,
  (SELECT COUNT(*) FROM tickets)::int  AS tickets,
  (SELECT COUNT(*) FROM winners)::int  AS winners,
  (SELECT COUNT(*) FROM vendedores)::int AS vendedores,
  (SELECT COUNT(*) FROM rifas)::int    AS rifas`));
console.table(await q(`SELECT id, slug, name, total_tickets, min_tickets, max_tickets_per_order, ticket_price_cents, status FROM rifas ORDER BY id`));

await pool.end();
