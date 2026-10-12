# Project Context: HomeRoom
HomeRoom is a cloud-based school communication platform (responsive SPA). 
It centralizes interactions between administration (Admin), teachers, and parents.
The goal is to replace scattered channels (like WhatsApp/paper notes) with a single secure portal.

# User Roles & Core Modules
1. Admin: Manage users (add/suspend), structure school (assign teachers to classes), global messaging, analytics dashboard.[cite: 5, 12, 13]
2. Teacher: Input grades, attendance, and discipline. Distribute digital forms (no signature needed), secure chat with parents.[cite: 5, 18, 19, 20]
3. Parent: Exclusive access ONLY to their child's data (grades, attendance, timetable). Approve forms, report absences, chat with teachers.[cite: 5, 16, 20]

# Polyglot Persistence Architecture (Crucial Rule)
We use TWO separate databases:
1. SQL (Supabase): STRICTLY used ONLY for Identity Management, Passwords (Bcrypt), and Role-Based Access Control (RBAC). It prevents duplication and ensures security.[cite: 5, 6]
   - The User entity in Supabase includes: `id` (UUID, Primary Key), `userId` (ID number, unique), `password` (Bcrypt), `role` (Enum: 'admin', 'teacher', 'parent'), `firstName`, `lastName`, `isActive` (Boolean).[cite: 6]
2. NoSQL (MongoDB): Used for ALL dynamic and pedagogical data (classes, students, grades, attendance, chat history).[cite: 5]
   - Use Embedded Documents: Store students, grades, and attendance inside the "Class" document.[cite: 5, 7, 8]
   - Class Entity: `id` (ObjectId), `teacherId` (String), `className` (String), `students` (Array of Objects), `isActive` (Boolean).[cite: 7]
   - Student Embedded Document: `id` (UUID), `studentId` (String), `firstName`, `lastName`, `academicRiskIndex` (Float, 0.0-10.0), `grades` (Array), `attendance` (Array).[cite: 8, 9]

# Tech Stack & Tech Rules
- Frontend: React.js (Mobile-First approach).[cite: 5]
- Backend: Node.js and Express.js.[cite: 5]
- Real-time: WebSockets via Socket.io for notifications and full-duplex chat.[cite: 5]
- Security: Use JWT for all route authentication. Prevent IDOR (e.g., parents modifying URLs to see other children). Encrypt passwords with Bcrypt.[cite: 5]

# API Routing Standards
- ALL routes must be grouped and authenticated according to the provided documentation.
- Auth Routes: `/api/auth/login` (POST, public), `/api/auth/logout` (POST, public), `/api/auth/me` (GET, all users), `/api/users/me` (PATCH, all users).[cite: 12, 13]
- Admin Routes (Admin Only): `/api/admin/users/register` (POST), `/api/admin/users` (GET), `/api/admin/users/:id` (PUT/DELETE), `/api/admin/classes` (POST), `/api/admin/classes/:id` (DELETE), `/api/admin/students` (GET), `/api/admin/classes/:id/students` (POST), `/api/admin/classes/:classId/students/:id` (DELETE).[cite: 13, 14, 15, 16, 17]
- Staff/Teacher Routes: `/api/staff/classes` (GET), `/api/teachers/my-class` (GET), `/api/teachers/classes/:id/students` (GET), `/api/teachers/students/:id/grades` (POST/PUT), `/api/teachers/students/:id/attendance` (POST/PUT), `/api/teachers/forms` (POST/PUT).[cite: 15, 16, 17, 18, 19, 20]
- Parent Routes (Parents Only): `/api/parents/my-child` (GET), `/api/parents/students/:id/forms/title/approve` (PATCH).[cite: 16, 20]
- Do not mix database logic into the route definitions. Keep controllers clean.

# AI Behavior
- Read the architecture rules carefully before generating backend code.
- Ensure any database operation targets the correct DB (Supabase for Auth/Users, MongoDB for data).
- When asked to create a new route, implement it exactly according to the endpoint structure and required authorization role defined above.
## Hard rules
- Never read, print or modify any `.env` file or any secret/key.
- Do not edit `.cursorrules`.
