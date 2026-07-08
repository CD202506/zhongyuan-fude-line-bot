import type { UserRole } from "../data/mockUser";
import { permissionLabel } from "../lib/permissions";

type PermissionBadgeProps = {
  role: UserRole;
};

export function PermissionBadge({ role }: PermissionBadgeProps) {
  return (
    <span className="permission-badge">
      模擬身份：{permissionLabel(role)}
    </span>
  );
}
