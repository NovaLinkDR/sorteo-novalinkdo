import { NextResponse } from "next/server";
import { getRifaBySlug, getRifaStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rifa = getRifaBySlug(slug);
  if (!rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ rifa: { ...rifa, stats: getRifaStats(rifa.id) } });
}
