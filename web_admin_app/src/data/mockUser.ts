export type UserRole = "admin" | "staff" | "viewer";

export const mockUser = {
  name: "測試管理者 A",
  role: "admin" as UserRole,
  note: "目前角色：admin",
};

export const roleOptions: UserRole[] = ["admin", "staff", "viewer"];
