import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

let initPromise: Promise<void> | null = null;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rifas (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      prize_name TEXT,
      prize_value_cents INTEGER DEFAULT 0,
      prize_image TEXT,
      ticket_price_cents INTEGER NOT NULL DEFAULT 0,
      min_tickets INTEGER DEFAULT 1,
      max_tickets_per_order INTEGER DEFAULT 10000,
      total_tickets INTEGER DEFAULT 100000,
      sorteo_date TEXT,
      sorteo_time TEXT,
      sorteo_place TEXT,
      sorteo_note TEXT,
      draw_mechanic TEXT,
      status TEXT DEFAULT 'borrador',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      rifa_id INTEGER NOT NULL REFERENCES rifas(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      ticket_quantity INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      receipt_data TEXT,
      receipt_mime TEXT,
      receipt_filename TEXT,
      referral_code TEXT,
      status TEXT DEFAULT 'pendiente',
      admin_note TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      rifa_id INTEGER NOT NULL REFERENCES rifas(id),
      order_id INTEGER NOT NULL REFERENCES orders(id),
      number TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (rifa_id, number)
    );

    CREATE TABLE IF NOT EXISTS winners (
      id SERIAL PRIMARY KEY,
      rifa_id INTEGER NOT NULL REFERENCES rifas(id),
      order_id INTEGER,
      ticket_number TEXT,
      prize_label TEXT,
      announced_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS vendedores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(rifa_id, number);
    CREATE INDEX IF NOT EXISTS idx_orders_rifa ON orders(rifa_id);
  `);

  // Migraciones ligeras (columnas agregadas con posterioridad)
  const orderCols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'"
  );
  const orderColNames = orderCols.rows.map((r) => r.column_name);
  if (!orderColNames.includes("referral_code")) {
    await pool.query("ALTER TABLE orders ADD COLUMN referral_code TEXT");
  }

  // Índices que dependen de columnas migradas (van DESPUÉS del ALTER, si no
  // falla con "column does not exist" en bases ya existentes)
  await pool.query("CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(referral_code)");

  await seed();
}

async function seed() {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM rifas WHERE slug = $1",
    ["rifa-10-playstation-5"]
  );
  if (rowCount === 0) {
    await pool.query(
      `INSERT INTO rifas
        (slug, name, tagline, description, prize_name, prize_value_cents, prize_image,
         ticket_price_cents, min_tickets, max_tickets_per_order, total_tickets,
         sorteo_date, sorteo_time, sorteo_place, sorteo_note, draw_mechanic, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        "rifa-10-playstation-5",
        "Rifa 10 PlayStation 5",
        "Tu consola de nueva generación, a un boleto de distancia",
        "Sorteo de diez (10) consolas PlayStation 5 Slim. Cinco sorteos en vivo, dos ganadores por sorteo (número de 4 dígitos al derecho y al revés).",
        "PlayStation 5 Slim",
        4999 * 100,
        "/rifas/ps5.jpg",
        10000, // RD$100 por boleto
        1, // mínimo 1 boleto
        1000, // máximo por orden
        10000, // espacio de 4 dígitos (0000-9999)
        null,
        null,
        "En vivo — Instagram",
        "Se anunciará al 60% vendido",
        "PICK 3 Lotería de Florida + comodín (4 dígitos), al derecho y al revés. 5 sorteos × 2 ganadores = 10 premios. El sorteo se celebra al alcanzar el 60% de boletos vendidos.",
        "activa",
      ]
    );
  } else {
    // Actualizar valores de la mecánica existente (precio, total, min/max, mecánica)
    await pool.query(
      `UPDATE rifas SET
        ticket_price_cents = 10000,
        min_tickets = 1,
        max_tickets_per_order = 1000,
        total_tickets = 10000,
        draw_mechanic = 'PICK 3 Lotería de Florida + comodín (4 dígitos), al derecho y al revés. 5 sorteos × 2 ganadores = 10 premios. El sorteo se celebra al alcanzar el 60% de boletos vendidos.',
        description = 'Sorteo de diez (10) consolas PlayStation 5 Slim. Cinco sorteos en vivo, dos ganadores por sorteo (número de 4 dígitos al derecho y al revés).'
       WHERE slug = 'rifa-10-playstation-5'`
    );
  }
}

export function ensureDb(): Promise<void> {
  if (!initPromise) initPromise = init();
  return initPromise;
}

export { pool };
