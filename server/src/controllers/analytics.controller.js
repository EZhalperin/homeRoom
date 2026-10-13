import { asyncHandler } from "../utils/asyncHandler.js";
import * as analyticsService from "../services/analyticsService.js";

export const getMyChild = asyncHandler(async (req, res) => {
  const months = req.validated.query.months;
  const result = await analyticsService.getMyChildAnalytics(req.user.userId, months);
  res.json(result);
});

export const getMyClass = asyncHandler(async (req, res) => {
  const months = req.validated.query.months;
  const result = await analyticsService.getMyClassAnalytics(req.user.userId, months);
  res.json(result);
});

export const getSchool = asyncHandler(async (req, res) => {
  const months = req.validated.query.months;
  const result = await analyticsService.getSchoolAnalytics(months);
  res.json(result);
});