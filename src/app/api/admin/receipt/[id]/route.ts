import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { getOrder } from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order || !order.receipt_data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  const buf = Buffer.from(order.receipt_data, "base64");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": order.receipt_mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${
        order.receipt_filename || "comprobante"
      }"`,
      "Cache-Control": "no-store",
    },
  });
}
