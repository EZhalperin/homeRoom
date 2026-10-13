import { api } from "./axiosClient.js";

export const getMyChildAnalytics = (params) =>
  api.get("/analytics/my-child", { params }).then((r) => r.data);

export const getMyClassAnalytics = (params) =>
  api.get("/analytics/my-class", { params }).then((r) => r.data);

export const getSchoolAnalytics = (params) =>
  api.get("/analytics/school", { params }).then((r) => r.data);