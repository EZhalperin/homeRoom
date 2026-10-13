import { escapeHtml } from "./escapeHtml.js";

/**
 * @param {{ firstName?: string, userId: string, password?: string, loginUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function welcomeEmail({ firstName, userId, password, loginUrl }) {
  const safeName = escapeHtml(firstName || "משתמש/ת");
  const safeUserId = escapeHtml(userId);
  const safePassword = password ? escapeHtml(password) : "";
  const safeLoginUrl = escapeHtml(loginUrl);

  const subject = "ברוכים הבאים למערכת HomeRoom - פרטי ההתחברות שלך";

  const text = `שלום ${firstName || "משתמש/ת"},

נוצר עבורך חשבון חדש במערכת בית הספר HomeRoom.
פרטי ההתחברות שלך:
שם משתמש (תעודת זהות): ${userId}
${password ? `סיסמה ראשונית: ${password}\n` : ""}
כדי להתחבר למערכת, אנא היכנס/י לקישור הבא:
${loginUrl}

מומלץ להחליף את הסיסמה לאחר ההתחברות הראשונית.

בברכה,
צוות HomeRoom`;

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #1e293b; direction: rtl; text-align: right;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px;">ברוכים הבאים ל-HomeRoom</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">שלום <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">נוצר עבורך חשבון חדש במערכת בית הספר HomeRoom. להלן פרטי ההתחברות שלך:</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>שם משתמש (ת״ז):</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${safeUserId}</code></p>
      ${password ? `<p style="margin: 0; font-size: 14px;"><strong>סיסמה ראשונית:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${safePassword}</code></p>` : ""}
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeLoginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 12px 28px; border-radius: 6px;">כניסה למערכת</a>
    </div>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">מומלץ לשנות את הסיסמה דרך הפרופיל האישי לאחר הכניסה הראשונית.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">הודעה זו נשלחה באופן אוטומטי ממערכת HomeRoom.</p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
