import { useQuery } from "@tanstack/react-query";
import { getMyClass } from "../api/classes.js";
import { getMyChild } from "../api/students.js";

export const useMyClass = () => useQuery({ queryKey: ["myClass"], queryFn: getMyClass });
export const useMyChild = () => useQuery({ queryKey: ["myChild"], queryFn: getMyChild, retry: false });
