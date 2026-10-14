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

console.log("--- conexiones activas ---");
console.table(await q(`SELECT pid, state, left(query,60) AS q, now()-state_change AS dur
  FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()`));

console.log("--- respaldo ---");
const backup = {
  fecha: new Date().toISOString(),
  orders: await q("SELECT * FROM orders"),
  tickets: await q("SELECT * FROM tickets"),
  winners: await q("SELECT * FROM winners"),
};
fs.mkdirSync(path.join(root, "backups"), { recursive: true });
const file = path.join(root, "backups", `respaldo-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(backup, null, 2));
console.log(`  orders=${backup.orders.length} tickets=${backup.tickets.length} -> ${file}`);

console.log("--- limpiar rifas temporales de la prueba ---");
const temp = await q("SELECT id FROM rifas WHERE slug LIKE '__test_lock%'");
for (const { id } of temp) {
  await q("DELETE FROM tickets WHERE rifa_id=$1", [id]);
  await q("DELETE FROM orders  WHERE rifa_id=$1", [id]);
  await q("DELETE FROM rifas   WHERE id=$1", [id]);
}
console.log(`  rifas temporales borradas: ${temp.length}`);

await pool.end();
