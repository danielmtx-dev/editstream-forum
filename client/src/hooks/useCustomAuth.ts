import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useCustomAuth() {
  const { data: user, isLoading: loading, refetch } = trpc.customAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const loginMutation = trpc.customAuth.login.useMutation({
    onSuccess: () => { refetch(); },
  });

  const registerMutation = trpc.customAuth.register.useMutation({
    onSuccess: () => { refetch(); },
  });

  const logoutMutation = trpc.customAuth.logout.useMutation({
    onSuccess: () => { refetch(); },
  });

  const login = useCallback(async (loginStr: string, password: string, rememberMe?: boolean) => {
    return loginMutation.mutateAsync({ login: loginStr, password, rememberMe });
  }, [loginMutation]);

  const register = useCallback(async (data: {
    username: string;
    password: string;
    verificationCode?: string;
  }) => {
    return registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    user: user ?? null,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isGroupMember: user?.isGroupMember ?? false,
    login,
    register,
    logout,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  };
}
