# דו"ח מימוש שכבת זמן אמת (Realtime Layer) - HomeRoom

## 1. סיכום ביצוע ומאפיינים (Executive Summary & Features Implemented)

מימוש שכבת ה-Realtime הושלם במלואו על פני כל השלבים (A, B, C):

### שלב א' (Phase A) - מודלים, תשתית והתראות
1. **מודלים ואינדקסים ב-MongoDB**:
   - `notifications`: מזהה ייחודי, סוג התראה (`announcement`, `chat`, `grade`, `attendance`, `form`, `risk`), כותרת, גוף, קישור, תאריך קריאה, TTL של 90 יום (`createdAt`), אינדקס ייחודי על `(userId, readAt, createdAt)`.
   - `announcements`: כותרת, גוף, מחבר, תאריך, סוג קהל יעד (`all`, `teachers`, `parents`, `class`), ומזהה כיתה.
   - `chat_rooms`: חדר 1:1 בין מחנך/ת הכיתה להורי התלמיד (`classId`, `teacherUserId`, `studentUuid`, `parentUserId`, `studentName`), אינדקס ייחודי על `(classId, studentUuid)`.
   - `chat_messages`: מזהה חדר, שולח, תפקיד, תוכן הודעה (עד 2000 תווים), אינדקס על `(roomId, createdAt)`.
2. **תשתית Realtime מבודדת (`sockets/realtime.js`)**:
   - פונקציות פאבלישר שקטות (`emitToUser`, `emitToRoom`, `disconnectUser`, `isUserInRoom`) התומכות בעבודה ללא שרת סוקט (No-op בזמן טסטים).
3. **שירותי והתראות מערכת (`/api/notifications`, `/api/announcements`)**:
   - פתרון קהל יעד דינמי עבור מורים, הורים וצוות הנהלה.
   - טריגרים אוטומטיים: הפצת טופס, רישום נוכחות, הזנת ציון, וחציית סף סיכון כלפי מעלה בלבד.

### שלב ב' (Phase B) - שרת Socket.io ושירות הצ'אט
1. **התקנת והפעלת Socket.io בשרת**:
   - הותקנה חבילת `socket.io` ב-`server/package.json`.
   - `server/src/server.js` עוטף את `app` בשרת HTTP, מגדיר את שרת ה-Socket עם תמיכת CORS מאומתת (`env.CORS_ORIGIN`, credentials), מחבר את הפאבלישר ומפעיל סגירה הדרגתית (Graceful Shutdown) של הסוקטים, ה-HTTP ומסד הנתונים.
2. **אימות וסנכרון סוקטים (`sockets/index.js`)**:
   - Middleware לאימות JWT מתוך `socket.handshake.auth.token` או כותרת ה-Authorization.
   - בדיקת מצב משתמש פעיל מול Supabase (`findByUserId`). אם `isActive === false`, החיבור נדחה מיידית.
   - הצטרפות אוטומטית לחדר אישי `user:${userId}`.
   - ניתוק מאולץ של סוקטים פעילים בזמן אמת בעת השעיית משתמש דרך `userService.suspendUser` או `userService.updateUser`.
3. **שירות הצ'אט ומאגרי המידע (`chatRepository.js`, `chatService.js`)**:
   - `getOrCreateRoom`: מורה מורשה לפתוח שיחה רק עם הורי תלמיד בכיתתו הפעילה (`studentService.resolveTeacherStudent`); הורה מקושר אוטומטית למחנך של ילדו הפעיל (`studentRepository.findActiveStudentByStudentId`).
   - `assertParticipant`: אכיפת הרשאה קפדנית - מורה שאינו מחנך הכיתה או הורה שאינו הורה התלמיד מקבלים 403 Forbidden.
   - `sendMessage`: עדכון תצוגה מקדימה וזמן הודעה אחרונה, שידור אירוע `chat:message` בחדר הסוקט.
   - **התראת רקע מותנית**: התראה נוצרת ונשלחת לנמען *אך ורק* אם הוא אינו נמצא כעת בתוך חדר הצ'אט (`!isUserInRoom(recipientUserId, 'chat:${roomId}')`).
   - `markRead`: עדכון חותמת קריאה לפי תפקיד ושידור אירוע `chat:read`.
4. **אירועי סוקט ו-REST Controller (`chat.socket.js`, `chat.controller.js`)**:
   - אירועי סוקט עם Acknowledgment: `chat:join`, `chat:leave`, `chat:send`, `chat:typing`, `chat:read`.
   - הגבלת קצב לכל סוקט (Per-socket Rate Limiting) למניעת הצפה (עד 30 אירועים ב-10 שניות).
   - נקודות קצה REST תחת `/api/chat/rooms*` עם ולידציית Zod (`chat.validator.js`).

### שלב ג' (Phase C) - צד לקוח (Client)
1. **התקנת socket.io-client ופרוקסי Vite**:
   - הותקן `socket.io-client` ב-`client/package.json`.
   - עודכן `client/vite.config.js` עם פרוקסי `/socket.io` בעל הגדרת `ws: true`.
2. **שכבת API וניהול תקשורת סוקט**:
   - נוצרו ספריות הלקוח: `client/src/api/notifications.js`, `client/src/api/announcements.js`, `client/src/api/chat.js`.
   - נוצר `SocketContext.jsx` ו-`useSocket.js`: חיבור אוטומטי מבוסס טוקן, ניתוק בעת יציאה, אינבלידציה אוטומטית של שאילתות React Query עם קבלת אירועי זמן אמת (`notification:new`, `announcement:new`, `chat:message`, `chat:read`).
3. **רכיבי ממשק משתמש (UI Components)**:
   - `NotificationBell.jsx` ב-`AppShell`: פעמון עם תג מונה של התראות שלא נקראו, פאנל נפתח לצפייה מהירה, סימון קריאה, וסימון הכל כנקרא.
   - `AnnouncementCard.jsx` ו-`AnnouncementForm.jsx`: כרטיס תצוגת הודעות וטופס פרסום דינמי למנהל ולמורה.
   - `RoomList.jsx` ו-`ChatWindow.jsx`: רשימת שיחות מותאמת תפקיד, בחירת תלמיד לכיתת המחנך, חלון שיחה דו-כיווני, אינדיקטור הקלדה בזמן אמת, גלילה אוטומטית וסימון קריאה.
4. **עמודי מערכת וניווט**:
   - `pages/shared/Notifications.jsx`: דף התראות מלא עם סינון לפי לא-נקראו, סימון הכל כנקרא ומעבר לקישורים.
   - `pages/shared/Chat.jsx`: ממשק צ'אט רספונסיבי מלא (חלוקה לשני טורים בדסקטופ, Master-detail במובייל, סינכרון עם פרמטר `?roomId=`).
   - `pages/admin/Announcements.jsx`: לוח מודעות ופרסום הודעות בית ספריות.
   - `pages/teacher/Announcements.jsx`: לוח מודעות כיתתי ובית ספרי למורים.
   - `pages/parent/Announcements.jsx`: לוח מודעות להורים.
   - ניווט תחתון להורים (`ParentLayout.jsx`) נשמר בדיוק על 5 פריטים: סקירה, הודעות, טפסים, צ'אט, פרופיל.

---

## 2. קבצים שנוצרו / שונו (Files Created / Modified)

### שרת (Server):
- **נוצרו**:
  - `server/src/models/Notification.js`
  - `server/src/models/Announcement.js`
  - `server/src/models/ChatRoom.js`
  - `server/src/models/ChatMessage.js`
  - `server/src/sockets/realtime.js`
  - `server/src/sockets/index.js`
  - `server/src/sockets/chat.socket.js`
  - `server/src/repositories/notificationRepository.js`
  - `server/src/repositories/announcementRepository.js`
  - `server/src/repositories/chatRepository.js`
  - `server/src/services/notificationService.js`
  - `server/src/services/announcementService.js`
  - `server/src/services/chatService.js`
  - `server/src/validators/notifications.validator.js`
  - `server/src/validators/announcements.validator.js`
  - `server/src/validators/chat.validator.js`
  - `server/src/controllers/notifications.controller.js`
  - `server/src/controllers/announcements.controller.js`
  - `server/src/controllers/chat.controller.js`
  - `server/src/routes/notifications.routes.js`
  - `server/src/routes/announcements.routes.js`
  - `server/src/routes/chat.routes.js`
  - `server/tests/notificationService.test.js`
  - `server/tests/announcementService.test.js`
  - `server/tests/chatService.test.js`
  - `server/tests/gradeService.test.js`
  - `server/tests/riskIndexService.test.js`
- **עודכנו**:
  - `server/package.json` (הוספת `socket.io`)
  - `server/src/server.js` (חיבור `http.createServer`, `SocketIOServer`, `setupSockets`, graceful shutdown)
  - `server/src/config/mongo.js` (אינדקסים עבור 4 האוספים)
  - `server/src/routes/index.js` (ניתוב `/notifications`, `/announcements`, `/chat`)
  - `server/src/services/userService.js` (ניתוק סוקטים פעילים בעת השעיית משתמש)
  - `server/src/services/formService.js`, `attendanceService.js`, `gradeRecordService.js`, `studentService.js` (טריגרי התראות)

### לקוח (Client):
- **נוצרו**:
  - `client/src/api/notifications.js`
  - `client/src/api/announcements.js`
  - `client/src/api/chat.js`
  - `client/src/context/SocketContext.jsx`
  - `client/src/hooks/useSocket.js`
  - `client/src/components/domain/NotificationBell.jsx` & `.module.css`
  - `client/src/components/domain/AnnouncementCard.jsx` & `.module.css`
  - `client/src/components/domain/AnnouncementForm.jsx` & `.module.css`
  - `client/src/components/domain/RoomList.jsx` & `.module.css`
  - `client/src/components/domain/ChatWindow.jsx` & `.module.css`
  - `client/src/pages/teacher/Announcements.jsx`
  - `client/src/pages/parent/Announcements.jsx`
  - `client/src/pages/shared/Notifications.module.css`
  - `client/src/pages/shared/Chat.module.css`
- **עודכנו**:
  - `client/package.json` (הוספת `socket.io-client`)
  - `client/vite.config.js` (הוספת פרוקסי websocket)
  - `client/src/main.jsx` (עטיפה ב-`SocketProvider`)
  - `client/src/App.jsx` (הוספת נתיבי announcements ו-notifications לכל התפקידים)
  - `client/src/layouts/AppShell.jsx` (שילוב `NotificationBell` בכותרת)
  - `client/src/layouts/TeacherLayout.jsx` (הוספת קישור מודעות)
  - `client/src/layouts/ParentLayout.jsx` (הוספת מודעות ושמירה על 5 פריטים בניווט התחתון)
  - `client/src/pages/shared/Notifications.jsx` (מימוש מלא מבוסס React Query)
  - `client/src/pages/shared/Chat.jsx` (מימוש מלא עם סוקטים ותמיכת מובייל)
  - `client/src/pages/admin/Announcements.jsx` (מימוש מלא לניהול מודעות)
  - `client/src/utils/formatters.js` (פונקציות `formatRelativeTime` ו-`formatDateTime`)

---

## 3. החלטות ארכיטקטוניות ועיצוביות (Key Decisions)

1. **מניעת התראות כפולות בצ'אט**:
   - כאשר משתמש שולח הודעה, המערכת בודקת האם הנמען מחובר כעת בחדר הספציפי (`isUserInRoom(recipientUserId, 'chat:${roomId}')`). רק אם הוא **אינו** נמצא בחדר, נוצרת עבורו רשומת התראה ב-`notifications`.
2. **אבטחה והרשאות Zero-Trust**:
   - כל פעולות הצ'אט והסוקט נשענות אך ורק על המשתמש המאומת מתוך ה-JWT.
   - מורה לעולם אינו יכול לצ'וטט עם תלמיד מחוץ לכיתתו; הורה לעולם אינו יכול לצ'וטט עם מורה שאינו מחנך הכיתה הפעילה של ילדו.
   - השעיית משתמש מנתקת מיידית את כל הטאבים והסוקטים הפעילים שלו (`disconnectUser`).
3. **עיצוב ונגישות RTL בלבד**:
   - כל ה-CSS נכתב ב-CSS Modules תוך שימוש בלעדי במאפיינים לוגיים (`margin-inline`, `padding-inline`, `border-block`, `inset-inline-start`, וכו').
   - ניווט תחתון להורים במובייל מוגבל בדיוק ל-5 פריטים עבור נוחות שימוש וגודל טאץ' תקני.

---

## 4. תוצאות בדיקות ובנייה (Verification Results)

- **בדיקות שרת (`server`)**:
  - פקודה: `npm test`
  - תוצאה: **10 מתוך 10 סוויטות עברו בהצלחה (76 בדיקות יחידה ואינטגרציה מלאות)**.
- **בניית לקוח (`client`)**:
  - פקודה: `npm run build` (`tsc -b && vite build`)
  - תוצאה: **עובר בהצלחה מלאה ב-715ms, ללא שגיאות TypeScript או Vite**.