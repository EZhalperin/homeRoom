# דו"ח ניקוי: הסרת דף דיווח חיסור להורים (REPORT_parent_cleanup.md)

## מה בוצע (Summary of Changes)
הוסר דף "דיווח חיסור" להורים (`/parent/report-absence`), מאחר שאין לו API ייעודי ואין בו צורך (נתוני הנוכחות כבר מוצגים ומנוהלים בסקירת ההורה).

## קבצים שנמחקו / עודכנו (Files Modified / Deleted)
1. **נמחק**: `client/src/pages/parent/ReportAbsence.jsx` - הדף הכיל רכיב ComingSoon בלבד ללא API.
2. **עודכן**: `client/src/App.jsx` - הוסר ה-import של `ReportAbsence` והוסר ה-Route של `report-absence`.
3. **עודכן**: `client/src/layouts/ParentLayout.jsx` - הוסר הפריט של "חיסור" מתפריט הניווט התחתון (`NAV`).

## בדיקת הפניות נוספות (Grep References)
בוצע חיפוש רוחבי (`grep`) בכל הפרויקט:
- לא נמצאו הפניות נוספות ב-client בקוד הפעיל (ההפניה היחידה הייתה בסקריפט התקנה היסטורי `setup-homeroom-client.sh`).
- קובצי השרת של חיסורים/נוכחות נותרו ללא שינוי בהתאם להנחיות.

## תפריט הניווט של ההורים (ParentLayout Bottom Nav)
- התפריט מונה כעת **4 פריטים** (עומד במגבלת מקסימום 5 פריטים).
- **סדר הפריטים הסופי בתפריט**:
  1. סקירה (`/parent`, `end: true`)
  2. טפסים (`/parent/forms`)
  3. צ'אט (`/parent/chat`)
  4. פרופיל (`/parent/profile`)
- **הערה לגבי דף הודעות להורים (`/parent/announcements`)**: נבדק האם קיים דף כזה - הדף אינו קיים כרגע במערכת. לכשייווצר בעתיד, יש להוסיפו לתפריט הניווט (יש מקום לפריט חמישי).

## אימות סקירת ההורה (ChildOverview)
אומת כי דף סקירת ההורה (`client/src/pages/parent/ChildOverview.jsx`) ממשיך להציג באופן תקין ומלא:
- כרטיסיות סטטיסטיקה לחיסורים ולאיחורים (`חיסורים`, `איחורים`).
- רשימת תיעוד נוכחות מלאה (`<AttendanceList records={child.attendance} />`).

## בדיקות בנייה (Verification)
- הורץ `npm run build` בלקוח - עבר בהצלחה מלאה ללא שגיאות.