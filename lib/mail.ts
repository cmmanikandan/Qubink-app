import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || 'manikandanprabhu37@gmail.com',
    pass: process.env.SMTP_PASS || 'vwawpfptwdcxhwcn',
  },
});

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

/**
 * Sends a transactional email using Qubink's configured Gmail SMTP
 */
export async function sendEmail({ to, subject, html, text, attachments }: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Qubink" <manikandanprabhu37@gmail.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      attachments,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send email via SMTP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pre-formatted email template for Order Confirmation
 */
export async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  orderNumber,
  shopName,
  pickupCode,
  totalAmount,
  itemsCount,
}: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  shopName: string;
  pickupCode?: string;
  totalAmount: number;
  itemsCount: number;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">Qubink Print Order Confirmed</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Thank you for your order, ${customerName}!</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <div style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; pb: 12px;">
          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Order ID</p>
          <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 800;">#${orderNumber}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Print Partner</p>
          <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 15px; font-weight: bold;">${shopName}</p>
        </div>

        ${pickupCode ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; margin: 16px 0; text-align: center;">
          <span style="color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase;">Your 4-Digit Pickup Release Code</span>
          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #15803d; font-family: monospace;">${pickupCode}</p>
          <p style="margin: 4px 0 0 0; color: #166534; font-size: 11px;">Show this code at the store counter to collect your prints.</p>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          <span style="color: #64748b; font-size: 14px;">Total Amount Paid / Payable:</span>
          <span style="color: #0f172a; font-size: 16px; font-weight: 900;">₹${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
        Qubink — Fast On-Demand Print & Xerox Marketplace
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Your Qubink Order #${orderNumber} is Confirmed!`,
    html,
  });
}
