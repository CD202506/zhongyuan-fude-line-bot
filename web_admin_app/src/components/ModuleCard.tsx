import { Link } from "react-router-dom";
import type { ModuleConfig } from "../data/modules";

type ModuleCardProps = {
  moduleItem: ModuleConfig;
  count: number;
};

export function ModuleCard({ moduleItem, count }: ModuleCardProps) {
  return (
    <Link className="module-card" to={moduleItem.route}>
      <span>{moduleItem.shortTitle}</span>
      <strong>{moduleItem.title}</strong>
      <p>{moduleItem.description}</p>
      <em>{count} 筆紀錄</em>
    </Link>
  );
}
