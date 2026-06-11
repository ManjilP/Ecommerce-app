import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET_KEY = process.env.ESEWA_SECRET_KEY!;
const PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
    const { amount, orderId } = await req.json();

    const transaction_uuid = `${orderId}-${Date.now()}`;
    const total_amount = parseFloat(amount).toFixed(2);

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;
    const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");

    return NextResponse.json({
        amount: total_amount,
        tax_amount: "0",
        total_amount,
        transaction_uuid,
        product_code: PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${BASE_URL}/payment/esewa/success`,
        failure_url: `${BASE_URL}/payment/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
    });
}
