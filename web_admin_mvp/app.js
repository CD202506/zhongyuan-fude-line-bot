(function () {
  const data = window.webAdminMockData;
  const root = document.getElementById("appRoot");
  const pageTitle = document.getElementById("pageTitle");
  const nav = document.getElementById("primaryNav");

  const state = {
    view: "dashboard",
    selectedTempleId: data.temples[0].id,
    templeSearch: "",
    templeFilter: "全部",
    visitFilter: "全部",
    announcementFilter: "全部",
    financeFilter: "全部"
  };

  const visitTypes = ["參訪", "用餐", "進香", "邀請", "請帖", "祝壽", "遶境", "會香", "聯誼", "其他"];

  const navGroups = [
    { title: "主控台", items: [{ id: "dashboard", label: "主控台" }] },
    { title: "友宮管理", items: [{ id: "templeModule", label: "友宮管理" }] },
    { title: "來訪 / 請帖", items: [{ id: "visitModule", label: "來訪 / 請帖" }] },
    { title: "公告 / 活動", items: [{ id: "announcementModule", label: "公告 / 活動" }] },
    { title: "成員 / 職務", items: [{ id: "memberModule", label: "成員 / 職務" }] },
    { title: "財務管理", items: [{ id: "financeModule", label: "財務管理" }] },
    { title: "管理者設定", admin: true, items: [{ id: "adminModule", label: "管理者設定", adminOnly: true }] }
  ];

  const moduleByView = {
    templeModule: "templeModule",
    temples: "templeModule",
    templeDetail: "templeModule",
    templeForm: "templeModule",
    contacts: "templeModule",
    contactForm: "templeModule",
    visitModule: "visitModule",
    visits: "visitModule",
    visitDetail: "visitModule",
    visitForm: "visitModule",
    visitTypeSettings: "adminModule",
    announcementModule: "announcementModule",
    announcements: "announcementModule",
    announcementDetail: "announcementModule",
    announcementForm: "announcementModule",
    events: "announcementModule",
    eventDetail: "announcementModule",
    eventForm: "announcementModule",
    channelSettings: "adminModule",
    memberModule: "memberModule",
    members: "memberModule",
    memberDetail: "memberModule",
    memberForm: "memberModule",
    roleAssignments: "memberModule",
    roleTypes: "adminModule",
    permissions: "adminModule",
    financeModule: "financeModule",
    financeRecords: "financeModule",
    financeDetail: "financeModule",
    financeForm: "financeModule",
    financeCategories: "adminModule",
    lineLogs: "adminModule",
    notFoundLogs: "adminModule",
    missingData: "adminModule",
    systemStatus: "adminModule",
    adminModule: "adminModule",
    adminBasics: "adminModule",
    adminPermissions: "adminModule",
    adminLineOps: "adminModule",
    adminDataSources: "adminModule"
  };

  function templeName(id) {
    return data.temples.find((temple) => temple.id === id)?.name || "未指定友宮";
  }

  function selectedTemple() {
    return data.temples.find((temple) => temple.id === state.selectedTempleId) || data.temples[0];
  }

  function selectedVisit() {
    return data.visits.find((visit) => visit.id === state.selectedVisitId) || data.visits[0];
  }

  function selectedAnnouncement() {
    return data.announcements.find((announcement) => announcement.id === state.selectedAnnouncementId) || data.announcements[0];
  }

  function selectedEvent() {
    return data.events.find((eventItem) => eventItem.id === state.selectedEventId) || data.events[0];
  }

  function selectedMember() {
    return data.members.find((member) => member.id === state.selectedMemberId) || data.members[0];
  }

  function selectedFinanceRecord() {
    return data.financeRecords.find((record) => record.id === state.selectedFinanceId) || data.financeRecords[0];
  }

  function templeContacts(id) {
    return data.contacts.filter((contact) => contact.templeId === id);
  }

  function templeVisits(id) {
    return data.visits.filter((visit) => visit.templeId === id);
  }

  function relatedAnnouncements(visitIds) {
    return data.announcements.filter((announcement) => visitIds.includes(announcement.relatedVisitId));
  }

  function roleName(roleTypeId) {
    return data.roleTypes.find((role) => role.id === roleTypeId)?.name || "未設定職務";
  }

  function memberName(memberId) {
    return data.members.find((member) => member.id === memberId)?.name || "未設定成員";
  }

  function isAdmin() {
    return data.currentUserPermission === "admin";
  }

  function setView(view, options = {}) {
    state.view = view;
    if (options.templeId) state.selectedTempleId = options.templeId;
    if (options.visitId) state.selectedVisitId = options.visitId;
    if (options.announcementId) state.selectedAnnouncementId = options.announcementId;
    if (options.eventId) state.selectedEventId = options.eventId;
    if (options.memberId) state.selectedMemberId = options.memberId;
    if (options.financeId) state.selectedFinanceId = options.financeId;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function statusTag(enabled) {
    return `<span class="tag ${enabled ? "" : "disabled"}">${enabled ? "啟用" : "停用"}</span>`;
  }

  function channelTags(channels) {
    return channels.map((channel) => `<span class="channel">${channel}</span>`).join(" ");
  }

  function allNavItems() {
    return navGroups.flatMap((group) => group.items);
  }

  function renderNav() {
    nav.innerHTML = navGroups.map((group) => `
      <div class="nav-group ${group.admin ? "admin-nav-group" : ""}">
        <p class="nav-group-title">${group.title}${group.admin ? `<span class="admin-group-note">需管理者權限</span>` : ""}</p>
        <div class="nav-group-items">
          ${group.items.map((item) => `
            <button class="nav-button ${item.adminOnly ? "admin-only" : ""} ${item.adminOnly && !isAdmin() ? "locked" : ""} ${(state.view === item.id || moduleByView[state.view] === item.id) ? "active" : ""}" type="button" data-view="${item.id}" ${item.adminOnly && !isAdmin() ? "data-locked-admin=\"true\" aria-disabled=\"true\"" : ""}>
              <span>${item.label}</span>
              ${item.adminOnly ? `<span class="lock-label">${isAdmin() ? "管理者" : "需權限"}</span>` : ""}
            </button>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function layoutSection(title, description, actions, content) {
    return `
      <section class="section">
        <div class="section-header">
          <div>
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <div class="actions">${actions || ""}</div>
        </div>
        ${content}
      </section>
    `;
  }

  function renderDashboard() {
    const pendingTemples = data.temples.filter((temple) => temple.relationStatus.includes("待") || temple.internalNote.includes("需")).length;
    const recentVisits = data.visits.filter((visit) => visit.date >= "2026-05-01").length;
    const openAnnouncements = data.announcements.filter((announcement) => announcement.status !== "已封存").length;
    const needsReply = data.visits.filter((visit) => visit.needsReply).length;
    const notFoundCount = data.lineQueryLogs.filter((log) => log.result === "查無資料").length;

    return `
      <div class="metric-grid">
        <div class="metric-card"><span>友宮數</span><strong>${data.temples.length}</strong></div>
        <div class="metric-card"><span>近期來訪</span><strong>${recentVisits}</strong></div>
        <div class="metric-card"><span>公告數</span><strong>${openAnnouncements}</strong></div>
        <div class="metric-card"><span>活動數</span><strong>${data.events.length}</strong></div>
      </div>
      ${layoutSection(
        "常用入口",
        "",
        "",
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="templeForm"><strong>新增友宮</strong><span></span></button>
          <button class="quick-card" type="button" data-view="visitForm"><strong>新增來訪紀錄</strong><span>記錄參訪、請帖、邀請或會香。</span></button>
          <button class="quick-card" type="button" data-view="announcementForm"><strong>新增公告</strong><span>整理公告草稿，不正式發送。</span></button>
          <button class="quick-card" type="button" data-view="temples"><strong>查看友宮資料</strong><span>查看友宮資料。</span></button>
        </div>`
      )}
      ${layoutSection(
        "近期活動",
        "",
        "",
        `<div class="activity-list">
          ${data.recentActivities.map((activity) => `
            <button class="activity-row" type="button" data-view="${activity.targetView}">
              <span>${activity.dateLabel}</span>
              <strong>${activity.title}</strong>
              <em>${activity.type}</em>
            </button>
          `).join("")}
        </div>`
      )}
      ${layoutSection(
        "管理者資訊",
        "",
        `${isAdmin() ? `<button class="button secondary" type="button" data-view="adminLineOps">查看維運</button>` : `<span class="tag disabled">需管理者權限</span>`}`,
        `<div class="compact-alerts ${isAdmin() ? "" : "locked-panel"}">
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="adminLineOps" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>待補資料</strong><span>${isAdmin() ? pendingTemples + needsReply : "鎖定"}</span></button>
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="adminLineOps" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>查無資料</strong><span>${isAdmin() ? notFoundCount : "鎖定"}</span></button>
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="memberModule" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>成員測試資料</strong><span>${isAdmin() ? data.members.length : "鎖定"}</span></button>
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="financeModule" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>財務草稿</strong><span>${isAdmin() ? data.financeRecords.length : "鎖定"}</span></button>
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="adminDataSources" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>mock/dev data</strong><span>${isAdmin() ? "開發預覽" : "鎖定"}</span></button>
        </div>`
      )}
    `;
  }

  function renderTemples() {
    const filtered = data.temples.filter((temple) => {
      const matchesText = [temple.name, temple.alias, temple.mainGod, temple.address].join(" ").includes(state.templeSearch);
      const matchesFilter = state.templeFilter === "全部" || temple.relationStatus === state.templeFilter || (state.templeFilter === "啟用" && temple.enabled) || (state.templeFilter === "停用" && !temple.enabled);
      return matchesText && matchesFilter;
    });

    return layoutSection(
      "友宮資料列表",
      "畫面用語使用友宮；內部 prototype 資料模型使用 temple。",
      `<button class="button" type="button" data-view="templeForm">新增友宮</button>`,
      `
      <div class="filters">
        <div class="field">
          <label for="templeSearch">搜尋友宮</label>
          <input id="templeSearch" type="search" value="${state.templeSearch}" placeholder="輸入宮廟名稱、主神或地址">
        </div>
        <div class="field">
          <label for="templeFilter">關係狀態</label>
          <select id="templeFilter">
            ${["全部", "長期往來", "近期互動", "請帖往來", "待補資料", "資料待確認", "啟用", "停用"].map((option) => `<option ${state.templeFilter === option ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>資料來源</label>
          <input value="mock/dev data" readonly>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>宮廟名稱</th>
              <th>主神</th>
              <th>地址</th>
              <th>關係狀態</th>
              <th>最近來訪</th>
              <th>是否啟用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((temple) => `
              <tr>
                <td><strong>${temple.name}</strong><br><span class="muted">${temple.alias}</span></td>
                <td>${temple.mainGod}</td>
                <td>${temple.address}</td>
                <td><span class="pill">${temple.relationStatus}</span></td>
                <td>${temple.latestVisitDate || "尚無紀錄"}</td>
                <td>${statusTag(temple.enabled)}</td>
                <td>
                  <div class="inline-actions">
                    <button class="small-button primary" type="button" data-detail="${temple.id}">查看詳情</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderTempleModule() {
    return `
      ${layoutSection(
        "友宮管理",
        "",
        `<button class="button" type="button" data-view="templeForm">新增友宮</button>`,
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="temples"><strong>友宮資料</strong><span></span></button>
          <button class="quick-card" type="button" data-view="contacts"><strong>管理聯絡人</strong><span></span></button>
          <button class="quick-card" type="button" data-view="visits"><strong>查看來訪紀錄</strong><span></span></button>
          <button class="quick-card" type="button" data-view="visitForm"><strong>新增來訪紀錄</strong><span></span></button>
        </div>`
      )}
      ${renderTemples()}
    `;
  }

  function renderTempleDetail() {
    const temple = selectedTemple();
    const contacts = templeContacts(temple.id);
    const visits = templeVisits(temple.id);
    const announcements = relatedAnnouncements(visits.map((visit) => visit.id));

    return `
      ${layoutSection(
        "友宮資料詳情",
        "集中檢視友宮基本資料、聯絡人、來訪 / 請帖與相關公告。",
        `<button class="button secondary" type="button" data-view="temples">返回列表</button>
         <button class="button" type="button" data-view="templeForm" data-temple="${temple.id}">編輯友宮</button>
         <button class="button secondary" type="button" data-view="contacts">管理聯絡人</button>
         <button class="button" type="button" data-view="visitForm" data-temple="${temple.id}">新增來訪紀錄</button>
         <button class="button" type="button" data-view="announcementForm">新增相關公告</button>
         <button class="button quiet" type="button" data-draft>停用友宮</button>`,
        `<div class="detail-grid">
          <div class="stack">
            <div class="info-grid">
              <div class="info-item"><span>宮廟名稱</span><strong>${temple.name}</strong></div>
              <div class="info-item"><span>別名</span><strong>${temple.alias}</strong></div>
              <div class="info-item"><span>主神</span><strong>${temple.mainGod}</strong></div>
              <div class="info-item"><span>電話</span><strong>${temple.phone}</strong></div>
              <div class="info-item"><span>地址</span><strong>${temple.address}</strong></div>
              <div class="info-item"><span>關係狀態</span><strong>${temple.relationStatus}</strong></div>
            </div>
            <div class="mini-card"><strong>公開摘要</strong><p>${temple.publicSummary}</p></div>
            <div class="mini-card"><strong>內部備註</strong><p>${temple.internalNote}</p></div>
          </div>
          <div class="stack">
            <div class="mini-card"><strong>是否啟用</strong>${statusTag(temple.enabled)}</div>
            <div class="mini-card"><strong>來訪次數</strong><p>${visits.length} 筆，由來訪紀錄自動計算，不手動填。</p></div>
          </div>
        </div>`
      )}
      ${layoutSection(
        "聯絡人",
        "職稱未來對應 role_types 下拉選單。",
        `<button class="button secondary" type="button" data-view="contacts">管理聯絡人</button>`,
        `<div class="stack">${contacts.map((contact) => `
          <div class="mini-card">
            <strong>${contact.name}｜${contact.role}</strong>
            <span class="muted">${contact.phone}｜${contact.enabled ? "啟用" : "停用"}</span>
            <p>${contact.note}</p>
          </div>
        `).join("") || `<p class="muted">尚無聯絡人。</p>`}</div>`
      )}
      ${layoutSection(
        "來訪 / 請帖紀錄",
        "這裡是互動紀錄，不是公告本身。",
        `<button class="button secondary" type="button" data-view="visits">查看來訪紀錄</button>`,
        `<div class="stack">${visits.map((visit) => `
          <div class="mini-card">
            <strong>${visit.date}｜${visit.title}</strong>
            <span class="muted">${visit.types.join("、")}｜${visit.peopleCount} 人｜${visit.needsReply ? "需要回覆" : "不需回覆"}</span>
            <p>${visit.note}</p>
          </div>
        `).join("") || `<p class="muted">尚無紀錄。</p>`}</div>`
      )}
      ${layoutSection(
        "相關公告",
        "公告可關聯來訪紀錄，但第一版不做正式發送。",
        `<button class="button secondary" type="button" data-view="announcements">查看公告</button>`,
        `<div class="stack">${announcements.map((announcement) => `
          <div class="mini-card">
            <strong>${announcement.title}</strong>
            <span class="muted">${announcement.status}｜${announcement.date}｜${channelTags(announcement.channels)}</span>
          </div>
        `).join("") || `<p class="muted">尚無相關公告。</p>`}</div>`
      )}
    `;
  }

  function renderTempleForm() {
    const temple = selectedTemple();
    return renderFormPanel(
      "新增 / 編輯友宮",
      "表單只示範流程，儲存後不會寫入正式資料。",
      `
      <div class="form-grid">
        ${field("宮廟名稱", "text", temple.name)}
        ${field("別名", "text", temple.alias)}
        ${field("主神", "text", temple.mainGod)}
        ${field("電話", "text", temple.phone)}
        ${field("地址", "text", temple.address, "wide")}
        ${selectField("關係狀態", ["長期往來", "近期互動", "請帖往來", "待補資料", "資料待確認"], temple.relationStatus)}
        ${selectField("是否啟用", ["啟用", "停用"], temple.enabled ? "啟用" : "停用")}
        ${textareaField("公開摘要", temple.publicSummary, "wide")}
        ${textareaField("內部備註", temple.internalNote, "wide")}
      </div>`
    );
  }

  function renderContacts() {
    return layoutSection(
      "友宮聯絡人管理",
      "聯絡人職稱示範對應未來 role_types，電話皆為遮罩或假資料。",
      `<button class="button" type="button" data-view="contactForm">聯絡人新增 / 編輯</button>`,
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>所屬友宮</th>
              <th>姓名</th>
              <th>職稱</th>
              <th>電話</th>
              <th>備註</th>
              <th>是否啟用</th>
            </tr>
          </thead>
          <tbody>
            ${data.contacts.map((contact) => `
              <tr>
                <td>${templeName(contact.templeId)}</td>
                <td><strong>${contact.name}</strong></td>
                <td><span class="pill">${contact.role}</span></td>
                <td>${contact.phone}</td>
                <td>${contact.note}</td>
                <td>${statusTag(contact.enabled)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <h3>職稱選單雛形</h3>
        <p class="form-help">未來可由 role_types 維護，避免每個人自由輸入不同名稱。</p>
        <div class="checkbox-row">${data.roleTypes.map((role) => `<span class="pill">${role.name}｜${role.category}</span>`).join("")}</div>
      </div>`
    );
  }

  function renderContactForm() {
    const contact = data.contacts[0];
    return renderFormPanel(
      "友宮聯絡人新增 / 編輯",
      "職稱建議從職稱主檔選擇，避免自由輸入造成名稱混亂。",
      `<div class="form-grid">
        ${selectField("所屬友宮", data.temples.map((temple) => temple.name), templeName(contact.templeId))}
        ${field("姓名", "text", contact.name)}
        ${selectField("職稱", data.roleTypes.filter((role) => role.category === "友宮聯絡人").map((role) => role.name), contact.role)}
        ${field("電話", "text", contact.phone)}
        ${selectField("是否啟用", ["啟用", "停用"], contact.enabled ? "啟用" : "停用")}
        ${textareaField("備註", contact.note, "wide")}
      </div>`
    );
  }

  function renderVisits() {
    const filtered = data.visits.filter((visit) => state.visitFilter === "全部" || visit.types.includes(state.visitFilter));
    return layoutSection(
      "來訪 / 請帖紀錄列表",
      "記錄某間友宮在某一天的一次互動；來訪次數未來由紀錄自動計算。",
      `<button class="button" type="button" data-view="visitForm">新增來訪紀錄</button>`,
      `<div class="filters">
        <div class="field">
          <label for="visitFilter">依型態篩選</label>
          <select id="visitFilter">
            ${["全部", ...visitTypes].map((type) => `<option ${state.visitFilter === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>資料說明</label>
          <input value="來訪 / 請帖 / 邀請紀錄，不是公告" readonly>
        </div>
        <div class="field">
          <label>寫入狀態</label>
          <input value="不寫入正式資料" readonly>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>友宮名稱</th>
              <th>日期</th>
              <th>型態</th>
              <th>來訪人數</th>
              <th>是否需要回覆</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((visit) => `
              <tr>
                <td><strong>${templeName(visit.templeId)}</strong><br><span class="muted">${visit.title}</span></td>
                <td>${visit.date}</td>
                <td>${visit.types.map((type) => `<span class="pill">${type}</span>`).join(" ")}</td>
                <td>${visit.peopleCount} 人</td>
                <td>${visit.needsReply ? "需要回覆" : "不需回覆"}</td>
                <td>${visit.note}</td>
                <td><button class="small-button primary" type="button" data-visit-detail="${visit.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderVisitForm() {
    const visit = data.visits.find((item) => item.templeId === state.selectedTempleId) || data.visits[0];
    return renderFormPanel(
      "新增 / 編輯來訪紀錄",
      "這是來訪 / 請帖 / 邀請紀錄，不是公告本身；來訪次數不用手動填。",
      `
      <div class="form-grid">
        ${selectField("友宮", data.temples.map((temple) => temple.name), templeName(state.selectedTempleId))}
        ${field("日期", "date", visit.date)}
        ${field("來訪人數", "number", visit.peopleCount)}
        ${selectField("是否需要回覆", ["需要回覆", "不需回覆"], visit.needsReply ? "需要回覆" : "不需回覆")}
        <div class="field wide">
          <label>型態，可多選</label>
          <div class="type-grid">
            ${visitTypes.map((type) => `
              <label class="check-pill"><input type="checkbox" ${visit.types.includes(type) ? "checked" : ""}>${type}</label>
            `).join("")}
          </div>
        </div>
        ${textareaField("備註", visit.note, "wide")}
      </div>`
    );
  }

  function renderVisitDetail() {
    const visit = selectedVisit();
    return `
      ${layoutSection(
        "來訪 / 請帖詳情",
        "",
        `<button class="button secondary" type="button" data-view="visits">返回列表</button>
         <button class="button" type="button" data-view="visitForm" data-temple="${visit.templeId}">編輯來訪紀錄</button>
         <button class="button secondary" type="button" data-detail="${visit.templeId}">關聯友宮</button>
         <button class="button" type="button" data-view="announcementForm">新增相關公告</button>
         <button class="button secondary" type="button" data-draft>標記已回覆</button>
         <button class="button quiet" type="button" data-draft>作廢紀錄</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>友宮</span><strong>${templeName(visit.templeId)}</strong></div>
          <div class="info-item"><span>日期</span><strong>${visit.date}</strong></div>
          <div class="info-item"><span>型態</span><strong>${visit.types.join("、")}</strong></div>
          <div class="info-item"><span>來訪人數</span><strong>${visit.peopleCount} 人</strong></div>
          <div class="info-item"><span>是否需要回覆</span><strong>${visit.needsReply ? "需要回覆" : "不需回覆"}</strong></div>
          <div class="info-item"><span>主題</span><strong>${visit.title}</strong></div>
        </div>
        <div class="mini-card"><strong>備註</strong><p>${visit.note}</p></div>`
      )}
    `;
  }

  function renderVisitModule() {
    return `
      ${layoutSection(
        "來訪 / 請帖",
        "",
        `<button class="button" type="button" data-view="visitForm">新增來訪紀錄</button>`,
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="temples"><strong>選擇友宮</strong><span>先確認友宮主資料與聯絡人。</span></button>
          <button class="quick-card" type="button" data-view="visits"><strong>來訪紀錄</strong><span>查看來訪與請帖紀錄。</span></button>
          <button class="quick-card" type="button" data-view="adminBasics"><strong>查看型態設定</strong><span>需管理者權限的設定項目。</span></button>
          <button class="quick-card" type="button" data-view="adminLineOps"><strong>查看待補資料</strong><span>查無資料後的維運清單。</span></button>
        </div>`
      )}
      ${renderVisits()}
      ${layoutSection(
        "來訪型態顯示",
        "",
        "",
        `<div class="checkbox-row">${visitTypes.map((type) => `<span class="pill">${type}</span>`).join("")}</div>`
      )}
    `;
  }

  function renderVisitTypeSettings() {
    return layoutSection(
      "來訪型態設定",
      "目前先固定為 V2 討論中的型態清單；未來可改為可維護選單。",
      "",
      `<div class="checkbox-row">
        ${visitTypes.map((type) => `<span class="pill">${type}</span>`).join("")}
      </div>
      <div class="mini-card">
        <strong>多選原則</strong>
        <p>同一筆互動可同時是請帖、邀請、祝壽或用餐等多種型態。來訪次數不手動填，由同一友宮的紀錄數自動計算。</p>
      </div>`
    );
  }

  function renderAnnouncements() {
    const filtered = data.announcements.filter((announcement) => state.announcementFilter === "全部" || announcement.status === state.announcementFilter);
    return layoutSection(
      "公告列表",
      "公告可整理 LINE / FB / VOOM 文字，但第一版不做正式發送。",
      `<button class="button" type="button" data-view="announcementForm">新增公告</button>`,
      `<div class="filters">
        <div class="field">
          <label for="announcementFilter">依狀態篩選</label>
          <select id="announcementFilter">
            ${["全部", "草稿", "待確認", "可發布"].map((status) => `<option ${state.announcementFilter === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>發送狀態</label>
          <input value="不做正式發送" readonly>
        </div>
        <div class="field">
          <label>資料來源</label>
          <input value="mock/dev data" readonly>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>公告標題</th>
              <th>狀態</th>
              <th>日期</th>
              <th>可用管道</th>
              <th>相關來訪 / 活動關聯</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((announcement) => `
              <tr>
                <td><strong>${announcement.title}</strong></td>
                <td><span class="pill">${announcement.status}</span></td>
                <td>${announcement.date}</td>
                <td>${channelTags(announcement.channels)}</td>
                <td>${announcement.relatedVisitId ? data.visits.find((visit) => visit.id === announcement.relatedVisitId)?.title : "未關聯"}</td>
                <td><button class="small-button primary" type="button" data-announcement-detail="${announcement.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderAnnouncementForm() {
    const announcement = data.announcements[0];
    return renderFormPanel(
      "新增 / 編輯公告",
      "此表單只整理公告內容，不會正式發送 LINE、FB 或 VOOM。",
      `
      <div class="form-grid">
        ${field("公告標題", "text", announcement.title, "wide")}
        ${textareaField("公告內容", announcement.body, "wide")}
        ${textareaField("LINE 文字", announcement.lineText, "wide")}
        ${selectField("是否公開", ["公開", "不公開"], announcement.public ? "公開" : "不公開")}
        ${selectField("狀態", ["草稿", "待確認", "可發布"], announcement.status)}
        <div class="field wide">
          <label>是否可用於 LINE / FB / VOOM</label>
          <div class="checkbox-row">
            ${["LINE", "FB", "VOOM"].map((channel) => `<label class="check-pill"><input type="checkbox" ${announcement.channels.includes(channel) ? "checked" : ""}>${channel}</label>`).join("")}
          </div>
        </div>
        ${selectField("相關來訪 / 活動關聯", ["未關聯", ...data.visits.map((visit) => visit.title)], data.visits.find((visit) => visit.id === announcement.relatedVisitId)?.title || "未關聯", "wide")}
      </div>`
    );
  }

  function renderAnnouncementDetail() {
    const announcement = selectedAnnouncement();
    const linkedVisit = data.visits.find((visit) => visit.id === announcement.relatedVisitId);
    return `
      ${layoutSection(
        "公告詳情",
        "",
        `<button class="button secondary" type="button" data-view="announcements">返回列表</button>
         <button class="button" type="button" data-view="announcementForm">編輯公告</button>
         <button class="button secondary" type="button" data-view="adminBasics">設定 LINE / FB / VOOM 欄位</button>
         <button class="button secondary" type="button" data-view="visits">關聯來訪 / 活動</button>
         <button class="button quiet" type="button" data-draft>草稿 / 停用狀態</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>公告標題</span><strong>${announcement.title}</strong></div>
          <div class="info-item"><span>狀態</span><strong>${announcement.status}</strong></div>
          <div class="info-item"><span>日期</span><strong>${announcement.date}</strong></div>
          <div class="info-item"><span>可用管道</span><strong>${announcement.channels.join("、")}</strong></div>
          <div class="info-item"><span>是否公開</span><strong>${announcement.public ? "公開" : "不公開"}</strong></div>
          <div class="info-item"><span>關聯來訪</span><strong>${linkedVisit ? linkedVisit.title : "未關聯"}</strong></div>
        </div>
        <div class="mini-card"><strong>公告內容</strong><p>${announcement.body}</p></div>
        <div class="mini-card"><strong>LINE 文字</strong><p>${announcement.lineText}</p></div>`
      )}
    `;
  }

  function renderAnnouncementModule() {
    return `
      ${layoutSection(
        "公告 / 活動",
        "",
        "",
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="announcementForm"><strong>新增公告</strong><span>整理公告、LINE 文字與公開狀態。</span></button>
          <button class="quick-card" type="button" data-view="eventForm"><strong>新增活動</strong><span>建立活動草稿並關聯公告。</span></button>
          <button class="quick-card" type="button" data-view="visits"><strong>關聯來訪紀錄</strong><span>把公告和來訪 / 請帖連起來。</span></button>
          <button class="quick-card" type="button" data-view="adminBasics"><strong>發布管道設定</strong><span>需管理者權限，不放一般操作。</span></button>
        </div>`
      )}
      ${renderAnnouncements()}
      ${renderEvents()}
    `;
  }

  function renderEvents() {
    return layoutSection(
      "活動列表",
      "活動資料使用 mock/dev data，可與公告或來訪紀錄建立關聯雛形。",
      `<button class="button" type="button" data-view="eventForm">新增活動</button>`,
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>活動名稱</th>
              <th>活動日期</th>
              <th>活動類型</th>
              <th>地點</th>
              <th>是否公開</th>
              <th>是否關聯公告</th>
              <th>狀態</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.events.map((eventItem) => `
              <tr>
                <td><strong>${eventItem.name}</strong></td>
                <td>${eventItem.date}</td>
                <td>${eventItem.type}</td>
                <td>${eventItem.location}</td>
                <td>${eventItem.public ? "公開" : "不公開"}</td>
                <td>${eventItem.linkedAnnouncementId ? "已關聯公告" : "未關聯"}</td>
                <td><span class="pill">${eventItem.status}</span></td>
                <td>${eventItem.note}</td>
                <td><button class="small-button primary" type="button" data-event-detail="${eventItem.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderEventForm() {
    const eventItem = data.events[0];
    return renderFormPanel(
      "新增 / 編輯活動",
      "活動先作為 mock/dev data，不代表正式活動排程。",
      `<div class="form-grid">
        ${field("活動名稱", "text", eventItem.name, "wide")}
        ${field("活動日期", "date", eventItem.date)}
        ${selectField("活動類型", ["節慶", "會香", "會議", "遶境", "祝壽", "其他"], eventItem.type)}
        ${field("地點", "text", eventItem.location)}
        ${selectField("是否公開", ["公開", "不公開"], eventItem.public ? "公開" : "不公開")}
        ${selectField("是否關聯公告", ["未關聯", ...data.announcements.map((announcement) => announcement.title)], data.announcements.find((announcement) => announcement.id === eventItem.linkedAnnouncementId)?.title || "未關聯", "wide")}
        ${selectField("狀態", ["草稿", "內部確認", "可公開", "封存"], eventItem.status)}
        ${textareaField("備註", eventItem.note, "wide")}
      </div>`
    );
  }

  function renderEventDetail() {
    const eventItem = selectedEvent();
    const announcement = data.announcements.find((item) => item.id === eventItem.linkedAnnouncementId);
    return `
      ${layoutSection(
        "活動詳情",
        "",
        `<button class="button secondary" type="button" data-view="events">返回列表</button>
         <button class="button" type="button" data-view="eventForm">編輯活動</button>
         <button class="button secondary" type="button" data-view="adminBasics">設定 LINE / FB / VOOM 欄位</button>
         <button class="button secondary" type="button" data-view="announcementForm">關聯來訪 / 活動</button>
         <button class="button quiet" type="button" data-draft>草稿 / 停用狀態</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>活動名稱</span><strong>${eventItem.name}</strong></div>
          <div class="info-item"><span>活動日期</span><strong>${eventItem.date}</strong></div>
          <div class="info-item"><span>活動類型</span><strong>${eventItem.type}</strong></div>
          <div class="info-item"><span>地點</span><strong>${eventItem.location}</strong></div>
          <div class="info-item"><span>是否公開</span><strong>${eventItem.public ? "公開" : "不公開"}</strong></div>
          <div class="info-item"><span>狀態</span><strong>${eventItem.status}</strong></div>
          <div class="info-item"><span>關聯公告</span><strong>${announcement ? announcement.title : "未關聯"}</strong></div>
        </div>
        <div class="mini-card"><strong>備註</strong><p>${eventItem.note}</p></div>`
      )}
    `;
  }

  function renderChannelSettings() {
    return layoutSection(
      "發布管道設定",
      "只顯示 LINE / FB / VOOM 欄位，不做正式發送或 API 串接。",
      "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>管道</th>
              <th>用途</th>
              <th>是否可選</th>
              <th>正式發送</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${data.publishChannels.map((channel) => `
              <tr>
                <td><strong>${channel.name}</strong></td>
                <td>${channel.purpose}</td>
                <td>${statusTag(channel.enabled)}</td>
                <td>${channel.officialSendEnabled ? "已啟用" : "未啟用"}</td>
                <td>${channel.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderMembers() {
    return `
      ${layoutSection(
        "成員 / 職務 / 權限檢視",
        `廟務職務是人在廟裡的職稱；系統權限是能使用後台哪些功能。${data.mockNotice}。`,
        "",
        `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>成員</th>
                <th>電話</th>
                <th>廟務職務</th>
                <th>系統權限</th>
                <th>任期</th>
                <th>資料來源</th>
                <th>是否啟用</th>
                <th>備註</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${data.members.map((member) => `
                <tr>
                  <td><strong>${member.name}</strong></td>
                  <td>${member.phone}</td>
                  <td>${member.templeRole}</td>
                  <td><span class="pill">${member.systemPermission}</span></td>
                  <td>${member.term}</td>
                  <td>${member.source || data.mockNotice}</td>
                  <td>${statusTag(member.enabled)}</td>
                  <td>${member.note}</td>
                  <td><button class="small-button primary" type="button" data-member-detail="${member.id}">查看詳情</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      )}
      ${layoutSection(
        "admin 權限說明",
        "使用者本人目前可作為範例：廟務職稱是總幹事，系統權限是 admin。",
        "",
        `<div class="stack">
          <div class="mini-card">
            <strong>admin 不綁定單一個人</strong>
            <p>未來可依廟方交接需要轉移、增加、減少或停用。總幹事是廟務職務，admin 是系統權限，兩者需分開管理。</p>
          </div>
          <div class="mini-card">
            <strong>值年職務需保留任期</strong>
            <p>值年爐主、值年副爐主一年一選，未來 member_role_assignments 需保存歷史任期。</p>
          </div>
        </div>`
      )}
      ${layoutSection(
        "一人多職與任期雛形",
        "member_role_assignments 需支援一人多職、任期起訖，值年爐主 / 值年副爐主一年一選。",
        "",
        `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>成員</th>
                <th>職務 / 權限</th>
                <th>起日</th>
                <th>迄日</th>
                <th>是否啟用</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              ${data.memberRoleAssignments.map((assignment) => `
                <tr>
                  <td>${memberName(assignment.memberId)}</td>
                  <td><span class="pill">${roleName(assignment.roleTypeId)}</span></td>
                  <td>${assignment.startDate}</td>
                  <td>${assignment.endDate || "未設定"}</td>
                  <td>${statusTag(assignment.active)}</td>
                  <td>${assignment.note}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      )}
      ${layoutSection(
        "V2 資料模型落點",
        "這些資料只在 mock/dev data 中示範，不代表正式 Google Sheets 已改表。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>members</strong><p>成員主檔清楚分開廟務職務與系統權限。</p></div>
          <div class="mini-card"><strong>role_types</strong><p>廟務職務、友宮聯絡人職稱、系統權限都可由選單維護。</p></div>
          <div class="mini-card"><strong>member_role_assignments</strong><p>支援一人多職、任期起訖與年度職務。</p></div>
          <div class="mini-card"><strong>temples / temple_contacts / temple_visits</strong><p>友宮主資料、聯絡人、來訪紀錄拆開管理；畫面仍以「友宮」稱呼。</p></div>
          <div class="mini-card"><strong>announcement_links</strong><p>公告未來可關聯 temple_visits 或 events；目前只示範關聯，不正式發送。</p></div>
        </div>`
      )}
    `;
  }

  function renderMemberModule() {
    return `
      ${layoutSection(
        "成員 / 職務",
        "",
        `<button class="button" type="button" data-view="memberForm">新增成員</button>`,
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="members"><strong>成員名單</strong><span>查看成員資料。</span></button>
          <button class="quick-card" type="button" data-view="roleAssignments"><strong>職務任期檢視</strong><span>查看一人多職與年度任期。</span></button>
          <button class="quick-card" type="button" data-view="adminPermissions"><strong>系統權限說明</strong><span>admin、staff、viewer 集中在管理者設定。</span></button>
          <button class="quick-card" type="button" data-view="adminBasics"><strong>職稱主檔</strong><span>需管理者權限的基礎設定。</span></button>
        </div>`
      )}
      ${layoutSection(
        "廟務職務與系統權限",
        "",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>廟務職務 ≠ 系統權限</strong><p>主任委員、總幹事、值年爐主、委員、監事是廟務職務。</p></div>
          <div class="mini-card"><strong>admin 是系統權限</strong><p>可由不同人擔任，未來可依交接轉移、增加、減少或停用。</p></div>
        </div>`
      )}
      ${renderMembers()}
    `;
  }

  function renderMemberDetail() {
    const member = selectedMember();
    return `
      ${layoutSection(
        "成員詳情",
        "",
        `<button class="button secondary" type="button" data-view="members">返回列表</button>
         <button class="button" type="button" data-view="memberForm">編輯成員</button>
         <button class="button secondary" type="button" data-view="roleAssignments">管理廟務職務</button>
         <button class="button secondary" type="button" data-view="adminPermissions">管理系統權限</button>
         <button class="button secondary" type="button" data-view="roleAssignments">管理任期</button>
         <button class="button quiet" type="button" data-draft>停用成員</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>姓名</span><strong>${member.name}</strong></div>
          <div class="info-item"><span>電話</span><strong>${member.phone}</strong></div>
          <div class="info-item"><span>廟務職務</span><strong>${member.templeRole}</strong></div>
          <div class="info-item"><span>系統權限</span><strong>${member.systemPermission}</strong></div>
          <div class="info-item"><span>任期</span><strong>${member.term}</strong></div>
          <div class="info-item"><span>是否啟用</span><strong>${member.enabled ? "啟用" : "停用"}</strong></div>
        </div>
        <div class="stack">
          <div class="mini-card"><strong>開發測試資料 / 不代表正式名冊</strong><p>${member.source || data.mockNotice}</p></div>
          <div class="mini-card"><strong>廟務職務 ≠ 系統權限</strong><p>總幹事是廟務職務；admin 是系統權限，未來可轉移、增減、停用。</p></div>
          <div class="mini-card"><strong>備註</strong><p>${member.note}</p></div>
        </div>`
      )}
    `;
  }

  function renderMemberForm() {
    const member = data.members.find((item) => item.systemPermission === "admin") || data.members[0];
    return renderFormPanel(
      "成員新增 / 編輯",
      "成員資料只供 mock/dev 測試；照片轉錄名冊仍需使用者校對。",
      `<div class="form-grid">
        ${field("成員姓名", "text", member.name)}
        ${field("電話", "text", member.phone)}
        ${selectField("廟務職務", data.roleTypes.filter((role) => role.category === "廟務職務").map((role) => role.name), member.templeRole)}
        ${selectField("系統權限", ["admin", "staff", "viewer", "停用"], member.systemPermission)}
        ${field("任期或年度", "text", member.term)}
        ${selectField("是否啟用", ["啟用", "停用"], member.enabled ? "啟用" : "停用")}
        ${textareaField("備註", member.note, "wide")}
      </div>`
    );
  }

  function renderRoleAssignments() {
    return layoutSection(
      "職務任期",
      "示範 member_role_assignments：一人多職、任期起訖、年度職務都應保留。",
      `<button class="button" type="button" data-view="memberForm">新增成員</button>`,
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>成員</th>
              <th>職務 / 權限</th>
              <th>起日</th>
              <th>迄日</th>
              <th>是否啟用</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${data.memberRoleAssignments.map((assignment) => `
              <tr>
                <td>${memberName(assignment.memberId)}</td>
                <td><span class="pill">${roleName(assignment.roleTypeId)}</span></td>
                <td>${assignment.startDate || "照片未載明"}</td>
                <td>${assignment.endDate || "照片未載明"}</td>
                <td>${statusTag(assignment.active)}</td>
                <td>${assignment.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderRoleTypes() {
    return layoutSection(
      "職稱主檔",
      "廟務職務、友宮聯絡人職稱、系統權限分開管理，未來可作下拉選單來源。",
      "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>職稱 / 權限名稱</th>
              <th>類型</th>
              <th>使用位置</th>
            </tr>
          </thead>
          <tbody>
            ${data.roleTypes.map((role) => `
              <tr>
                <td><strong>${role.name}</strong></td>
                <td><span class="pill">${role.category}</span></td>
                <td>${role.category === "友宮聯絡人" ? "友宮聯絡人表單" : role.category === "系統權限" ? "後台權限檢視" : "成員 / 職務管理"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderPermissions() {
    return layoutSection(
      "系統權限檢視",
      "admin、staff、viewer 是系統操作權限，不等同廟務職務。",
      "",
      `<div class="stack">
        <div class="mini-card"><strong>admin</strong><p>可管理後台設定；不綁定單一個人，未來可轉移、增減、停用。</p></div>
        <div class="mini-card"><strong>staff</strong><p>可協助維護友宮、來訪、公告與活動資料。</p></div>
        <div class="mini-card"><strong>viewer</strong><p>以檢視為主，適合一般委員或年度職務查看資料。</p></div>
      </div>`
    );
  }

  function renderFinanceRecords() {
    const filtered = data.financeRecords.filter((record) => state.financeFilter === "全部" || record.direction === state.financeFilter);
    return layoutSection(
      "財務紀錄",
      "財務目前只做可視 prototype，不做正式帳務功能，不放帳戶、銀行、真實收據號碼。",
      `<button class="button" type="button" data-view="financeForm">新增財務草稿</button>`,
      `<div class="filters">
        <div class="field">
          <label for="financeFilter">收支篩選</label>
          <select id="financeFilter">
            ${["全部", "收入", "支出"].map((item) => `<option ${state.financeFilter === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>資料狀態</label><input value="mock/dev data" readonly></div>
        <div class="field"><label>敏感資訊</label><input value="未包含帳戶或真實收據" readonly></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>收支</th>
              <th>分類</th>
              <th>項目</th>
              <th>金額</th>
              <th>狀態</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((record) => `
              <tr>
                <td>${record.date}</td>
                <td><span class="pill">${record.direction}</span></td>
                <td>${record.category}</td>
                <td><strong>${record.item}</strong></td>
                <td>${record.amountLabel}</td>
                <td>${record.status}</td>
                <td>${record.note}</td>
                <td><button class="small-button primary" type="button" data-finance-detail="${record.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderFinanceModule() {
    return `
      ${layoutSection(
        "財務管理",
        "",
        `<button class="button" type="button" data-view="financeForm">新增財務紀錄</button>`,
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="financeRecords"><strong>財務紀錄</strong><span>查看財務紀錄。</span></button>
          <button class="quick-card" type="button" data-view="financeRecords"><strong>查看草稿</strong><span>查看草稿與待確認紀錄。</span></button>
          <button class="quick-card" type="button" data-view="adminBasics"><strong>收支分類</strong><span>分類設定集中在管理者設定。</span></button>
          <button class="quick-card" type="button" data-view="adminDataSources"><strong>資料保護提醒</strong><span>確認不寫入正式資料。</span></button>
        </div>`
      )}
      ${renderFinanceRecords()}
    `;
  }

  function renderFinanceDetail() {
    const record = selectedFinanceRecord();
    return `
      ${layoutSection(
        "財務詳情",
        "",
        `<button class="button secondary" type="button" data-view="financeRecords">返回列表</button>
         <button class="button" type="button" data-view="financeForm">編輯財務紀錄</button>
         <button class="button secondary" type="button" data-draft>儲存草稿</button>
         <button class="button quiet" type="button" data-draft>標記作廢</button>
         <button class="button secondary" type="button" data-view="financeForm">補備註</button>
         <button class="button secondary" type="button" data-view="adminBasics">類別檢視</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>日期</span><strong>${record.date}</strong></div>
          <div class="info-item"><span>收支</span><strong>${record.direction}</strong></div>
          <div class="info-item"><span>類別</span><strong>${record.category}</strong></div>
          <div class="info-item"><span>項目</span><strong>${record.item}</strong></div>
          <div class="info-item"><span>金額</span><strong>${record.amountLabel}</strong></div>
          <div class="info-item"><span>狀態</span><strong>${record.status}</strong></div>
          <div class="info-item"><span>經手人</span><strong>測試人員</strong></div>
        </div>
        <div class="mini-card"><strong>備註</strong><p>${record.note}</p></div>
        <div class="mini-card"><strong>安全提醒</strong><p>mock data 不包含銀行帳號、真實收據號碼、帳戶、個資或敏感資訊。</p></div>`
      )}
    `;
  }

  function renderFinanceForm() {
    const record = data.financeRecords[0];
    return renderFormPanel(
      "新增 / 編輯財務",
      "只作畫面雛形，不處理正式帳務、帳戶、銀行或真實收據。",
      `<div class="form-grid">
        ${field("日期", "date", record.date)}
        ${selectField("收支", ["收入", "支出"], record.direction)}
        ${selectField("收支分類", data.financeCategories.map((category) => category.name), record.category)}
        ${field("項目名稱", "text", record.item)}
        ${field("金額", "text", record.amountLabel)}
        ${selectField("狀態", ["草稿", "待確認", "已封存"], record.status)}
        ${textareaField("備註", record.note, "wide")}
      </div>`
    );
  }

  function renderFinanceCategories() {
    return layoutSection(
      "收支分類",
      "分類只供 prototype 畫面使用，不代表正式會計科目。",
      "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>分類名稱</th>
              <th>收入 / 支出</th>
              <th>是否啟用</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${data.financeCategories.map((category) => `
              <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.direction}</td>
                <td>${statusTag(category.enabled)}</td>
                <td>${category.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderLineLogs() {
    return layoutSection(
      "最近查詢紀錄",
      "對應 LINE Bot 查詢紀錄概念，但只使用 mock/dev data，不讀寫正式 line_query_logs。",
      "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>時間</th>
              <th>查詢文字</th>
              <th>類型</th>
              <th>結果</th>
              <th>命中資料</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${data.lineQueryLogs.map((log) => `
              <tr>
                <td>${log.time}</td>
                <td><strong>${log.queryText}</strong></td>
                <td>${log.queryType}</td>
                <td><span class="pill">${log.result}</span></td>
                <td>${log.matchedName || "未命中"}</td>
                <td>${log.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderNotFoundLogs() {
    const notFound = data.lineQueryLogs.filter((log) => log.result === "查無資料");
    return layoutSection(
      "查無資料紀錄",
      "讓廟方看見哪些查詢可能需要補友宮、別名或公告資料。",
      "",
      `<div class="stack">
        ${notFound.map((log) => `
          <div class="mini-card">
            <strong>${log.queryText}</strong>
            <p>${log.time}｜${log.queryType}｜${log.note}</p>
          </div>
        `).join("")}
      </div>`
    );
  }

  function renderMissingData() {
    return layoutSection(
      "補資料建議 / 待補清單",
      "對應現有 LINE Bot 補資料建議概念；只作 mock/dev data 視覺化。",
      "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>來源查詢</th>
              <th>類型</th>
              <th>狀態</th>
              <th>建議處理</th>
            </tr>
          </thead>
          <tbody>
            ${data.missingDataSuggestions.map((item) => `
              <tr>
                <td><strong>${item.sourceQuery}</strong></td>
                <td>${item.type}</td>
                <td><span class="pill">${item.status}</span></td>
                <td>${item.suggestion}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderSystemStatus() {
    return `
      ${layoutSection(
        "開發資料來源說明",
        "Web 後台目前是開發預覽，不影響正式 LINE Bot。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>正式主檔保護</strong><p>不修改正式 Google Sheets 主檔「中原福德宮_AppSheet_0612」。</p></div>
          <div class="mini-card"><strong>開發資料來源規劃</strong><p>後續如需串資料，只能指向「中原福德宮_AppSheet_0612_正式啟用前備份_20260616」或 mock/dev data。</p></div>
          <div class="mini-card"><strong>目前資料來源</strong><p>本 prototype 只讀取 web_admin_mvp/mockData.js。</p></div>
        </div>`
      )}
      ${layoutSection(
        "LINE Bot 狀態說明",
        "正式 LINE Bot V1 維持現有 runtime，本 prototype 不改 webhook、不改查詢、不改 log 寫入。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>不接正式 LINE Bot</strong><p>畫面中的 LINE / 查詢紀錄都是 mock/dev data。</p></div>
          <div class="mini-card"><strong>不讀寫正式 line_query_logs</strong><p>查詢紀錄畫面只對應概念，不連正式 Google Sheets。</p></div>
        </div>`
      )}
      ${layoutSection(
        "AppSheet 備援說明",
        "AppSheet 保留備援，但不再作為正式前端方向。",
        "",
        `<div class="mini-card"><strong>備援定位</strong><p>現階段不修改 AppSheet、不修改正式主檔 tab、欄位、表頭或資料結構。</p></div>`
      )}
    `;
  }

  function renderAdminBasics() {
    return `
      ${layoutSection(
        "基礎設定",
        "這些設定會影響下拉選單與資料分類，未來應限管理者維護。",
        `<span class="tag disabled">需管理者權限</span>`,
        `<div class="stack">
          <div class="mini-card">
            <strong>來訪型態</strong>
            <p>支援同一筆互動多選，來訪次數不手動填。</p>
            <div class="checkbox-row">${visitTypes.map((type) => `<span class="pill">${type}</span>`).join("")}</div>
          </div>
          <div class="mini-card">
            <strong>發布管道</strong>
            <p>保留 LINE / FB / VOOM 欄位，但 prototype 不做正式發送。</p>
            <div class="checkbox-row">${data.publishChannels.map((channel) => `<span class="pill">${channel.name}｜${channel.officialSendEnabled ? "正式發送" : "不正式發送"}</span>`).join("")}</div>
          </div>
          <div class="mini-card">
            <strong>職稱主檔</strong>
            <p>廟務職務、友宮聯絡人職稱、系統權限分開，避免自由輸入混亂。</p>
            <div class="checkbox-row">${data.roleTypes.map((role) => `<span class="pill">${role.name}｜${role.category}</span>`).join("")}</div>
          </div>
          <div class="mini-card">
            <strong>收支分類</strong>
            <p>只供財務 prototype 顯示，不代表正式會計科目。</p>
            <div class="checkbox-row">${data.financeCategories.map((category) => `<span class="pill">${category.name}｜${category.direction}</span>`).join("")}</div>
          </div>
        </div>`
      )}
    `;
  }

  function renderAdminPermissions() {
    const admins = data.members.filter((member) => member.systemPermission === "admin");
    return `
      ${layoutSection(
        "系統權限管理",
        "系統權限和廟務職務分開管理；admin 不綁定單一個人。",
        `<span class="tag disabled">需管理者權限</span>`,
        `<div class="stack">
          <div class="mini-card"><strong>admin</strong><p>系統權限，可管理設定；未來可轉移、增減、停用。</p></div>
          <div class="mini-card"><strong>staff</strong><p>系統權限，可協助維護日常資料。</p></div>
          <div class="mini-card"><strong>viewer</strong><p>系統權限，以檢視為主。</p></div>
          <div class="mini-card"><strong>總幹事</strong><p>廟務職務，不等於 admin。使用者本人目前可作為「總幹事 / admin」mock 範例。</p></div>
        </div>`
      )}
      ${layoutSection(
        "管理者清單",
        "目前只用 mock/dev data 顯示，正式權限未啟用。",
        "",
        `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>廟務職務</th>
                <th>系統權限</th>
                <th>資料來源</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map((member) => `
                <tr>
                  <td><strong>${member.name}</strong></td>
                  <td>${member.templeRole}</td>
                  <td><span class="pill">${member.systemPermission}</span></td>
                  <td>${member.source || data.mockNotice}</td>
                  <td>${member.note}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      )}
      ${layoutSection(
        "職務任期設定",
        "示範 member_role_assignments：一人多職、任期起訖、年度職務都應保留。",
        "",
        `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>成員</th>
                <th>職務 / 權限</th>
                <th>起日</th>
                <th>迄日</th>
                <th>是否啟用</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              ${data.memberRoleAssignments.map((assignment) => `
                <tr>
                  <td>${memberName(assignment.memberId)}</td>
                  <td><span class="pill">${roleName(assignment.roleTypeId)}</span></td>
                  <td>${assignment.startDate || "照片未載明"}</td>
                  <td>${assignment.endDate || "照片未載明"}</td>
                  <td>${statusTag(assignment.active)}</td>
                  <td>${assignment.note}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      )}
    `;
  }

  function renderAdminLineOps() {
    return `
      ${layoutSection(
        "LINE / 查詢維運",
        "這些資料僅供維運與補資料，不是一般使用者主要操作。",
        `<span class="tag disabled">需管理者權限</span>`,
        `<div class="mini-card"><strong>不讀寫正式 line_query_logs</strong><p>目前畫面只使用 mock/dev data，對應現有 LINE Bot 查詢紀錄與補資料建議概念。</p></div>`
      )}
      ${renderLineLogs()}
      ${renderNotFoundLogs()}
      ${renderMissingData()}
      ${layoutSection(
        "LINE Bot 狀態說明",
        "正式 LINE Bot V1 runtime 不受 Web 後台 prototype 影響。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>不修改 Webhook</strong><p>本 prototype 不改 LINE Developers Webhook。</p></div>
          <div class="mini-card"><strong>不改查詢流程</strong><p>不影響友宮查詢、來訪查詢、公告查詢、查紀錄與補資料建議。</p></div>
        </div>`
      )}
    `;
  }

  function renderAdminDataSources() {
    return `
      ${layoutSection(
        "系統與資料來源",
        "正式主檔、Render、LINE Bot runtime 都保持不動。",
        `<span class="tag disabled">需管理者權限</span>`,
        `<div class="stack">
          <div class="mini-card"><strong>正式主檔保護提醒</strong><p>正式主檔「中原福德宮_AppSheet_0612」不得修改 tab、欄位、表頭或資料結構。</p></div>
          <div class="mini-card"><strong>Web 後台目前資料</strong><p>目前只使用 mock/dev data：web_admin_mvp/mockData.js。</p></div>
          <div class="mini-card"><strong>開發資料來源規劃</strong><p>後續如需資料來源，只能使用「中原福德宮_AppSheet_0612_正式啟用前備份_20260616」或 mock/dev data。</p></div>
          <div class="mini-card"><strong>AppSheet 備援說明</strong><p>AppSheet 保留備援，但不再作為正式前端方向。</p></div>
          <div class="mini-card"><strong>LINE Bot 正式 runtime</strong><p>正式 LINE Bot 不受影響，不修改 Render GOOGLE_SHEET_ID，也不修改 LINE Developers Webhook。</p></div>
        </div>`
      )}
    `;
  }

  function renderAdminModule() {
    return `
      ${layoutSection(
        "管理者設定",
        "",
        `<span class="tag disabled">需管理者權限</span>`,
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="adminBasics"><strong>基礎設定</strong><span>來訪型態、發布管道、職稱主檔、收支分類。</span></button>
          <button class="quick-card" type="button" data-view="adminPermissions"><strong>權限與角色</strong><span>系統權限、管理者清單、職務任期設定。</span></button>
          <button class="quick-card" type="button" data-view="adminLineOps"><strong>LINE / 查詢維運</strong><span>查詢紀錄、查無資料與補資料建議。</span></button>
          <button class="quick-card" type="button" data-view="adminDataSources"><strong>系統與資料來源</strong><span>正式主檔保護、AppSheet 備援與開發資料來源。</span></button>
        </div>`
      )}
      ${renderAdminBasics()}
      ${renderAdminPermissions()}
      ${renderAdminLineOps()}
      ${renderAdminDataSources()}
    `;
  }

  function renderFormPanel(title, description, fieldsHtml) {
    return `
      <form class="form-panel" id="prototypeForm">
        <div class="section-header">
          <div>
            <h3>${title}</h3>
            <p>${description}</p>
            <p class="form-help">預覽，不會寫入正式資料。</p>
          </div>
        </div>
        ${fieldsHtml}
        <div class="form-footer">
          <button class="button quiet" type="button" data-view="dashboard">取消</button>
          <div class="actions">
            <button class="button secondary" type="button" data-draft>儲存草稿</button>
            <button class="button" type="submit">儲存</button>
          </div>
        </div>
      </form>
    `;
  }

  function field(label, type, value, extraClass = "") {
    return `
      <div class="field ${extraClass}">
        <label>${label}</label>
        <input type="${type}" value="${value ?? ""}">
      </div>
    `;
  }

  function textareaField(label, value, extraClass = "") {
    return `
      <div class="field ${extraClass}">
        <label>${label}</label>
        <textarea>${value ?? ""}</textarea>
      </div>
    `;
  }

  function selectField(label, options, value, extraClass = "") {
    return `
      <div class="field ${extraClass}">
        <label>${label}</label>
        <select>
          ${options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function render() {
    renderNav();
    const current = allNavItems().find((item) => item.id === state.view);
    pageTitle.textContent = current?.label || "主控台";

    const views = {
      dashboard: renderDashboard,
      templeModule: renderTempleModule,
      temples: renderTemples,
      templeDetail: renderTempleDetail,
      templeForm: renderTempleForm,
      contacts: renderContacts,
      contactForm: renderContactForm,
      visitModule: renderVisitModule,
      visits: renderVisits,
      visitDetail: renderVisitDetail,
      visitForm: renderVisitForm,
      visitTypeSettings: renderVisitTypeSettings,
      announcementModule: renderAnnouncementModule,
      announcements: renderAnnouncements,
      announcementDetail: renderAnnouncementDetail,
      announcementForm: renderAnnouncementForm,
      events: renderEvents,
      eventDetail: renderEventDetail,
      eventForm: renderEventForm,
      channelSettings: renderChannelSettings,
      memberModule: renderMemberModule,
      members: renderMembers,
      memberDetail: renderMemberDetail,
      memberForm: renderMemberForm,
      roleAssignments: renderRoleAssignments,
      roleTypes: renderRoleTypes,
      permissions: renderPermissions,
      financeModule: renderFinanceModule,
      financeRecords: renderFinanceRecords,
      financeDetail: renderFinanceDetail,
      financeForm: renderFinanceForm,
      financeCategories: renderFinanceCategories,
      lineLogs: renderLineLogs,
      notFoundLogs: renderNotFoundLogs,
      missingData: renderMissingData,
      systemStatus: renderSystemStatus,
      adminModule: renderAdminModule,
      adminBasics: renderAdminBasics,
      adminPermissions: renderAdminPermissions,
      adminLineOps: renderAdminLineOps,
      adminDataSources: renderAdminDataSources
    };

    root.innerHTML = (views[state.view] || renderDashboard)();
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-locked-admin]")) {
      event.preventDefault();
      showToast("此區需管理者權限；目前只做 prototype 權限提示。");
      return;
    }

    const viewTarget = event.target.closest("[data-view]");
    if (viewTarget) {
      const templeId = viewTarget.getAttribute("data-temple");
      setView(viewTarget.getAttribute("data-view"), { templeId });
    }

    const detailTarget = event.target.closest("[data-detail]");
    if (detailTarget) {
      setView("templeDetail", { templeId: detailTarget.getAttribute("data-detail") });
    }

    const visitDetailTarget = event.target.closest("[data-visit-detail]");
    if (visitDetailTarget) {
      setView("visitDetail", { visitId: visitDetailTarget.getAttribute("data-visit-detail") });
    }

    const announcementDetailTarget = event.target.closest("[data-announcement-detail]");
    if (announcementDetailTarget) {
      setView("announcementDetail", { announcementId: announcementDetailTarget.getAttribute("data-announcement-detail") });
    }

    const eventDetailTarget = event.target.closest("[data-event-detail]");
    if (eventDetailTarget) {
      setView("eventDetail", { eventId: eventDetailTarget.getAttribute("data-event-detail") });
    }

    const memberDetailTarget = event.target.closest("[data-member-detail]");
    if (memberDetailTarget) {
      setView("memberDetail", { memberId: memberDetailTarget.getAttribute("data-member-detail") });
    }

    const financeDetailTarget = event.target.closest("[data-finance-detail]");
    if (financeDetailTarget) {
      setView("financeDetail", { financeId: financeDetailTarget.getAttribute("data-finance-detail") });
    }

    if (event.target.closest("[data-draft]")) {
      showToast("已示範儲存草稿；不會寫入正式資料。");
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "templeSearch") {
      state.templeSearch = event.target.value.trim();
      render();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "templeFilter") {
      state.templeFilter = event.target.value;
      render();
    }
    if (event.target.id === "visitFilter") {
      state.visitFilter = event.target.value;
      render();
    }
    if (event.target.id === "announcementFilter") {
      state.announcementFilter = event.target.value;
      render();
    }
    if (event.target.id === "financeFilter") {
      state.financeFilter = event.target.value;
      render();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "prototypeForm") {
      event.preventDefault();
      showToast("已示範儲存；不會寫入正式資料。");
    }
  });

  render();
})();
