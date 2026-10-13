import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../controllers/notifications.controller.js";
import { validate } from "../middleware/validate.js";
import {
  listNotificationsSchema,
  notificationIdParamSchema,
} from "../validators/notifications.validator.js";

const router = Router();

router.get("/", validate(listNotificationsSchema), getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", validate(notificationIdParamSchema), markRead);
router.post("/read-all", markAllRead);

export default router;