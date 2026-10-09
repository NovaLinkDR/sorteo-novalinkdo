import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getRifaById, createOrder } from "@/lib/data";

export const runtime = "nodejs";

function uploadDir(): string {
  return (
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "data", "uploads")
  );
}

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

  const rifa = getRifaById(rifaId);
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

  let receiptPath: string | undefined;
  if (file && file.size > 0) {
    try {
      const dir = uploadDir();
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(file.name).toLowerCase() || ".bin";
      const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".heic"];
      const safeExt = allowed.includes(ext) ? ext : ".bin";
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${safeExt}`;
      const buf = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(dir, filename), buf);
      receiptPath = filename;
    } catch {
      receiptPath = undefined;
    }
  }

  try {
    const { order, tickets } = createOrder({
      rifaId,
      name,
      phone,
      email: email || undefined,
      ticketQuantity: quantity,
      receiptPath,
    });
    return NextResponse.json({
      ok: true,
      order,
      tickets: tickets.map((t) => t.number),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 400 });
  }
}
