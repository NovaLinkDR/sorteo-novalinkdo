import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { listWinners, addWinner, removeWinner } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const rifaId = req.nextUrl.searchParams.get("rifaId");
  return NextResponse.json({
    winners: listWinners(rifaId ? Number(rifaId) : undefined),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const rifaId = Number(body.rifaId);
  const ticketNumber = String(body.ticketNumber || "").trim();
  const prizeLabel = String(body.prizeLabel || "Premio");
  if (!rifaId || !ticketNumber) {
    return NextResponse.json({ error: "rifaId y ticketNumber requeridos" }, { status: 400 });
  }
  addWinner(rifaId, ticketNumber, prizeLabel, body.orderId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  removeWinner(id);
  return NextResponse.json({ ok: true });
}
