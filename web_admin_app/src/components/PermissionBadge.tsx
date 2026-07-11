import type { UserRole } from "../data/mockUser";
import { permissionLabel } from "../lib/permissions";

type PermissionBadgeProps = {
  role: UserRole;
};

export function PermissionBadge({ role }: PermissionBadgeProps) {
  return (
    <span className="permission-badge">
      目前角色：{permissionLabel(role)}
    </span>
  );
}
