"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getRoleFromToken, clearToken } from "@/lib/api-client";
import { useRouter } from "next/navigation";

type Role = "admin" | "doctor" | "cashier" | null;

interface RoleContextType {
  role: Role;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isCashier: boolean;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  isLoading: true,
  isAdmin: false,
  isDoctor: false,
  isCashier: false,
  logout: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadRole = () => {
    const r = getRoleFromToken() as Role;
    setRole(r);
    setIsLoading(false);

    // Jika token ada tapi cookie belum ada → set cookie + reload sekali
    // agar middleware bisa membaca cookie pada request berikutnya
    if (r && typeof document !== "undefined") {
      const hasCookie = document.cookie.split(";").some(c => c.trim().startsWith("user_role="));
      if (!hasCookie) {
        document.cookie = `user_role=${r}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
        // Reload sekali (flag agar tidak loop)
        if (!sessionStorage.getItem("cookie_repaired")) {
          sessionStorage.setItem("cookie_repaired", "1");
          window.location.reload();
        }
      }
    }
  };

  useEffect(() => {
    // Baca role pertama kali
    loadRole();

    // Reactive saat token berubah (misal: logout di tab lain)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "access_token") loadRole();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const logout = () => {
    clearToken();
    setRole(null);
    router.push("/login");
  };

  return (
    <RoleContext.Provider value={{
      role,
      isLoading,
      isAdmin: role === "admin",
      isDoctor: role === "doctor",
      isCashier: role === "cashier",
      logout,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
