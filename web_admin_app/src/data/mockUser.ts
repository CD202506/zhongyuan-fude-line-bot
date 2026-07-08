export type UserRole = "admin" | "staff" | "viewer";

export const mockUser = {
  name: "值勤人員 A",
  role: "admin" as UserRole,
  note: "模擬身份：管理者",
};

export const roleOptions: UserRole[] = ["admin", "staff", "viewer"];
