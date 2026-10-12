import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
    return transporter;
  }

  // Gmail shorthand if provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    return transporter;
  }

  return null;
};

/**
 * Send 6-digit OTP verification email
 */
export const sendVerificationOtpEmail = async (toEmail, otp) => {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"UniMatch Campus" <no-reply@unimatch.internal>';

  const subject = `UniMatch Verification Code: ${otp}`;
  const textContent = `Your UniMatch campus account verification code is: ${otp}\n\nThis 6-digit code will expire in 10 minutes.\n\nIf you did not request this, please disregard this email.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>UniMatch Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FFFCF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #282333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFCF8; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="520" style="max-width: 520px; background-color: #FFFFFF; border: 2.5px solid #282333; border-radius: 12px; box-shadow: 6px 6px 0px #282333; overflow: hidden; padding: 36px 32px;">
                <!-- Header -->
                <tr>
                  <td align="left" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background-color: #5B2BE0; color: #FFFFFF; font-weight: 800; font-size: 18px; padding: 6px 14px; border-radius: 6px; letter-spacing: -0.02em;">
                      UniMatch
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="left">
                    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #282333; letter-spacing: -0.02em;">
                      Verify your university email
                    </h1>
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #746E7D;">
                      Welcome to the campus network! Use the 6-digit verification code below to verify your email and activate your student account:
                    </p>
                  </td>
                </tr>

                <!-- OTP Display Box -->
                <tr>
                  <td align="center" style="padding: 12px 0 24px;">
                    <div style="background-color: #F1EAFE; border: 2px solid #282333; border-radius: 8px; padding: 20px 24px; box-shadow: 4px 4px 0px #282333; text-align: center;">
                      <span style="font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #5B2BE0;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Expiry Note -->
                <tr>
                  <td align="left">
                    <p style="margin: 0 0 20px; font-size: 13.5px; color: #746E7D; line-height: 1.45;">
                      ⏱ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
                    </p>
                    <p style="margin: 0; font-size: 12.5px; color: #8E8799; line-height: 1.4; border-top: 1px solid #E8E2F2; padding-top: 18px;">
                      If you didn't attempt to sign up for UniMatch with this address, you can safely ignore this email.
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

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[EMAIL] OTP delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return { delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send via SMTP:`, err.message);
      // Fallback to console output so dev/local testing does not halt
      logConsoleOtp(toEmail, otp);
      return { delivered: false, simulated: true, error: err.message };
    }
  } else {
    logConsoleOtp(toEmail, otp);
    return { delivered: true, simulated: true };
  }
};

const logConsoleOtp = (toEmail, otp) => {
  console.log(`\n======================================================`);
  console.log(`📬 [UNIMATCH EMAIL VERIFICATION OTP]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`6-Digit OTP: >>> ${otp} <<<`);
  console.log(`Expiry: 10 minutes`);
  console.log(`======================================================\n`);
};
