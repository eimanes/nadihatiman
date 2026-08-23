import nodemailer from "nodemailer"
import path from "path"

/**
 * Welcome email sent when a superadmin grants someone access.
 * Uses Gmail SMTP. Credentials come from env (see .env.local):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_LOGIN_URL
 */

const host = process.env.SMTP_HOST || "smtp.gmail.com"
const port = parseInt(process.env.SMTP_PORT || "465", 10)
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

const transporter = nodemailer.createTransport({
	host,
	port,
	secure: port === 465, // SSL on 465
	auth: user && pass ? { user, pass } : undefined,
})

export function isEmailConfigured(): boolean {
	return Boolean(user && pass)
}

export type WelcomeEmailData = {
	email: string
	/** Human list of granted permissions, e.g. "Edit guests, Edit checklist". */
	access: string
	/** "account" | "superadmin". */
	role: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
	if (!isEmailConfigured()) {
		throw new Error("SMTP is not configured (SMTP_USER / SMTP_PASS missing).")
	}
	const loginUrl = process.env.APP_LOGIN_URL || "https://nadihatiman.vercel.app/sign-in"
	const from = process.env.EMAIL_FROM || `"NADIhatIMAN" <${user}>`
	const logoPath = path.join(process.cwd(), "public", "images", "logo1.png")
	const roleLabel = data.role === "superadmin" ? "Superadmin" : "Editor"

	const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background-color:#f3ead8; }
    .wrapper { width:100%; padding:40px 0; background-color:#f3ead8; }
    .card { max-width:500px; margin:0 auto; background-color:#fbf7ee; padding:40px; border-radius:12px; border:1px solid #e6dbc4; box-shadow:0 4px 6px -1px rgba(90,30,30,0.08),0 2px 4px -1px rgba(90,30,30,0.06); }
    .logo-container { text-align:center; margin-bottom:32px; }
    .logo { width:64px; height:64px; }
    h2 { color:#5b1a1a; font-size:22px; font-weight:700; margin-top:0; margin-bottom:16px; text-align:center; }
    p { color:#4a3a2a; font-size:15px; line-height:1.6; margin-bottom:24px; }
    .info-box { background-color:#f1e6cf; padding:24px; border-radius:8px; margin-bottom:24px; border:1px solid #e6dbc4; }
    .info-row { font-size:14px; margin-bottom:12px; color:#4a3a2a; display:flex; }
    .info-row:last-child { margin-bottom:0; }
    .label { width:110px; color:#8a7a5a; font-weight:500; flex-shrink:0; }
    .value { font-weight:600; color:#5b1a1a; }
    .btn-container { text-align:center; margin:32px 0; }
    .btn { display:inline-block; background-color:#8c1d2f; color:#ffffff !important; text-decoration:none; padding:14px 40px; border-radius:8px; font-size:15px; font-weight:600; box-shadow:0 4px 6px rgba(140,29,47,0.28); }
    .security-note { font-size:13px; color:#a89a7d; border-top:1px solid #e6dbc4; padding-top:20px; margin-top:32px; }
    .footer { margin-top:24px; text-align:center; }
    .footer-text { color:#6a5a44; font-size:14px; margin:0; }
    .copyright { text-align:center; margin-top:32px; font-size:12px; color:#a89a7d; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-container">
        <img src="cid:nadi-logo" alt="NADIhatIMAN" class="logo" />
      </div>
      <h2>You've been invited, ${data.email}!</h2>
      <p>
        You now have access to the <strong>NADIhatIMAN</strong> wedding planner.
        Sign in with this email address to start planning.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Email:</span> <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Role:</span> <span class="value">${roleLabel}</span>
        </div>
        <div class="info-row">
          <span class="label">Access:</span> <span class="value">${data.access}</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Sign in to NADIhatIMAN</a>
      </div>

      <div class="security-note">
        <strong>Note:</strong> Use the "Continue with email" option and this email
        address to sign in. If you don't have an account yet, one will be created
        for you on first sign-in.
      </div>

      <div class="footer">
        <p class="footer-text">Regards,<br><strong>Nadia &amp; Eiman</strong></p>
      </div>
    </div>
    <div class="copyright">
      © 2026 NADIhatIMAN. All rights reserved.
    </div>
  </div>
</body>
</html>
`

	await transporter.sendMail({
		from,
		to: data.email,
		subject: "You've been given access to NADIhatIMAN",
		html,
		attachments: [
			{ filename: "logo.png", path: logoPath, cid: "nadi-logo" },
		],
	})
}
