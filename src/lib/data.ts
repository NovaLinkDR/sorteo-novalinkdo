import { pool, ensureDb } from "./db";

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
  created_at: string | Date;
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
  receipt_data: string | null;
  receipt_mime: string | null;
  receipt_filename: string | null;
  status: string;
  admin_note: string | null;
  created_at: string | Date;
}

export interface Ticket {
  id: number;
  rifa_id: number;
  order_id: number;
  number: string;
  created_at: string | Date;
}

export function genOrderCode(): string {
  return "ORD-" + Math.floor(100000 + Math.random() * 900000);
}

export async function listRifas(activeOnly = true): Promise<Rifa[]> {
  await ensureDb();
  const { rows } = await pool.query(
    activeOnly
      ? "SELECT * FROM rifas WHERE status = 'activa' ORDER BY id ASC"
      : "SELECT * FROM rifas ORDER BY id ASC"
  );
  return rows as Rifa[];
}

export async function getRifaBySlug(slug: string): Promise<Rifa | undefined> {
  await ensureDb();
  const { rows } = await pool.query("SELECT * FROM rifas WHERE slug = $1", [
    slug,
  ]);
  return rows[0] as Rifa | undefined;
}

export async function getRifaById(id: number): Promise<Rifa | undefined> {
  await ensureDb();
  const { rows } = await pool.query("SELECT * FROM rifas WHERE id = $1", [id]);
  return rows[0] as Rifa | undefined;
}

export interface RifaStats {
  ticketsSold: number;
  ticketsConfirmed: number;
  ticketsPending: number;
  revenueCents: number;
  revenueConfirmedCents: number;
  ordersCount: number;
  pendingOrders: number;
  confirmedOrders: number;
  progress: number;
}

export async function getRifaStats(rifaId: number): Promise<RifaStats> {
  await ensureDb();
  const rifa = await getRifaById(rifaId);
  const tickets = await pool.query(
    "SELECT COUNT(*)::int AS c FROM tickets WHERE rifa_id = $1",
    [rifaId]
  );
  const confirmed = await pool.query(
    "SELECT COUNT(*)::int AS c, COALESCE(SUM(total_cents),0)::int AS rev FROM orders WHERE rifa_id = $1 AND status = 'confirmado'",
    [rifaId]
  );
  const pending = await pool.query(
    "SELECT COUNT(*)::int AS c, COALESCE(SUM(total_cents),0)::int AS rev FROM orders WHERE rifa_id = $1 AND status = 'pendiente'",
    [rifaId]
  );
  const total = rifa?.total_tickets || 1;
  return {
    ticketsSold: tickets.rows[0].c,
    ticketsConfirmed: confirmed.rows[0].c,
    ticketsPending: pending.rows[0].c,
    revenueCents: confirmed.rows[0].rev + pending.rows[0].rev,
    revenueConfirmedCents: confirmed.rows[0].rev,
    ordersCount: confirmed.rows[0].c + pending.rows[0].c,
    pendingOrders: pending.rows[0].c,
    confirmedOrders: confirmed.rows[0].c,
    progress: Math.min(1, tickets.rows[0].c / total),
  };
}

export async function listOrders(rifaId?: number): Promise<Order[]> {
  await ensureDb();
  const { rows } = rifaId
    ? await pool.query(
        "SELECT * FROM orders WHERE rifa_id = $1 ORDER BY id DESC",
        [rifaId]
      )
    : await pool.query("SELECT * FROM orders ORDER BY id DESC");
  return rows as Order[];
}

export async function getOrder(id: number): Promise<Order | undefined> {
  await ensureDb();
  const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return rows[0] as Order | undefined;
}

export async function getOrderByCode(code: string): Promise<Order | undefined> {
  await ensureDb();
  const { rows } = await pool.query("SELECT * FROM orders WHERE code = $1", [
    code,
  ]);
  return rows[0] as Order | undefined;
}

export async function getOrderTickets(orderId: number): Promise<Ticket[]> {
  await ensureDb();
  const { rows } = await pool.query(
    "SELECT * FROM tickets WHERE order_id = $1 ORDER BY number ASC",
    [orderId]
  );
  return rows as Ticket[];
}

export async function verifyTicket(
  number: string,
  rifaId?: number
): Promise<(Ticket & { status: string; order_code: string; name: string }) | null> {
  await ensureDb();
  const { rows } = rifaId
    ? await pool.query(
        `SELECT t.*, o.status, o.code AS order_code, o.name
         FROM tickets t JOIN orders o ON o.id = t.order_id
         WHERE t.rifa_id = $1 AND t.number = $2`,
        [rifaId, number]
      )
    : await pool.query(
        `SELECT t.*, o.status, o.code AS order_code, o.name
         FROM tickets t JOIN orders o ON o.id = t.order_id
         WHERE t.number = $1`,
        [number]
      );
  return (rows[0] as any) || null;
}

async function genTicketNumbers(
  rifaId: number,
  count: number,
  total: number
): Promise<string[]> {
  const max = Math.min(total, 100000);
  const { rows } = await pool.query(
    "SELECT number FROM tickets WHERE rifa_id = $1",
    [rifaId]
  );
  const existing = new Set<string>(rows.map((r) => r.number));
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

export interface OrderInput {
  rifaId: number;
  name: string;
  phone: string;
  email?: string;
  ticketQuantity: number;
  receiptData?: string;
  receiptMime?: string;
  receiptFilename?: string;
}

export async function createOrder(input: OrderInput): Promise<{
  order: Order;
  tickets: Ticket[];
}> {
  await ensureDb();
  const rifa = await getRifaById(input.rifaId);
  if (!rifa) throw new Error("Rifa no encontrada");
  const total = input.ticketQuantity * rifa.ticket_price_cents;
  const code = genOrderCode();
  const numbers = await genTicketNumbers(
    rifa.id,
    input.ticketQuantity,
    rifa.total_tickets
  );
  if (numbers.length < input.ticketQuantity) {
    throw new Error("No hay suficientes números disponibles para esta rifa");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(
      `INSERT INTO orders
        (code, rifa_id, name, phone, email, ticket_quantity, total_cents,
         receipt_data, receipt_mime, receipt_filename, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pendiente')
       RETURNING *`,
      [
        code,
        rifa.id,
        input.name,
        input.phone,
        input.email || null,
        input.ticketQuantity,
        total,
        input.receiptData || null,
        input.receiptMime || null,
        input.receiptFilename || null,
      ]
    );
    const order = orderRes.rows[0] as Order;
    for (const n of numbers) {
      await client.query(
        "INSERT INTO tickets (rifa_id, order_id, number) VALUES ($1,$2,$3)",
        [rifa.id, order.id, n]
      );
    }
    await client.query("COMMIT");
    return { order, tickets: await getOrderTickets(order.id) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function setOrderStatus(
  id: number,
  status: string,
  note?: string
) {
  await ensureDb();
  await pool.query("UPDATE orders SET status = $1, admin_note = $2 WHERE id = $3", [
    status,
    note || null,
    id,
  ]);
}

export async function listWinners(rifaId?: number) {
  await ensureDb();
  const { rows } = rifaId
    ? await pool.query(
        `SELECT w.*, r.name AS rifa_name, o.name AS winner_name
         FROM winners w
         LEFT JOIN rifas r ON r.id = w.rifa_id
         LEFT JOIN orders o ON o.id = w.order_id
         WHERE w.rifa_id = $1 ORDER BY w.id DESC`,
        [rifaId]
      )
    : await pool.query(
        `SELECT w.*, r.name AS rifa_name, o.name AS winner_name
         FROM winners w
         LEFT JOIN rifas r ON r.id = w.rifa_id
         LEFT JOIN orders o ON o.id = w.order_id
         ORDER BY w.id DESC`
      );
  return rows;
}

export async function addWinner(
  rifaId: number,
  ticketNumber: string,
  prizeLabel: string,
  orderId?: number
) {
  await ensureDb();
  await pool.query(
    `INSERT INTO winners (rifa_id, order_id, ticket_number, prize_label) VALUES ($1,$2,$3,$4)`,
    [rifaId, orderId || null, ticketNumber, prizeLabel]
  );
}

export async function removeWinner(id: number) {
  await ensureDb();
  await pool.query("DELETE FROM winners WHERE id = $1", [id]);
}
