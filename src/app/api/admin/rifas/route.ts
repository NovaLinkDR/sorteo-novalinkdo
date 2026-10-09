import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import db, { Rifa } from "@/lib/db";
import { listRifas } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  return NextResponse.json({ rifas: listRifas(false) });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const fields = [
    "name",
    "tagline",
    "description",
    "prize_name",
    "ticket_price_cents",
    "min_tickets",
    "max_tickets_per_order",
    "total_tickets",
    "sorteo_date",
    "sorteo_time",
    "sorteo_place",
    "draw_mechanic",
    "status",
  ];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const f of fields) {
    if (f in body) {
      sets.push(`${f} = ?`);
      vals.push(body[f]);
    }
  }
  if (!sets.length) {
    return NextResponse.json({ error: "Sin campos a actualizar" }, { status: 400 });
  }
  vals.push(id);
  db.prepare(`UPDATE rifas SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  if (!slug || !name) {
    return NextResponse.json({ error: "slug y name requeridos" }, { status: 400 });
  }
  const exists = db.prepare("SELECT id FROM rifas WHERE slug = ?").get(slug);
  if (exists) {
    return NextResponse.json({ error: "Ese slug ya existe" }, { status: 409 });
  }
  db.prepare(
    `INSERT INTO rifas
      (slug, name, tagline, description, prize_name, prize_value_cents,
       ticket_price_cents, min_tickets, max_tickets_per_order, total_tickets,
       sorteo_date, sorteo_time, sorteo_place, draw_mechanic, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    slug,
    name,
    body.tagline || null,
    body.description || null,
    body.prize_name || null,
    body.prize_value_cents || 0,
    body.ticket_price_cents || 0,
    body.min_tickets || 1,
    body.max_tickets_per_order || 10000,
    body.total_tickets || 100000,
    body.sorteo_date || null,
    body.sorteo_time || null,
    body.sorteo_place || null,
    body.draw_mechanic || null,
    body.status || "borrador"
  );
  return NextResponse.json({ ok: true });
}
