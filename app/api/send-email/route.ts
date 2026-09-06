import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendOrderConfirmationEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === 'ORDER_CONFIRMATION') {
      const { customerEmail, customerName, orderNumber, shopName, pickupCode, totalAmount, itemsCount } = body;
      if (!customerEmail || !orderNumber) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await sendOrderConfirmationEmail({
        customerEmail,
        customerName: customerName || 'Customer',
        orderNumber,
        shopName: shopName || 'Print Shop',
        pickupCode,
        totalAmount: Number(totalAmount || 0),
        itemsCount: Number(itemsCount || 1),
      });
      return NextResponse.json(result);
    }

    const { to, subject, html, text } = body;
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html, text });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Send Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
