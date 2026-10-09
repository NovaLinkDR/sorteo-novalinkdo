import db, {
  Rifa,
  Order,
  Ticket,
  genOrderCode,
  genTicketNumbers,
} from "./db";

export function listRifas(activeOnly = true): Rifa[] {
  const rows = db
    .prepare(
      activeOnly
        ? "SELECT * FROM rifas WHERE status = 'activa' ORDER BY id ASC"
        : "SELECT * FROM rifas ORDER BY id ASC"
    )
    .all() as Rifa[];
  return rows;
}

export function getRifaBySlug(slug: string): Rifa | undefined {
  return db.prepare("SELECT * FROM rifas WHERE slug = ?").get(slug) as
    | Rifa
    | undefined;
}

export function getRifaById(id: number): Rifa | undefined {
  return db.prepare("SELECT * FROM rifas WHERE id = ?").get(id) as
    | Rifa
    | undefined;
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
  progress: number; // 0..1 sobre total_tickets
}

export function getRifaStats(rifaId: number): RifaStats {
  const rifa = getRifaById(rifaId);
  const tickets = db
    .prepare("SELECT COUNT(*) AS c FROM tickets WHERE rifa_id = ?")
    .get(rifaId) as { c: number };

  const confirmed = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(total_cents),0) AS rev FROM orders
       WHERE rifa_id = ? AND status = 'confirmado'`
    )
    .get(rifaId) as { c: number; rev: number };

  const pending = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(total_cents),0) AS rev FROM orders
       WHERE rifa_id = ? AND status = 'pendiente'`
    )
    .get(rifaId) as { c: number; rev: number };

  const total = rifa?.total_tickets || 1;
  return {
    ticketsSold: tickets.c,
    ticketsConfirmed: confirmed.c,
    ticketsPending: pending.c,
    revenueCents: confirmed.rev + pending.rev,
    revenueConfirmedCents: confirmed.rev,
    ordersCount: confirmed.c + pending.c,
    pendingOrders: pending.c,
    confirmedOrders: confirmed.c,
    progress: Math.min(1, tickets.c / total),
  };
}

export function listOrders(rifaId?: number): Order[] {
  const rows = rifaId
    ? (db
        .prepare("SELECT * FROM orders WHERE rifa_id = ? ORDER BY id DESC")
        .all(rifaId) as Order[])
    : (db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[]);
  return rows;
}

export function getOrder(id: number): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function getOrderByCode(code: string): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE code = ?").get(code) as
    | Order
    | undefined;
}

export function getOrderTickets(orderId: number): Ticket[] {
  return db
    .prepare("SELECT * FROM tickets WHERE order_id = ? ORDER BY number ASC")
    .all(orderId) as Ticket[];
}

export function getTicketsByRifa(rifaId: number): Ticket[] {
  return db
    .prepare("SELECT * FROM tickets WHERE rifa_id = ? ORDER BY number ASC")
    .all(rifaId) as Ticket[];
}

export function verifyTicket(
  number: string,
  rifaId?: number
): (Ticket & { status: string; order_code: string; name: string }) | null {
  const row = rifaId
    ? (db
        .prepare(
          `SELECT t.*, o.status, o.code AS order_code, o.name
           FROM tickets t JOIN orders o ON o.id = t.order_id
           WHERE t.rifa_id = ? AND t.number = ?`
        )
        .get(rifaId, number) as any)
    : (db
        .prepare(
          `SELECT t.*, o.status, o.code AS order_code, o.name
           FROM tickets t JOIN orders o ON o.id = t.order_id
           WHERE t.number = ?`
        )
        .get(number) as any);
  return row || null;
}

export interface OrderInput {
  rifaId: number;
  name: string;
  phone: string;
  email?: string;
  ticketQuantity: number;
  receiptPath?: string;
}

export function createOrder(input: OrderInput): {
  order: Order;
  tickets: Ticket[];
} {
  const rifa = getRifaById(input.rifaId);
  if (!rifa) throw new Error("Rifa no encontrada");
  const total = input.ticketQuantity * rifa.ticket_price_cents;
  const code = genOrderCode();
  const numbers = genTicketNumbers(
    rifa.id,
    input.ticketQuantity,
    rifa.total_tickets
  );
  if (numbers.length < input.ticketQuantity) {
    throw new Error("No hay suficientes números disponibles para esta rifa");
  }

  const info = db
    .prepare(
      `INSERT INTO orders
        (code, rifa_id, name, phone, email, ticket_quantity, total_cents, receipt_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`
    )
    .run(
      code,
      rifa.id,
      input.name,
      input.phone,
      input.email || null,
      input.ticketQuantity,
      total,
      input.receiptPath || null
    );

  const orderId = Number(info.lastInsertRowid);
  const insertTicket = db.prepare(
    "INSERT INTO tickets (rifa_id, order_id, number) VALUES (?, ?, ?)"
  );
  const insertMany = db.transaction((nums: string[]) => {
    for (const n of nums) insertTicket.run(rifa.id, orderId, n);
  });
  insertMany(numbers);

  return {
    order: getOrder(orderId)!,
    tickets: getOrderTickets(orderId),
  };
}

export function setOrderStatus(id: number, status: string, note?: string) {
  db.prepare("UPDATE orders SET status = ?, admin_note = ? WHERE id = ?").run(
    status,
    note || null,
    id
  );
}

export function listWinners(rifaId?: number) {
  const rows = rifaId
    ? (db
        .prepare(
          `SELECT w.*, r.name AS rifa_name, o.name AS winner_name
           FROM winners w
           LEFT JOIN rifas r ON r.id = w.rifa_id
           LEFT JOIN orders o ON o.id = w.order_id
           WHERE w.rifa_id = ?
           ORDER BY w.id DESC`
        )
        .all(rifaId) as any[])
    : (db
        .prepare(
          `SELECT w.*, r.name AS rifa_name, o.name AS winner_name
           FROM winners w
           LEFT JOIN rifas r ON r.id = w.rifa_id
           LEFT JOIN orders o ON o.id = w.order_id
           ORDER BY w.id DESC`
        )
        .all() as any[]);
  return rows;
}

export function addWinner(
  rifaId: number,
  ticketNumber: string,
  prizeLabel: string,
  orderId?: number
) {
  db.prepare(
    `INSERT INTO winners (rifa_id, order_id, ticket_number, prize_label) VALUES (?, ?, ?, ?)`
  ).run(rifaId, orderId || null, ticketNumber, prizeLabel);
}

export function removeWinner(id: number) {
  db.prepare("DELETE FROM winners WHERE id = ?").run(id);
}
