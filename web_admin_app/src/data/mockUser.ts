export type UserRole = "admin" | "staff" | "viewer";

export const mockUser = {
  name: "值勤人員 A",
  role: "admin" as UserRole,
  note: "目前角色：admin",
};

export const roleOptions: UserRole[] = ["admin", "staff", "viewer"];
