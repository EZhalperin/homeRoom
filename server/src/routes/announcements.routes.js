import { Router } from "express";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcements.controller.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import {
  createAdminAnnouncementSchema,
  createTeacherAnnouncementSchema,
  listAnnouncementsSchema,
  announcementIdParamSchema,
} from "../validators/announcements.validator.js";

const router = Router();

router.post(
  "/",
  authorizeRole("admin", "teacher"),
  (req, res, next) => {
    const schema =
      req.user?.role === "teacher"
        ? createTeacherAnnouncementSchema
        : createAdminAnnouncementSchema;
    return validate(schema)(req, res, next);
  },
  createAnnouncement,
);

router.get(
  "/",
  validate(listAnnouncementsSchema),
  getAnnouncements,
);

router.delete(
  "/:id",
  authorizeRole("admin", "teacher"),
  validate(announcementIdParamSchema),
  deleteAnnouncement,
);

export default router;