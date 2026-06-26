import { createContext, useContext } from "react";
import type { UserRole } from "../data/mockUser";

export type RoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

export const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function useRole() {
  const value = useContext(RoleContext);

  if (!value) {
    throw new Error("useRole must be used inside RoleContext.Provider");
  }

  return value;
}
