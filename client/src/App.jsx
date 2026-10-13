import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import ParentLayout from "./layouts/ParentLayout.jsx";
import { ROLE_HOME } from "./utils/constants.js";

import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import Profile from "./pages/shared/Profile.jsx";
import Chat from "./pages/shared/Chat.jsx";
import Notifications from "./pages/shared/Notifications.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import Users from "./pages/admin/Users.jsx";
import Classes from "./pages/admin/Classes.jsx";
import ClassStudents from "./pages/admin/ClassStudents.jsx";
import Announcements from "./pages/admin/Announcements.jsx";

import MyClass from "./pages/teacher/MyClass.jsx";
import Grades from "./pages/teacher/Grades.jsx";
import Attendance from "./pages/teacher/Attendance.jsx";
import TeacherForms from "./pages/teacher/Forms.jsx";
import RiskAlerts from "./pages/teacher/RiskAlerts.jsx";

import ChildOverview from "./pages/parent/ChildOverview.jsx";
import ParentForms from "./pages/parent/Forms.jsx";
import Schedule from "./pages/parent/Schedule.jsx";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<RoleRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:classId" element={<ClassStudents />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<MyClass />} />
            <Route path="grades" element={<Grades />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="forms" element={<TeacherForms />} />
            <Route path="risk" element={<RiskAlerts />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={["parent"]} />}>
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<ChildOverview />} />
            <Route path="forms" element={<ParentForms />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
