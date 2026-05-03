import { create } from "zustand";

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    employeeId?: string;
  } | null;
  isLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isLoading: false }),
}));
