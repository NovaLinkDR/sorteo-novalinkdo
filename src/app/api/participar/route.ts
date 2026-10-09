import { NextRequest, NextResponse } from "next/server";
import { getRifaById, createOrder } from "@/lib/data";

export const runtime = "nodejs";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Formulario inválido" },
      { status: 400 }
    );
  }

  const rifaId = Number(form.get("rifaId"));
  const name = String(form.get("name") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const email = String(form.get("email") || "").trim();
  const quantity = Number(form.get("quantity"));
  const file = (form.get("receipt") as File | null) || null;

  if (!rifaId || !name || !phone || !quantity) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios (nombre, teléfono, cantidad)" },
      { status: 400 }
    );
  }

  const rifa = await getRifaById(rifaId);
  if (!rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }
  if (rifa.status !== "activa") {
    return NextResponse.json(
      { error: "Esta rifa no está activa" },
      { status: 400 }
    );
  }
  if (quantity < rifa.min_tickets) {
    return NextResponse.json(
      { error: `La compra mínima es de ${rifa.min_tickets} boletos` },
      { status: 400 }
    );
  }
  if (quantity > rifa.max_tickets_per_order) {
    return NextResponse.json(
      { error: `La compra máxima es de ${rifa.max_tickets_per_order} boletos` },
      { status: 400 }
    );
  }

  let receiptData: string | undefined;
  let receiptMime: string | undefined;
  let receiptFilename: string | undefined;
  if (file && file.size > 0) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El comprobante es demasiado grande (máximo 8 MB)" },
        { status: 400 }
      );
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      receiptData = buf.toString("base64");
      receiptMime = file.type || "application/octet-stream";
      receiptFilename = file.name;
    } catch {
      receiptData = undefined;
    }
  }

  try {
    const { order, tickets } = await createOrder({
      rifaId,
      name,
      phone,
      email: email || undefined,
      ticketQuantity: quantity,
      receiptData,
      receiptMime,
      receiptFilename,
    });
    // No devolver el comprobante (base64) al cliente
    const { receipt_data: _receipt, ...safeOrder } = order;
    return NextResponse.json({
      ok: true,
      order: safeOrder,
      tickets: tickets.map((t) => t.number),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 400 });
  }
}
