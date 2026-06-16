import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { productId: number; quantity: number }[] = body.items ?? [];

    // Mock merge — in future replace this with a real backend call
    // e.g. POST /api/cart/merge/ on Django with the user's token
    return NextResponse.json({ success: true, merged: items }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Merge failed" }, { status: 400 });
  }
}
