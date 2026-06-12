import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.KHALTI_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  const { amount, orderId } = await req.json();

  const response = await fetch("https://dev.khalti.com/api/v2/epayment/initiate/", {
    method: "POST",
    headers: {
      "Authorization": `Key ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: `${BASE_URL}/payment/khalti/success`,
      website_url: BASE_URL,
      amount: Math.round(parseFloat(amount) * 100),
      purchase_order_id: String(orderId),
      purchase_order_name: `Order #${orderId}`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data }, { status: response.status });
  }

  return NextResponse.json({ payment_url: data.payment_url, pidx: data.pidx });
}
