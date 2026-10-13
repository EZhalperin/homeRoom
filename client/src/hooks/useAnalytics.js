import { useQuery } from "@tanstack/react-query";
import {
  getMyChildAnalytics,
  getMyClassAnalytics,
  getSchoolAnalytics,
} from "../api/analytics.js";

export function useMyChildAnalytics(params = { months: 6 }) {
  return useQuery({
    queryKey: ["analytics", "parent", params],
    queryFn: () => getMyChildAnalytics(params),
  });
}

export function useMyClassAnalytics(params = { months: 6 }) {
  return useQuery({
    queryKey: ["analytics", "teacher", params],
    queryFn: () => getMyClassAnalytics(params),
  });
}

export function useSchoolAnalytics(params = { months: 6 }) {
  return useQuery({
    queryKey: ["analytics", "admin", params],
    queryFn: () => getSchoolAnalytics(params),
  });
}