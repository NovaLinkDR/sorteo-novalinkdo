import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { setOrderStatus, getOrder, getOrderTickets } from "@/lib/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return unauthorized();
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!["pendiente", "confirmado", "rechazado"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  const order = getOrder(id);
  if (!order) return NextResponse.json({ error: "Orden no existe" }, { status: 404 });

  setOrderStatus(id, status, body.note);
  const updated = getOrder(id)!;
  return NextResponse.json({
    ok: true,
    order: { ...updated, tickets: getOrderTickets(id).map((t) => t.number) },
  });
}
