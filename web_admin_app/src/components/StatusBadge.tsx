type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = status.includes("待") || status.includes("草稿") ? "warning" : "ok";

  return <span className={`status-badge ${tone}`}>{status}</span>;
}
