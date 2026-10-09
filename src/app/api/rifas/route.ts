import { NextResponse } from "next/server";
import { listRifas, getRifaStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const rifas = listRifas(true).map((r) => ({
    ...r,
    stats: getRifaStats(r.id),
  }));
  return NextResponse.json({ rifas });
}
