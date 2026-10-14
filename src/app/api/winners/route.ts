import { NextRequest, NextResponse } from "next/server";
import { listWinners } from "@/lib/data";

export const dynamic = "force-dynamic";

// Endpoint PUBLICO: devuelve los ganadores que ya se muestran en el sitio.
export async function GET(req: NextRequest) {
  const rifaId = req.nextUrl.searchParams.get("rifaId");
  return NextResponse.json({
    winners: await listWinners(rifaId ? Number(rifaId) : undefined),
  });
}
