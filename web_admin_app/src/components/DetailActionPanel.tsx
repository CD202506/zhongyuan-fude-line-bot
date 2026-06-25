type DetailActionPanelProps = {
  isAdminOnly?: boolean;
};

export function DetailActionPanel({ isAdminOnly = false }: DetailActionPanelProps) {
  return (
    <aside className="detail-actions">
      <h3>詳情內操作區</h3>
      <button type="button">編輯</button>
      <button type="button">儲存草稿</button>
      <button type="button" className="danger">
        停用 / 作廢
      </button>
      {isAdminOnly ? <p>此區由管理者集中維護。</p> : <p>重要操作需先確認再處理。</p>}
    </aside>
  );
}
