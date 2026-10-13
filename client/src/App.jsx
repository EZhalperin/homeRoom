import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import ParentLayout from "./layouts/ParentLayout.jsx";
import Spinner from "./components/ui/Spinner.jsx";
import { ROLE_HOME } from "./utils/constants.js";

// Static imports for core auth pages
import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import Profile from "./pages/shared/Profile.jsx";

// Lazy-loaded routes for code-splitting (isolates recharts & heavy domain pages)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const Users = lazy(() => import("./pages/admin/Users.jsx"));
const Classes = lazy(() => import("./pages/admin/Classes.jsx"));
const ClassStudents = lazy(() => import("./pages/admin/ClassStudents.jsx"));
const AdminAnnouncements = lazy(() => import("./pages/admin/Announcements.jsx"));

const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard.jsx"));
const MyClass = lazy(() => import("./pages/teacher/MyClass.jsx"));
const Grades = lazy(() => import("./pages/teacher/Grades.jsx"));
const Attendance = lazy(() => import("./pages/teacher/Attendance.jsx"));
const TeacherForms = lazy(() => import("./pages/teacher/Forms.jsx"));
const RiskAlerts = lazy(() => import("./pages/teacher/RiskAlerts.jsx"));
const TeacherAnnouncements = lazy(() => import("./pages/teacher/Announcements.jsx"));

const ChildOverview = lazy(() => import("./pages/parent/ChildOverview.jsx"));
const ParentForms = lazy(() => import("./pages/parent/Forms.jsx"));
const Schedule = lazy(() => import("./pages/parent/Schedule.jsx"));
const ParentAnnouncements = lazy(() => import("./pages/parent/Announcements.jsx"));

const Chat = lazy(() => import("./pages/shared/Chat.jsx"));
const Notifications = lazy(() => import("./pages/shared/Notifications.jsx"));

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

function PageFallback() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <Spinner />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin routes */}
          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="classes" element={<Classes />} />
              <Route path="classes/:classId" element={<ClassStudents />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Teacher routes */}
          <Route element={<RoleRoute roles={["teacher"]} />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="class" element={<MyClass />} />
              <Route path="announcements" element={<TeacherAnnouncements />} />
              <Route path="grades" element={<Grades />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="forms" element={<TeacherForms />} />
              <Route path="risk" element={<RiskAlerts />} />
              <Route path="chat" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Parent routes */}
          <Route element={<RoleRoute roles={["parent"]} />}>
            <Route path="/parent" element={<ParentLayout />}>
              <Route index element={<ChildOverview />} />
              <Route path="announcements" element={<ParentAnnouncements />} />
              <Route path="forms" element={<ParentForms />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="chat" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}