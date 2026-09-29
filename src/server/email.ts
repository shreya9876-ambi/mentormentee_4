import nodemailer, { type Transporter } from "nodemailer";

interface SendWelcomeEmailParams {
  to: string;
  fullName: string;
  role: "mentor" | "student" | "admin";
  rawPassword?: string;
  company?: string;
  department?: string;
}

let transporterInstance: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (host && user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporterInstance;
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    return transporterInstance;
  }

  // Fallback: create an Ethereal test account or JSON transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Email Service] Initialized Ethereal test SMTP (${testAccount.user})`);
    return transporterInstance;
  } catch {
    // If ethereal fails (e.g. offline), use jsonTransport/stream transport
    transporterInstance = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporterInstance;
  }
}

export async function sendWelcomeCredentialsEmail(params: SendWelcomeEmailParams) {
  const { to, fullName, role, rawPassword = "password123", company, department } = params;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || `"Uni-Mentor Connect" <placement@pcoer.in>`;
  const portalUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}/auth`;

  const roleTitle = role === "mentor" ? "Alumni Mentor" : role === "admin" ? "Placement Admin" : "Student";
  const extraInfo =
    role === "mentor" && company
      ? `<p style="margin: 4px 0; color: #475569;"><strong>Verified Company:</strong> ${company}</p>`
      : role === "student" && department
      ? `<p style="margin: 4px 0; color: #475569;"><strong>Department:</strong> ${department}</p>`
      : "";

  const subject = `Welcome to Uni-Mentor Connect · Your Account Credentials (${roleTitle})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 30px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 28px 24px; color: #1e293b; font-size: 15px; line-height: 1.6; }
    .greeting { font-size: 17px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .cred-box { background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 18px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { color: #64748b; font-weight: 500; }
    .cred-value { font-family: monospace; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
    .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Uni-Mentor Connect</h1>
      <p>PCCOER Alumni Mentorship & Placement Platform</p>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${fullName}! 👋</div>
      <p>
        An account has been created for you on the <strong>Uni-Mentor Connect</strong> platform with the role of <strong>${roleTitle}</strong>.
      </p>
      ${extraInfo}
      <p>Here are your official login credentials to access your dashboard:</p>
      
      <div class="cred-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Login Email:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Password:</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #2563eb; text-align: right; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${rawPassword}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Assigned Role:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${roleTitle}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${portalUrl}" class="cta-button" target="_blank">
          Log In to Portal &rarr;
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        💡 <em>Tip: You can change your password anytime after logging in through your profile settings.</em>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Uni-Mentor Connect · PCCOER Placement Cell. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: `Hello ${fullName},\n\nYour account has been created on Uni-Mentor Connect as a ${roleTitle}.\n\nLogin Email: ${to}\nPassword: ${rawPassword}\nPortal Link: ${portalUrl}\n\nBest regards,\nPCCOER Placement Cell`,
      html,
    });

    console.log(`[Email Service] Sent welcome email to ${to} (MessageID: ${info.messageId})`);
    
    let previewUrl: string | undefined;
    if (typeof nodemailer.getTestMessageUrl === "function") {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        previewUrl = url;
        console.log(`[Email Service] Test email preview: ${url}`);
      }
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err: unknown) {
    console.error(`[Email Service] Failed to send email to ${to}:`, err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}
