import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth(options: { redirectPath?: string } = {}) {
  const [, navigate] = useLocation();
  const query = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => query.refetch(),
  });

  useEffect(() => {
    if (!query.isLoading && !query.data && options.redirectPath) navigate(options.redirectPath);
  }, [navigate, options.redirectPath, query.data, query.isLoading]);

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    isAuthenticated: Boolean(query.data),
    logout: () => logoutMutation.mutate(),
    logoutPending: logoutMutation.isPending,
    refetch: query.refetch,
  };
}
