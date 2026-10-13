import { asyncHandler } from "../utils/asyncHandler.js";
import * as chatService from "../services/chatService.js";

export const getOrCreateRoom = asyncHandler(async (req, res) => {
  const room = await chatService.getOrCreateRoom(req.user, req.validated?.body || {});
  res.status(200).json(room);
});

export const listRooms = asyncHandler(async (req, res) => {
  const rooms = await chatService.listRooms(req.user);
  res.status(200).json(rooms);
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(
    req.validated.params.roomId,
    req.user,
    req.validated.query,
  );
  res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(
    req.validated.params.roomId,
    req.user,
    req.validated.body.text,
  );
  res.status(201).json(message);
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await chatService.markRead(
    req.validated.params.roomId,
    req.user,
  );
  res.status(200).json(result);
});