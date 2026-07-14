import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.KHALTI_SECRET_KEY!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(req: NextRequest) {
  try {
    const { pidx, orderId, tenantSlug } = await req.json();
    const authHeader = req.headers.get("Authorization") ?? "";

    const response = await fetch("https://dev.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== "Completed") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const confirmRes = await fetch(`${API_URL}/api/orders/${orderId}/confirm-payment/`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug ?? "",
      },
      body: JSON.stringify({ transaction_id: data.transaction_id }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      return NextResponse.json({ error: err }, { status: confirmRes.status });
    }

    return NextResponse.json({ success: true, transaction_id: data.transaction_id });
  } catch (err) {
    console.error("Khalti verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
