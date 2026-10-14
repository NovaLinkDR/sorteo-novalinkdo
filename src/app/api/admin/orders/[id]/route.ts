import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { setOrderStatus, getOrder, getOrderTickets, getRifaById } from "@/lib/data";
import { sendOrderConfirmation, mailConfigured } from "@/lib/mail";

/** Arma y envia la confirmacion de una orden. */
async function sendConfirmation(
  id: number
): Promise<{ sent: boolean; error?: string }> {
  const order = await getOrder(id);
  if (!order) return { sent: false, error: "La orden no existe" };
  if (!order.email) return { sent: false, error: "La orden no tiene correo" };
  const rifa = await getRifaById(order.rifa_id);
  if (!rifa) return { sent: false, error: "La rifa no existe" };

  const tickets = (await getOrderTickets(id)).map((t) => t.number);

  await sendOrderConfirmation(
    {
      code: order.code,
      name: order.name,
      email: order.email,
      ticket_quantity: order.ticket_quantity,
      total_cents: order.total_cents,
    },
    {
      name: rifa.name,
      slug: rifa.slug,
      prize_name: rifa.prize_name,
      sorteo_date: rifa.sorteo_date,
      sorteo_time: rifa.sorteo_time,
      sorteo_place: rifa.sorteo_place,
      sorteo_note: rifa.sorteo_note,
    },
    tickets
  );
  return { sent: true };
}

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
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Orden no existe" }, { status: 404 });
  }

  const yaEstabaConfirmada = order.status === "confirmado";
  await setOrderStatus(id, status, body.note);
  const updated = (await getOrder(id))!;
  const { receipt_data: _rd, ...safe } = updated;

  // Al pasar a "confirmado" se envia el correo al comprador.
  // Va sin await: si Zoho falla o tarda, la orden igual queda confirmada.
  let emailDisparado = false;
  if (status === "confirmado" && !yaEstabaConfirmada) {
    emailDisparado = true;
    sendConfirmation(id).catch((e) =>
      console.error(`[mail] fallo la confirmacion de la orden ${id}:`, e)
    );
  }

  return NextResponse.json({
    ok: true,
    emailDisparado,
    order: { ...safe, tickets: (await getOrderTickets(id)).map((t) => t.number) },
  });
}

/** Reenviar la confirmacion a mano desde el panel. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return unauthorized();
  if (!mailConfigured()) {
    return NextResponse.json(
      { error: "El correo no está configurado (falta SMTP_USER/SMTP_PASS)" },
      { status: 503 }
    );
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  try {
    const r = await sendConfirmation(id);
    if (!r.sent) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[mail] error reenviando la orden ${id}:`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
