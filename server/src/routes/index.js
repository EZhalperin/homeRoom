import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { isAdmin } from "../middleware/authorizeRole.js";

import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import adminUsersRoutes from "./admin.users.routes.js";
import classesRoutes from "./classes.routes.js";
import studentsRoutes from "./students.routes.js";
import gradesRoutes from "./grades.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import formsRoutes from "./forms.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/admin/users", verifyToken, isAdmin, adminUsersRoutes);
router.use(classesRoutes);
router.use(studentsRoutes);
router.use(gradesRoutes);
router.use(attendanceRoutes);
router.use(formsRoutes);

export default router;
