import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let resendClient = null;
let smtpTransporter = null;

// In-memory test store for automated testing without live credentials
const testInbox = [];

export const __getTestInbox = () => [...testInbox];
export const __clearTestInbox = () => { testInbox.length = 0; };

const hasBrevoConfig = () => Boolean(process.env.BREVO_API_KEY);

const hasSmtpConfig = () => {
  return Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  );
};

const hasResendConfig = () => {
  return Boolean(process.env.RESEND_API_KEY);
};

/**
 * Determine active email provider configuration
 */
export const getEmailProviderStatus = () => {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL_DELIVERY === 'true') {
    return { configured: true, provider: 'test' };
  }

  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const hasBrevo = hasBrevoConfig();
  const hasResend = hasResendConfig();
  const hasSmtp = hasSmtpConfig();

  if (explicit === 'brevo' && hasBrevo) return { configured: true, provider: 'brevo' };
  if (explicit === 'resend' && hasResend) return { configured: true, provider: 'resend' };
  if (explicit === 'smtp' && hasSmtp) return { configured: true, provider: 'smtp' };

  // Brevo uses HTTPS port 443 and sends to any recipient domain for free
  if (hasBrevo) return { configured: true, provider: 'brevo' };

  // Resend uses HTTPS port 443 (ideal for cloud hosts like Render)
  if (hasResend) return { configured: true, provider: 'resend' };

  // SMTP (ports 587/465, best for local testing or unblocked hosts)
  if (hasSmtp) return { configured: true, provider: 'smtp' };

  return { configured: false, provider: null };
};

const getResendClient = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY.trim());
  }
  return resendClient;
};

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    const isGmail = host.toLowerCase().includes('gmail');
    smtpTransporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: { user, pass }
          }
        : {
            host,
            port,
            secure,
            auth: { user, pass }
          }
    );
    return smtpTransporter;
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    return smtpTransporter;
  }

  return null;
};

/**
 * Generates branded HTML and plain-text email bodies for UniMatch OTP verification.
 */
const buildVerificationEmailContent = (otp) => {
  const subject = 'Verify your UniMatch email';

  const textContent = [
    'UniMatch — Campus Student Network',
    '----------------------------------------',
    'Verify your university email address',
    '',
    `Your 6-digit verification code: ${otp}`,
    '',
    '⏱ This code expires in 10 minutes.',
    'Enter this code on UniMatch to complete your account registration.',
    '',
    'Security Notice: If you did not initiate this registration on UniMatch, please disregard this email. Never share this code with anyone.',
    '----------------------------------------',
    'UniMatch Campus Network · Student Exclusivity First'
  ].join('\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your UniMatch email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FFFCF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #282333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFCF8; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 2px solid #282333; border-radius: 8px; box-shadow: 4px 4px 0px #282333; overflow: hidden; padding: 32px 28px;">
                <!-- Header / Logo -->
                <tr>
                  <td align="left" style="padding-bottom: 24px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #5B2BE0; color: #FFFFFF; font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 6px; letter-spacing: -0.02em;">
                          UniMatch
                        </td>
                        <td style="padding-left: 10px; font-size: 12px; font-weight: 600; color: #746E7D; letter-spacing: 0.05em; text-transform: uppercase;">
                          Campus Network
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Title & Instructions -->
                <tr>
                  <td align="left">
                    <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #282333; letter-spacing: -0.02em; line-height: 1.25;">
                      Verify your university email
                    </h1>
                    <p style="margin: 0 0 20px; font-size: 14.5px; line-height: 1.5; color: #585363;">
                      Welcome to your campus network! Enter the 6-digit verification code below to verify your student email address and proceed with setting up your profile:
                    </p>
                  </td>
                </tr>

                <!-- OTP Display Box -->
                <tr>
                  <td align="center" style="padding: 10px 0 22px;">
                    <div style="background-color: #F1EAFE; border: 2px solid #282333; border-radius: 8px; padding: 18px 24px; box-shadow: 3px 3px 0px #282333; text-align: center;">
                      <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 7px; color: #5B2BE0;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Expiry Note -->
                <tr>
                  <td align="left">
                    <p style="margin: 0 0 16px; font-size: 13.5px; color: #282333; line-height: 1.45; font-weight: 600;">
                      ⏱ This code expires in 10 minutes.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #746E7D; line-height: 1.45; border-top: 1px solid #E8E2F2; padding-top: 16px;">
                      <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email. Never share this code with anyone.
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

  return { subject, textContent, htmlContent };
};

/**
 * Send 6-digit OTP verification email via configured provider (Resend, Brevo, or Nodemailer/SMTP).
 * Throws an explicit error if email provider credentials are not configured or if sending fails.
 */
export const sendVerificationOtpEmail = async (toEmail, otp) => {
  const normalizedEmail = toEmail.trim().toLowerCase();
  const { subject, textContent, htmlContent } = buildVerificationEmailContent(otp);
  const status = getEmailProviderStatus();

  // 1. Automated Test Mode
  if (status.provider === 'test') {
    const record = {
      to: normalizedEmail,
      subject,
      otp,
      text: textContent,
      html: htmlContent,
      sentAt: new Date()
    };
    testInbox.push(record);
    return { delivered: true, provider: 'test', messageId: `test-${Date.now()}` };
  }

  // 2. Unconfigured Provider Check (Never fake success)
  if (!status.configured) {
    const errorMsg = 'Email delivery service is not configured. Please configure RESEND_API_KEY (recommended) or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) in your server environment.';
    console.error(`[EMAIL ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const defaultFrom = 'UniMatch <onboarding@resend.dev>';
  const fromAddress = process.env.EMAIL_FROM || defaultFrom;

  // 3. Provider: Brevo HTTP API (Port 443, sends to any recipient domain without DNS requirement)
  const sendViaBrevo = async () => {
    const apiKey = process.env.BREVO_API_KEY.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'adeebainul4@gmail.com';
    const senderName = 'UniMatch Campus';

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: normalizedEmail }],
        subject,
        htmlContent,
        textContent
      })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const errDetail = data?.message || `HTTP ${res.status}`;
      throw new Error(`Brevo error: ${errDetail}`);
    }

    console.log(`[EMAIL] Verification OTP delivered to ${normalizedEmail} via Brevo. ID: ${data?.messageId}`);
    return { delivered: true, provider: 'brevo', messageId: data?.messageId };
  };

  // 4. Provider: Resend (Port 443)
  const sendViaResend = async () => {
    const resend = getResendClient();
    const response = await resend.emails.send({
      from: fromAddress,
      to: normalizedEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    if (response.error) {
      const msg = response.error.message || 'Unknown Resend error';
      if (msg.includes('only send testing emails to your own email address')) {
        throw new Error(`Resend restriction: Free sandbox can only send to your account email (${process.env.RESEND_ACCOUNT_EMAIL || 'adeebainul4@gmail.com'}). To send to @cuchd.in, verify your domain at resend.com/domains.`);
      }
      throw new Error(`Resend error: ${msg}`);
    }

    console.log(`[EMAIL] Verification OTP delivered to ${normalizedEmail} via Resend. ID: ${response.data?.id}`);
    return { delivered: true, provider: 'resend', messageId: response.data?.id };
  };

  // 5. Provider: SMTP (Nodemailer, Port 587/465)
  const sendViaSmtp = async () => {
    const transporter = getSmtpTransporter();
    const smtpFrom = process.env.SMTP_USER
      ? `"UniMatch Campus" <${process.env.SMTP_USER.trim()}>`
      : fromAddress;

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: normalizedEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[EMAIL] Verification OTP delivered to ${normalizedEmail} via SMTP. ID: ${info.messageId}`);
    return { delivered: true, provider: 'smtp', messageId: info.messageId };
  };

  // 6. Execution with Smart Fallbacks
  if (status.provider === 'brevo') {
    return await sendViaBrevo();
  }

  if (status.provider === 'resend') {
    try {
      return await sendViaResend();
    } catch (err) {
      console.error('[EMAIL ERROR] Resend dispatch failed:', err.message);
      if (hasBrevoConfig()) {
        console.warn('[EMAIL FALLBACK] Falling back to Brevo...');
        return await sendViaBrevo();
      }
      if (hasSmtpConfig()) {
        try {
          console.warn('[EMAIL FALLBACK] Falling back to SMTP...');
          return await sendViaSmtp();
        } catch {
          // Keep primary error message
        }
      }
      throw err;
    }
  }

  if (status.provider === 'smtp') {
    try {
      return await sendViaSmtp();
    } catch (err) {
      console.error('[EMAIL ERROR] SMTP dispatch failed:', err.message);
      if (hasBrevoConfig()) {
        console.warn('[EMAIL FALLBACK] Falling back to Brevo...');
        return await sendViaBrevo();
      }
      if (hasResendConfig()) {
        console.warn('[EMAIL FALLBACK] Falling back to Resend...');
        return await sendViaResend();
      }
      throw new Error(`Failed to deliver verification email via SMTP: ${err.message}`);
    }
  }

  throw new Error('No valid email delivery provider found.');
};
