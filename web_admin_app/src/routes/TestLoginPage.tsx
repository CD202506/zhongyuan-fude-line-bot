import { Navigate, useNavigate } from "react-router-dom";
import { roleOptions, type UserRole } from "../data/mockUser";
import { mockIdentities } from "../lib/identity";
import { permissionLabel } from "../lib/permissions";
import { useRole } from "../lib/roleContext";

export function TestLoginPage() {
  const navigate = useNavigate();
  const { identity, loginAs } = useRole();

  if (identity) return <Navigate to="/dashboard" replace />;

  const handleLogin = (role: UserRole) => {
    loginAs(role);
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <span className="eyebrow">中原福德宮 Web 後台</span>
        <h1>測試環境虛擬登入</h1>
        <p>此頁僅供前端測試，未連接 LINE 或 Google 登入；目前選擇只保留在本次瀏覽器測試中。</p>
      </section>
      <section className="login-card-grid" aria-label="測試身分">
        {roleOptions.map((role) => {
          const item = mockIdentities[role];

          return (
            <article key={item.identityId} className="login-card">
              <span>{permissionLabel(item.displayRole)}</span>
              <h2>{item.displayName}</h2>
              <p>{item.description}</p>
              <dl>
                <div><dt>善信資料</dt><dd>{item.isLineLinked ? "已建立測試資料" : "待建立"}</dd></div>
                <div><dt>團隊身分</dt><dd>{item.teamMemberId ? "已連結團隊成員" : "無"}</dd></div>
                <div><dt>可操作範圍</dt><dd>{item.allowedScope}</dd></div>
              </dl>
              <button type="button" onClick={() => handleLogin(role)}>
                以此身分登入
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
