// lib/email/sendPurchaseConfirmation.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type PurchaseEmailItem = {
  title: string;
  licenseType: "ROYALTY_FREE" | "EXCLUSIVE";
  pricePaid: number;
};

export type SendPurchaseConfirmationParams = {
  toEmail: string;
  orderId: string;
  items: PurchaseEmailItem[];
  totalAmount: number;
  guestDownloadToken?: string;
};

export async function sendPurchaseConfirmation({
  toEmail,
  orderId,
  items,
  totalAmount,
  guestDownloadToken,
}: SendPurchaseConfirmationParams): Promise<void> {
  const fromAddress = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #e5e5e5; font-size: 14px;">
          ${item.title}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #aaa; font-size: 13px; text-align: center;">
          ${item.licenseType === "ROYALTY_FREE" ? "Royalty Free" : "Exclusive"}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #e5e5e5; font-size: 14px; text-align: right;">
          $${item.pricePaid.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  // CTA block — guest gets direct download link, registered user gets library link
  const ctaBlock = guestDownloadToken
    ? `
      <div style="margin-top: 40px; padding: 24px; background-color: #0a0a0a; border-radius: 8px; border: 1px solid #222; text-align: center;">
        <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px; font-weight: bold;">
          Your files are ready
        </p>
        <p style="margin: 0 0 20px; color: #aaa; font-size: 13px;">
          This link expires in 7 days. No account required.
        </p>
        <a href="${siteUrl}/download/${guestDownloadToken}"
          style="display: inline-block; background-color: #ffffff; color: #000000; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">
          Download Your Files
        </a>
        <p style="margin: 20px 0 0; color: #555; font-size: 12px;">
          Want permanent access? 
          <a href="${siteUrl}/sign-up" style="color: #888;">Create a free account</a> 
          with this email and your purchases will be waiting in your library.
        </p>
      </div>
    `
    : `
      <div style="margin-top: 40px; padding: 24px; background-color: #0a0a0a; border-radius: 8px; border: 1px solid #222; text-align: center;">
        <p style="margin: 0 0 16px; color: #aaa; font-size: 14px;">
          Your files are ready to download in your library.
        </p>
        <a href="${siteUrl}/library"
          style="display: inline-block; background-color: #ffffff; color: #000000; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">
          Go to My Library
        </a>
      </div>
    `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Your KashmereSamples Purchase</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222;">

                <!-- Header -->
                <tr>
                  <td style="background-color: #000; padding: 32px 40px; text-align: center; border-bottom: 1px solid #222;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 3px; text-transform: uppercase;">
                      KASHMERE
                    </h1>
                    <p style="margin: 6px 0 0; color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                      Samples
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 20px;">
                      Purchase Confirmed
                    </h2>
                    <p style="margin: 0 0 32px; color: #888; font-size: 14px;">
                      Order ID: <span style="color: #aaa; font-family: monospace;">${orderId}</span>
                    </p>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align: left; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 1px solid #333;">
                            Item
                          </th>
                          <th style="text-align: center; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 1px solid #333;">
                            License
                          </th>
                          <th style="text-align: right; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 1px solid #333;">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                      </tbody>
                    </table>

                    <!-- Total -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                      <tr>
                        <td style="color: #888; font-size: 14px;">Total</td>
                        <td style="text-align: right; color: #ffffff; font-size: 18px; font-weight: bold;">
                          $${totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    ${ctaBlock}

                    <!-- License Note -->
                    <p style="margin: 32px 0 0; color: #555; font-size: 12px; line-height: 1.6;">
                      By completing this purchase you agree to the
                      <a href="${siteUrl}/licensing" style="color: #888;">KashmereSamples License Terms</a>.
                      Royalty Free licenses are non-exclusive. Exclusive licenses grant full buyout rights — Kashmere retains authorship credit.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; border-top: 1px solid #222; text-align: center;">
                    <p style="margin: 0; color: #444; font-size: 12px;">
                      © ${new Date().getFullYear()} KashmereSamples. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: fromAddress,
    to: toEmail,
    subject: "Your KashmereSamples Purchase — Files Ready",
    html,
  });
}