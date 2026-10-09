import { NextRequest, NextResponse } from "next/server";
import { verifyTicket } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const numero = (req.nextUrl.searchParams.get("numero") || "").trim();
  if (!numero) {
    return NextResponse.json(
      { error: "Ingresa un número de boleto" },
      { status: 400 }
    );
  }
  const normalized = numero.padStart(5, "0").slice(-5);
  const t = await verifyTicket(normalized);

  if (!t) {
    return NextResponse.json({
      found: false,
      message: "Este boleto no está registrado en nuestras rifas.",
    });
  }

  return NextResponse.json({
    found: true,
    number: t.number,
    status: t.status,
    orderCode: t.order_code,
    name: t.name,
    message:
      t.status === "confirmado"
        ? "✅ Boleto válido y confirmado. ¡Estás participando!"
        : t.status === "pendiente"
        ? "⏳ Boleto registrado, pendiente de confirmación del pago."
        : "Este boleto fue rechazado. Contacta al organizador.",
  });
}
