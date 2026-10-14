import fs from "fs";
import pg from "pg";

// Carga .env manual
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

const q = async (label, sql, params = []) => {
  const { rows } = await pool.query(sql, params);
  console.log(`\n=== ${label} ===`);
  console.table(rows);
};

await q(
  "rifas",
  "SELECT id, slug, name, total_tickets, min_tickets, max_tickets_per_order, ticket_price_cents, status FROM rifas ORDER BY id"
);
await q("conteos", `SELECT
  (SELECT COUNT(*) FROM orders)::int AS orders,
  (SELECT COUNT(*) FROM tickets)::int AS tickets,
  (SELECT COUNT(*) FROM winners)::int AS winners,
  (SELECT COUNT(*) FROM vendedores)::int AS vendedores`);

await q(
  "orders",
  "SELECT id, code, name, phone, email, ticket_quantity, status, created_at FROM orders ORDER BY id"
);

await q(
  "tickets",
  "SELECT id, rifa_id, order_id, number, created_at FROM tickets ORDER BY id"
);

await q(
  "duplicados GLOBALES (mismo numero en la misma rifa)",
  `SELECT rifa_id, number, COUNT(*)::int AS veces
   FROM tickets GROUP BY rifa_id, number HAVING COUNT(*) > 1 ORDER BY veces DESC`
);

await q(
  "duplicados POR USUARIO/PEDIDO (mismo numero en el mismo pedido)",
  `SELECT order_id, number, COUNT(*)::int AS veces
   FROM tickets GROUP BY order_id, number HAVING COUNT(*) > 1`
);

await q(
  "numeros fuera de rango 0000-9999",
  `SELECT * FROM tickets WHERE number !~ '^[0-9]{4}$' OR number::int > 9999`
);

await q(
  "uniques/indices en tickets",
  `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tickets'`
);

await pool.end();
