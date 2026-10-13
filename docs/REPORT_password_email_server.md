# דו"ח שרת: מנגנון הגדרה ואיפוס סיסמה במייל (REPORT_password_email_server.md)

## מה נבנה (What Was Built)
מנגנון מאובטח ומשותף לשני תהליכי אימות מבוססי טוקן במייל:
1. **הזמנת משתמש חדש (Invite)**: מנהל יוצר משתמש ללא סיסמה. המשתמש מקבל מייל עם קישור מאובטח להגדרת סיסמה ראשונית (תוקף ל-48 שעות).
2. **איפוס סיסמה (Forgot / Reset Password)**: משתמש קיים מבקש איפוס סיסמה, ומקבל מייל עם קישור חד-פעמי (תוקף לשעה אחת).

## החלטות ארכיטקטוניות ומימוש (Decisions & Architecture)
- **אבטחת טוקנים**:
  - הטוקן הגולמי נוצר באמצעות `crypto.randomBytes(32).toString('base64url')`.
  - בבסיס הנתונים נשמר **אך ורק ה-SHA256 hash** של הטוקן (הטוקן הגולמי מופיע רק בקישור הנשלח למייל).
  - מימוש חד-פעמי ואטומי באמצעות `findOneAndUpdate` עם סימון `usedAt`.
  - יצירת טוקן חדש עבור אותו משתמש ומטרה מבטלת אוטומטית טוקנים קודמים שטרם נוצלו.
  - בעת איפוס סיסמה מוצלח, כל שאר הטוקנים של המשתמש מבוטלים אוטומטית (`invalidateAllForUser`).
- **הגנה מפני User Enumeration ו-Timing Attacks**:
  - `POST /api/auth/forgot-password` מחזיר תמיד סטטוס 200 עם הודעה אחידה וניטרלית, בין אם האימייל קיים, לא קיים, או מושעה.
  - שליחת המייל מתבצעת ברקע בהבטחה לא-ממתינה (non-awaited promise) עם `.catch(logger.error)` מפורש, כדי למנוע הבדלי זמנים הניתנים למדידה.
  - הוגדר Cooldown פנימי של 60 שניות לכל כתובת מייל למניעת הצפת מיילים, בנוסף ל-Rate Limiter לפי IP (5 בקשות ל-15 דק').
- **טרנספורט מייל (emailService.js)**:
  - טרנספורט בגישת Lazy Singleton מבוסס Nodemailer.
  - בסביבת ייצור (Production): משתני `SMTP_*` ו-`APP_BASE_URL` הינם חובה (Fail-Fast בטעינה).
  - בסביבת פיתוח (Development): במידה ולא הוגדר שרת SMTP, המערכת יוצרת אוטומטית חשבון בדיקה ב-Ethereal ורושמת ללוג קישור לתצוגה מקדימה (Preview URL).
  - תבניות מייל בעברית, Responsive HTML + Plain Text, עיצוב RTL, סניטציה מלאה לערכים מוזרקים, ללא תמונות מרוחקות וללא מעקב.
- **מדיניות סיסמאות משותפת**:
  - סכמת `passwordSchema` יחידה ב-`validators/common.js`: בין 8 ל-72 תווים, לפחות אות אחת וספרה אחת.
  - בשימוש ב-Register, ב-Reset Password וב-PATCH `/api/users/me`.
- **חסימת כניסה למשתמשים שטרם הגדירו סיסמה**:
  - משתמש שערך `passwordSet` שלו הוא `false` נחסם בכניסה עם שגיאת 401 גנרית זהה לסיסמה שגויה ("Invalid credentials").

## קבצים שנוצרו / שונו / נמחקו (Files Created / Modified / Deleted)
### קבצים שנוצרו:
- `server/src/models/PasswordToken.js`: מבנה מסמך MongoDB עבור `passwordTokens`.
- `server/src/repositories/passwordTokenRepository.js`: שכבת גישה יחידה לאוסף `passwordTokens` (יצירה, אימות, צריכה אטומטית, ביטול).
- `server/src/emails/escapeHtml.js`: פונקציית סניטציה עבור תווי HTML.
- `server/src/emails/inviteEmail.js`: תבנית מייל הזמנה והגדרת סיסמה ראשונית.
- `server/src/emails/resetEmail.js`: תבנית מייל איפוס סיסמה.
- `server/src/services/emailService.js`: שירות שליחת מיילים וניהול טרנספורט SMTP / Ethereal.
- `server/tests/passwordReset.test.js`: חבילת בדיקות מקיפה (30 בדיקות) לכל התרחישים הנדרשים.

### קבצים שעודכנו:
- `server/package.json`: הוספת תלות `nodemailer`.
- `server/.env.example`: תיעוד משתני `APP_BASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
- `server/src/config/env.js`: ולידציית Zod עבור משתני המייל ו-APP_BASE_URL עם אכיפת חובה ב-production.
- `server/tests/setupEnv.js`: הגדרת משתני בדיקה עבור APP_BASE_URL ו-MAIL_FROM.
- `server/src/config/mongo.js`: הוספת אינדקסים ב-`ensureIndexes` לאוסף `passwordTokens` (ייחודי על tokenHash, אינדקס על userId+purpose, ו-TTL על expiresAt).
- `server/sql/schema.sql`: הוספת `"passwordSet" boolean not null default true` לטבלת `public.users`.
- `server/src/repositories/userRepository.js`: הוספת `passwordSet` ל-`PUBLIC_COLUMNS` והוספת מתודת `findByEmail`.
- `server/src/validators/common.js`: הוספת `passwordSchema` (8-72 תווים, אות וספרה).
- `server/src/validators/admin.users.validator.js`: עדכון `registerUserSchema` כך ש-password הוא אופציונלי.
- `server/src/validators/users.validator.js`: עדכון `updateMeSchema` לשימוש ב-`passwordSchema`.
- `server/src/validators/auth.validator.js`: הוספת סכמות `forgotPasswordSchema`, `passwordTokenParamSchema`, `resetPasswordSchema`.
- `server/src/middleware/rateLimiter.js`: הוספת `forgotPasswordLimiter`, `passwordTokenLimiter`, `resetPasswordLimiter`.
- `server/src/services/authService.js`: הוספת בדיקת `passwordSet` ב-login, יצירת טוקנים, אימות, איפוס סיסמה וטיפול ב-forgot-password.
- `server/src/services/userService.js`: עדכון `registerUser` לסיסמה אופציונלית/הזמנה במייל, והוספת `sendInvite`.
- `server/src/controllers/auth.controller.js`: הוספת `forgotPassword`, `validateToken`, `resetPassword`.
- `server/src/controllers/users.controller.js`: עדכון תגובת רישום משתמש עם `inviteSent` והוספת בקר `sendInvite`.
- `server/src/routes/auth.routes.js`: חשיפת נתיבי forgot-password, password-token, reset-password.
- `server/src/routes/admin.users.routes.js`: חשיפת נתיב `POST /api/admin/users/:id/send-invite`.

## משפט SQL להרצה ידנית ב-Supabase (Manual SQL Step)
יש להריץ את הפקודה הבאה בעורך ה-SQL של Supabase:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "passwordSet" boolean NOT NULL DEFAULT true;
```

## בדיקות (Verification)
- הורץ `npm test` בשרת - **כל 5 חבילות הבדיקה ו-30 בדיקות עברו בהצלחה מלאה**.