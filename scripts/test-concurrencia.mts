/**
 * Prueba de concurrencia: ¿pueden repetirse números de boleto?
 *
 * 1) ARREGLADO (con pg_advisory_xact_lock): 15 compras simultáneas -> 0 repetidos, 0 fallos.
 * 2) CONTROL (código viejo, sin lock):      15 compras simultáneas -> debe producir repetidos/fallos.
 *
 * Usa dos rifas TEMPORALES (status 'borrador', invisibles al público) y las borra al final.
 */
import fs from "node:fs";
import path from "node:path";

// Cargar .env ANTES de importar db.ts (el Pool lee process.env al crearse)
const envTxt = fs.readFileSync(path.resolve("C:/Users/bueno/Documents/sorteo-novalinkdo/.env"), "utf8");
for (const line of envTxt.split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
for (const k of ["DATABASE_SSL", "FRONTEND_ORIGIN", "PUBLIC_SITE_URL"]) delete process.env[k];

const { pool } = await import("../src/lib/db.ts");
const { createOrder } = await import("../src/lib/data.ts");

async function makeRifa(slug: string, total: number): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO rifas (slug, name, tagline, description, prize_name, prize_value_cents,
       ticket_price_cents, min_tickets, max_tickets_per_order, total_tickets, status)
     VALUES ($1,$2,'prueba','prueba','TEST',0,10000,1,$3,$4,'borrador') RETURNING id`,
    [slug, "TEST " + slug, total, total]
  );
  return rows[0].id as number;
}

async function cleanup(rifaId: number) {
  const { rows } = await pool.query("SELECT id FROM orders WHERE rifa_id=$1", [rifaId]);
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await pool.query("DELETE FROM tickets WHERE order_id = ANY($1::int[])", [ids]);
    await pool.query("DELETE FROM orders  WHERE id       = ANY($1::int[])", [ids]);
  }
  await pool.query("DELETE FROM winners WHERE rifa_id=$1", [rifaId]);
  await pool.query("DELETE FROM rifas   WHERE id=$1", [rifaId]);
}

// ===== CONTROL: réplica del código ANTES del arreglo (genera fuera de la transacción) =====
async function createOrderUnlocked(rifaId: number, total: number, name: string, phone: string) {
  const { rows } = await pool.query("SELECT number FROM tickets WHERE rifa_id=$1", [rifaId]);
  const existing = new Set<string>(rows.map((r) => r.number));
  const digits = String(Math.max(total - 1, 0)).length;
  const max = Math.min(total, 100000);
  let num = "";
  do {
    num = Math.floor(Math.random() * max).toString().padStart(digits, "0");
  } while (existing.has(num));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const o = await client.query(
      `INSERT INTO orders (code, rifa_id, name, phone, ticket_quantity, total_cents, status)
       VALUES ($1,$2,$3,$4,1,10000,'pendiente') RETURNING id`,
      ["ORD-T" + Math.random().toString(36).slice(2, 8), rifaId, name, phone]
    );
    await client.query("INSERT INTO tickets (rifa_id, order_id, number) VALUES ($1,$2,$3)", [
      rifaId,
      o.rows[0].id,
      num,
    ]);
    await client.query("COMMIT");
    return num;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

const N = 15;
const TOTAL = 20;

console.log(`\n===== PRUEBA 1: codigo ARREGLADO (advisory lock) — ${N} compras simultaneas, rifa de ${TOTAL} =====`);
const A = await makeRifa("__test_lock_fixed__", TOTAL);
const resA = await Promise.allSettled(
  Array.from({ length: N }, (_, i) =>
    createOrder({ rifaId: A, name: `Sim${i}`, phone: `809000000${String(i).padStart(2, "0")}`, ticketQuantity: 1 })
  )
);
const okA = resA.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<any>[];
const failA = resA.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
const numsA = okA.map((r) => r.value.tickets[0].number);
const dbA = (await pool.query("SELECT number FROM tickets WHERE rifa_id=$1", [A])).rows.map((r) => r.number);
console.log(`  exitos=${okA.length} fallos=${failA.length}`);
if (failA.length) console.log("  errores:", failA.map((f) => String(f.reason?.message).slice(0, 90)));
console.log(`  numeros devueltos unicos=${new Set(numsA).size}/${numsA.length}  |  en BD unicos=${new Set(dbA).size}/${dbA.length}`);
console.log(`  numeros: ${[...numsA].sort().join(", ")}`);

console.log(`\n===== PRUEBA 2: CONTROL (codigo VIEJO, sin lock) — ${N} compras simultaneas, rifa de ${TOTAL} =====`);
const B = await makeRifa("__test_lock_old__", TOTAL);
const resB = await Promise.allSettled(
  Array.from({ length: N }, (_, i) => createOrderUnlocked(B, TOTAL, `Old${i}`, `809111111${String(i).padStart(2, "0")}`))
);
const okB = resB.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<string>[];
const failB = resB.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
const numsB = okB.map((r) => r.value);
console.log(`  exitos=${okB.length} fallos=${failB.length}`);
if (failB.length) console.log("  errores:", [...new Set(failB.map((f) => String(f.reason?.message).slice(0, 70)))]);

// En el control, ¿hubo números repetidos entre las órdenes que SÍ se guardaron?
const dbB = (await pool.query("SELECT number FROM tickets WHERE rifa_id=$1", [B])).rows.map((r) => r.number);
console.log(`  numeros unicos guardados=${new Set(dbB).size}/${dbB.length}  (si < guardados => hubo repetidos)`);
console.log(`  duplicados en BD: ${dbB.length - new Set(dbB).size}`);

await cleanup(A);
await cleanup(B);
await pool.end();

const pass1 = failA.length === 0 && new Set(numsA).size === N && new Set(dbA).size === N;
console.log(`\nRESULTADO PRUEBA 1 (arreglado): ${pass1 ? "PASA ✔  0 repetidos, 0 fallos" : "FALLA ✘"}`);
console.log(`RESULTADO PRUEBA 2 (control)  : ${failB.length > 0 ? "como se esperaba, el codigo viejo falla ✘ bajo concurrencia" : "sin fallos en esta corrida (aleatorio)"}\n`);
