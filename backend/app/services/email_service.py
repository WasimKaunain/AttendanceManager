import os
import requests


MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN  = os.getenv("MAILGUN_DOMAIN", "")
MAILGUN_FROM    = os.getenv("MAILGUN_FROM", f"Attendance Manager <noreply@{MAILGUN_DOMAIN}>")


def send_otp_email(to_email: str, otp: str, username: str) -> bool:
    """
    Send a password-reset OTP via Mailgun.
    Returns True on success, False on failure.
    """
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        raise RuntimeError("Mailgun credentials are not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN)")

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1d4ed8;margin-bottom:4px;">Attendance Manager</h2>
      <p style="color:#6b7280;font-size:14px;margin-top:0;">Password Reset Request</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
      <p style="color:#111827;">Hi <strong>{username}</strong>,</p>
      <p style="color:#374151;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;background:#1d4ed8;color:#fff;font-size:32px;font-weight:bold;
                     letter-spacing:10px;padding:16px 32px;border-radius:10px;font-family:monospace;">
          {otp}
        </span>
      </div>
      <p style="color:#6b7280;font-size:13px;">If you did not request a password reset, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">© {2026} Attendance Manager</p>
    </div>
    """

    response = requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from":    MAILGUN_FROM,
            "to":      [to_email],
            "subject": "Your Password Reset OTP — Attendance Manager",
            "html":    html_body,
        },
        timeout=10,
    )

    return response.status_code == 200
