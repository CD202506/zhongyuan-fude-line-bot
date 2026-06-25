import { Link, useParams } from "react-router-dom";
import { modules } from "../data/modules";
import { recordById } from "../data/mockRecords";
import { DetailActionPanel } from "../components/DetailActionPanel";
import { StatusBadge } from "../components/StatusBadge";

export function ModuleDetailPage() {
  const { id } = useParams();
  const record = id ? recordById(id) : undefined;
  const moduleItem = record ? modules.find((item) => item.key === record.moduleKey) : undefined;

  if (!record || !moduleItem) {
    return (
      <section className="content-panel">
        <h2>找不到測試資料</h2>
        <p>請返回主控台重新選擇資料。</p>
        <Link to="/dashboard" className="detail-link">返回主控台</Link>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="content-panel detail-header">
        <div>
          <Link to={moduleItem.route} className="back-link">返回列表</Link>
          <span className="eyebrow">{moduleItem.title}</span>
          <h2>{record.title}</h2>
          <StatusBadge status={record.status} />
        </div>
      </section>

      <section className="detail-layout">
        <article className="content-panel">
          <h3>資料摘要</h3>
          <div className="info-grid">
            <div><span>狀態</span><strong>{record.status}</strong></div>
            <div><span>日期</span><strong>{record.dateLabel}</strong></div>
            <div><span>經手 / 負責</span><strong>{record.owner}</strong></div>
            <div><span>模組邊界</span><strong>{moduleItem.boundary}</strong></div>
          </div>
          <div className="note-panel">
            <strong>關聯資訊</strong>
            <p>{record.relation}</p>
          </div>
          <div className="note-panel">
            <strong>備註</strong>
            <p>{record.note}</p>
          </div>
        </article>
        <DetailActionPanel />
      </section>
    </div>
  );
}
