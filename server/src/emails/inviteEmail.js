import { escapeHtml } from "./escapeHtml.js";

/**
 * @param {{ firstName?: string, resetUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function inviteEmail({ firstName, resetUrl }) {
  const safeName = escapeHtml(firstName || "משתמש/ת");
  const safeUrl = escapeHtml(resetUrl);

  const subject = "הזמנה להצטרפות למערכת HomeRoom והגדרת סיסמה";

  const text = `שלום ${firstName || "משתמש/ת"},

נוצר עבורך חשבון במערכת HomeRoom.
כדי להגדיר את הסיסמה הראשונית ולהתחיל להשתמש במערכת, אנא היכנס/י לקישור הבא:
${resetUrl}

הקישור בתוקף ל-48 שעות.
אם לא ציפית להזמנה זו, ניתן להתעלם מהודעה זו.

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
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">נוצר עבורך חשבון במערכת בית הספר HomeRoom. כדי להתחיל להשתמש במערכת, אנא הגדר/י את סיסמת הכניסה הראשונית שלך.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 12px 28px; border-radius: 6px;">הגדרת סיסמה ראשונית</a>
    </div>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">קישור זה יהיה בתוקף למשך <strong>48 שעות</strong> בלבד וניתן להשתמש בו פעם אחת.</p>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">אם הלחצן אינו פועל, ניתן להעתיק את הקישור הבא ולהדביקו בדפדפן:<br><a href="${safeUrl}" style="color: #2563eb; word-break: break-all;">${safeUrl}</a></p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">אם לא ציפית להודעה זו, ניתן להתעלם ממנה בבטחה.</p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}