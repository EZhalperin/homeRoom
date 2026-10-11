import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/ui/Toast.jsx";
import { getErrorMessage } from "../utils/errors.js";

/**
 * Mutation with: invalidate query keys, success toast, error toast.
 * @param {(vars:any)=>Promise<any>} fn
 * @param {{ invalidate?: unknown[][], success?: string, onSuccess?: Function }} [opts]
 */
export function useApiMutation(fn, { invalidate = [], success, onSuccess } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (success) toast.success(success);
      onSuccess?.(data, vars);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
