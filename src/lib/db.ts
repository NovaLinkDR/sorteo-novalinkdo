import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sorteo.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS rifas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  rifa_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  ticket_quantity INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  receipt_path TEXT,
  status TEXT DEFAULT 'pendiente',
  admin_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (rifa_id) REFERENCES rifas(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rifa_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  number TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (rifa_id, number),
  FOREIGN KEY (rifa_id) REFERENCES rifas(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rifa_id INTEGER NOT NULL,
  order_id INTEGER,
  ticket_number TEXT,
  prize_label TEXT,
  announced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (rifa_id) REFERENCES rifas(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(rifa_id, number);
CREATE INDEX IF NOT EXISTS idx_orders_rifa ON orders(rifa_id);
`);

// Migraciones ligeras
const rifaCols = db.prepare("PRAGMA table_info(rifas)").all() as {
  name: string;
}[];
if (!rifaCols.some((c) => c.name === "sorteo_note")) {
  db.exec("ALTER TABLE rifas ADD COLUMN sorteo_note TEXT");
}

export interface Rifa {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  prize_name: string | null;
  prize_value_cents: number;
  prize_image: string | null;
  ticket_price_cents: number;
  min_tickets: number;
  max_tickets_per_order: number;
  total_tickets: number;
  sorteo_date: string | null;
  sorteo_time: string | null;
  sorteo_place: string | null;
  sorteo_note: string | null;
  draw_mechanic: string | null;
  status: string;
  created_at: string;
}

export interface Order {
  id: number;
  code: string;
  rifa_id: number;
  name: string;
  phone: string;
  email: string | null;
  ticket_quantity: number;
  total_cents: number;
  receipt_path: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  rifa_id: number;
  order_id: number;
  number: string;
  created_at: string;
}

/** Devuelve una conexión única (mejor-sqlite3 es síncrono). */
export function getDb(): Database.Database {
  return db;
}

/** Genera un código de orden corto y legible. */
export function genOrderCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return "ORD-" + n;
}

/** Genera N números de 5 dígitos únicos (sin repetición) para una rifa. */
export function genTicketNumbers(
  rifaId: number,
  count: number,
  total: number
): string[] {
  const max = Math.min(total, 100000); // 5 dígitos => 00000..99999
  const existing = new Set<string>();
  const rows = db
    .prepare("SELECT number FROM tickets WHERE rifa_id = ?")
    .all(rifaId) as { number: string }[];
  for (const r of rows) existing.add(r.number);

  const result: string[] = [];
  let guard = 0;
  while (result.length < count && guard < count * 1000) {
    guard++;
    const num = Math.floor(Math.random() * max)
      .toString()
      .padStart(5, "0");
    if (!existing.has(num)) {
      existing.add(num);
      result.push(num);
    }
  }
  return result;
}

/** Seed: crea la rifa PS5 si no existe. */
export function seed() {
  const existing = db
    .prepare("SELECT id FROM rifas WHERE slug = ?")
    .get("rifa-10-playstation-5");
  if (!existing) {
    db.prepare(
      `INSERT INTO rifas
        (slug, name, tagline, description, prize_name, prize_value_cents, prize_image,
         ticket_price_cents, min_tickets, max_tickets_per_order, total_tickets,
         sorteo_date, sorteo_time, sorteo_place, sorteo_note, draw_mechanic, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "rifa-10-playstation-5",
      "Rifa 10 PlayStation 5",
      "Tu consola de nueva generación, a un boleto de distancia",
      "Sorteo de diez (10) consolas PlayStation 5 Slim. Cinco sorteos en vivo, dos ganadores por sorteo (número al derecho y al revés).",
      "PlayStation 5 Slim",
      4999 * 100, // ~US$499
      "/rifas/ps5.jpg",
      1000, // RD$10.00 por boleto
      10, // mínimo 10 boletos
      10000, // máximo por orden
      100000, // espacio de 5 dígitos
      null,
      null,
      "En vivo — Instagram",
      "Se anunciará al 60% vendido",
      "PICK 4 Lotería de Florida + comodín (5 dígitos), al derecho y al revés. 5 sorteos × 2 ganadores = 10 premios. El sorteo se celebra al alcanzar el 60% de boletos vendidos.",
      "activa"
    );
  }
}

seed();

export default db;
