import { asyncHandler } from "../utils/asyncHandler.js";
import * as announcementService from "../services/announcementService.js";

export const createAnnouncement = asyncHandler(async (req, res) => {
  const doc = await announcementService.createAnnouncement(req.user, req.validated.body);
  res.status(201).json(doc);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const list = await announcementService.listAnnouncements(req.user, req.validated.query);
  res.json(list);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementService.deleteAnnouncement(req.validated.params.id, req.user);
  res.json(result);
});

export const getAudienceStats = asyncHandler(async (req, res) => {
  const stats = await announcementService.getAudienceStats();
  res.json(stats);
});