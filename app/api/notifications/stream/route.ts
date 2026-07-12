// ponytail: fake SSE — replace with real backend SSE endpoint when available
const mockNotifications = [
  { title: "Order Placed", message: "Your order #1042 has been placed successfully.", type: "order" },
  { title: "Order Shipped", message: "Your order #1041 is on its way!", type: "order_status" },
  { title: "Order Delivered", message: "Your order #1040 has been delivered.", type: "order_status" },
  { title: "Order Cancelled", message: "Your order #1039 has been cancelled.", type: "order_status" },
  { title: "Payment Confirmed", message: "Payment of Rs. 1,500 for order #1042 confirmed.", type: "order" },
  { title: "Coupon Applied", message: "Coupon SAVE20 saved you Rs. 200 on your order.", type: "coupon" },
  { title: "New Coupon Available", message: "Use FLAT10 to get 10% off your next order.", type: "coupon" },
  { title: "Review Reminder", message: "How was your order #1038? Leave a review!", type: "product" },
  { title: "Wishlist Item On Sale", message: "An item in your wishlist is now on sale.", type: "product" },
  { title: "Price Drop", message: "A product you viewed dropped in price.", type: "product" },
];

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          clearInterval(interval);
        }
      };

      send({
        id: Date.now(),
        title: "Notifications Live",
        message: "You will now receive live updates.",
        type: "default",
        is_read: false,
        created_at: new Date().toISOString(),
      });

      interval = setInterval(() => {
        const pick = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        send({
          id: Date.now(),
          ...pick,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }, 10000);
    },
    cancel() {
      clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
