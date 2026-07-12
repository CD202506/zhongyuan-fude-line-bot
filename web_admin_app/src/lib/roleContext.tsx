import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "../data/mockUser";
import { mockIdentities, type MockIdentity } from "./identity";

const sessionKey = "zyfude-web-admin-mock-identity";

export type RoleContextValue = {
  identity: MockIdentity | null;
  role: UserRole;
  loginAs: (role: UserRole) => void;
  logout: () => void;
};

export const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function identityFromSession() {
  const savedRole = sessionStorage.getItem(sessionKey) as UserRole | null;
  if (!savedRole || !mockIdentities[savedRole]) return null;
  return mockIdentities[savedRole];
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<MockIdentity | null>(() => identityFromSession());

  const value = useMemo<RoleContextValue>(() => ({
    identity,
    role: identity?.displayRole ?? "viewer",
    loginAs(role) {
      const nextIdentity = mockIdentities[role];
      // mock authentication is replaceable by real authentication adapter.
      sessionStorage.setItem(sessionKey, role);
      setIdentity(nextIdentity);
    },
    logout() {
      sessionStorage.removeItem(sessionKey);
      setIdentity(null);
    },
  }), [identity]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);

  if (!value) {
    throw new Error("useRole must be used inside RoleContext.Provider");
  }

  return value;
}
