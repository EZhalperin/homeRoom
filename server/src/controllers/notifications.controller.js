import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notificationService.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const list = await notificationService.list(req.user.userId, req.validated.query);
  res.json(list);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.unreadCount(req.user.userId);
  res.json(result);
});

export const markRead = asyncHandler(async (req, res) => {
  const doc = await notificationService.markRead(req.validated.params.id, req.user.userId);
  res.json(doc);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.userId);
  res.json(result);
});