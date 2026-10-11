import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { ROLE_HOME } from "../utils/constants.js";

/** Lets only the given roles in; everyone else goes to their own home. */
export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
