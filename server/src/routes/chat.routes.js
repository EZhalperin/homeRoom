import { Router } from "express";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import {
  createRoomSchema,
  roomIdParamSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
} from "../validators/chat.validator.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

// Restrict chat endpoints to teachers and parents only
router.use(authorizeRole("teacher", "parent"));

router.post("/rooms", validate(createRoomSchema), chatController.getOrCreateRoom);
router.get("/rooms", chatController.listRooms);
router.get("/rooms/:roomId/messages", validate(getMessagesQuerySchema), chatController.getMessages);
router.post("/rooms/:roomId/messages", validate(sendMessageSchema), chatController.sendMessage);
router.patch("/rooms/:roomId/read", validate(roomIdParamSchema), chatController.markRead);

export default router;