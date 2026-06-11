import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/api";

const SECRET_KEY = process.env.KHALTI_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const { pidx, orderId } = await req.json();

  const response = await fetch("https://khalti.com/api/v2/epayment/lookup/", {
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

  await confirmPayment(Number(orderId), data.transaction_id);

  return NextResponse.json({ success: true, transaction_id: data.transaction_id });
}
