(function () {
  const data = window.webAdminMockData;
  const root = document.getElementById("appRoot");
  const pageTitle = document.getElementById("pageTitle");
  const nav = document.getElementById("primaryNav");

  const state = {
    view: "dashboard",
    previousView: "dashboard",
    selectedTempleId: data.temples[0].id,
    selectedDevoteeId: data.devotees?.[0]?.id,
    selectedTeamMemberId: data.teamMembers?.[0]?.id,
    templeSearch: "",
    devoteeSearch: "",
    visitSearch: "",
    announcementSearch: "",
    financeSearch: "",
    formSource: null
  };

  const visitTypes = ["參訪", "用餐", "進香", "邀請", "請帖", "祝壽", "遶境", "會香", "聯誼", "其他"];

  const navGroups = [
    { title: "主控台", items: [{ id: "dashboard", label: "主控台" }] },
    { title: "善信管理", items: [{ id: "devoteeModule", label: "善信管理" }] },
    { title: "友宮管理", items: [{ id: "templeModule", label: "友宮管理" }] },
    { title: "來訪 / 請帖", items: [{ id: "visitModule", label: "來訪 / 請帖" }] },
    { title: "公告 / 活動", items: [{ id: "announcementModule", label: "公告 / 活動" }] },
    { title: "團隊管理", items: [{ id: "teamModule", label: "團隊管理" }] },
    { title: "帳務管理", items: [{ id: "financeModule", label: "帳務管理" }] },
    { title: "管理者設定", admin: true, items: [{ id: "adminModule", label: "管理者設定", adminOnly: true }] }
  ];

  const moduleByView = {
    recentRecords: "dashboard",
    devoteeModule: "devoteeModule",
    devotees: "devoteeModule",
    devoteeDetail: "devoteeModule",
    devoteeForm: "devoteeModule",
    counterDesk: "devoteeModule",
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
    teamModule: "teamModule",
    teamMembers: "teamModule",
    teamMemberDetail: "teamModule",
    teamMemberForm: "teamModule",
    dutyRosters: "teamModule",
    memberModule: "teamModule",
    members: "teamModule",
    memberDetail: "teamModule",
    memberForm: "teamModule",
    roleAssignments: "teamModule",
    roleTypes: "adminModule",
    permissions: "adminModule",
    financeModule: "financeModule",
    financeRecords: "financeModule",
    financeDetail: "financeModule",
    financeForm: "financeModule",
    monthlyFinanceReports: "financeModule",
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

  function selectedDevotee() {
    return data.devotees.find((devotee) => devotee.id === state.selectedDevoteeId) || data.devotees[0];
  }

  function selectedTeamMember() {
    return data.teamMembers.find((member) => member.id === state.selectedTeamMemberId) || data.teamMembers[0];
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

  function formSourceSummary(kind) {
    const source = state.formSource;
    if (!source || source.kind !== kind) return "";
    const temple = selectedTemple();
    const visit = selectedVisit();
    if (kind === "temple") {
      return `<div class="mini-card source-card wide"><strong>關聯來源</strong><p>${temple.name}｜${temple.relationStatus}</p></div>`;
    }
    if (kind === "visit") {
      return `<div class="mini-card source-card wide"><strong>關聯來源</strong><p>${visit.title}｜${templeName(visit.templeId)}｜${visit.date}</p></div>`;
    }
    if (kind === "announcement") {
      const sourceLabel = source.visitId ? `${visit.title}｜${templeName(visit.templeId)}` : `${temple.name}`;
      return `<div class="mini-card source-card wide"><strong>關聯來源</strong><p>${sourceLabel}</p></div>`;
    }
    return "";
  }

  function devoteeName(id) {
    return data.devotees.find((devotee) => devotee.id === id)?.name || "未指定善信";
  }

  function teamMemberName(id) {
    return data.teamMembers.find((member) => member.id === id)?.name || memberName(id);
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

  function adminAccessTag() {
    return `<span class="tag ${isAdmin() ? "" : "disabled"}">${isAdmin() ? "管理者可操作" : "需管理者權限"}</span>`;
  }

  const viewLabels = {
    dashboard: "主控台",
    recentRecords: "近期廟務動態",
    devoteeModule: "善信管理",
    devotees: "善信資料",
    devoteeDetail: "善信詳情",
    devoteeForm: "善信新增 / 編輯",
    counterDesk: "櫃檯接待窗口",
    templeModule: "友宮管理",
    temples: "友宮管理",
    templeDetail: "友宮資料詳情",
    templeForm: "新增 / 編輯友宮",
    contacts: "友宮聯絡人",
    contactForm: "友宮聯絡人新增 / 編輯",
    visitModule: "來訪 / 請帖",
    visits: "來訪 / 請帖",
    visitDetail: "來訪 / 請帖詳情",
    visitForm: "新增 / 編輯來訪紀錄",
    announcementModule: "公告 / 活動",
    announcements: "公告列表",
    announcementDetail: "公告詳情",
    announcementForm: "新增 / 編輯公告",
    events: "活動列表",
    eventDetail: "活動詳情",
    eventForm: "新增 / 編輯活動",
    teamModule: "團隊管理",
    teamMembers: "團隊成員",
    teamMemberDetail: "團隊成員詳情",
    teamMemberForm: "團隊成員新增 / 編輯",
    dutyRosters: "值勤班表",
    memberModule: "職務 / 權限",
    members: "職務 / 權限名單",
    memberDetail: "職務 / 權限詳情",
    memberForm: "職務 / 權限新增 / 編輯",
    roleAssignments: "職務任期檢視",
    financeModule: "帳務管理",
    financeRecords: "帳務流水紀錄",
    financeDetail: "帳務詳情",
    financeForm: "新增 / 編輯帳務流水",
    monthlyFinanceReports: "月報公告草稿",
    adminModule: "管理者設定",
    adminBasics: "基礎設定",
    adminPermissions: "權限與角色",
    adminLineOps: "系統操作紀錄",
    adminDataSources: "系統與資料來源"
  };

  function setView(view, options = {}) {
    if (moduleByView[view] === "adminModule" && !isAdmin()) {
      showToast("此區需管理者權限；目前只做預覽模式權限提示。");
      return;
    }
    const previousView = state.view;
    state.view = view;
    state.previousView = previousView;
    if (options.templeId) state.selectedTempleId = options.templeId;
    if (options.devoteeId) state.selectedDevoteeId = options.devoteeId;
    if (options.teamMemberId) state.selectedTeamMemberId = options.teamMemberId;
    if (options.visitId) state.selectedVisitId = options.visitId;
    if (options.announcementId) state.selectedAnnouncementId = options.announcementId;
    if (options.eventId) state.selectedEventId = options.eventId;
    if (options.memberId) state.selectedMemberId = options.memberId;
    if (options.financeId) state.selectedFinanceId = options.financeId;
    state.formSource = options.sourceType ? { kind: options.sourceType, templeId: options.templeId, visitId: options.visitId } : null;
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
    const recentVisits = data.visits.filter((visit) => visit.date >= "2026-05-01").length;
    const openAnnouncements = data.announcements.filter((announcement) => announcement.status !== "已封存").length;

    return `
      <div class="metric-grid">
        <button class="metric-card" type="button" data-view="templeModule"><span>友宮數</span><strong>${data.temples.length}</strong></button>
        <button class="metric-card" type="button" data-view="visitModule"><span>近期來訪</span><strong>${recentVisits}</strong></button>
        <button class="metric-card" type="button" data-view="announcementModule"><span>公告數</span><strong>${openAnnouncements}</strong></button>
        <button class="metric-card" type="button" data-view="events"><span>活動數</span><strong>${data.events.length}</strong></button>
      </div>
      ${layoutSection(
        "常用入口",
        "",
        "",
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="counterDesk"><strong>櫃檯接待</strong><span></span></button>
          <button class="quick-card" type="button" data-view="devoteeForm"><strong>新增善信</strong><span></span></button>
          <button class="quick-card" type="button" data-view="templeForm"><strong>新增友宮</strong><span></span></button>
          <button class="quick-card" type="button" data-view="visitForm"><strong>新增來訪紀錄</strong><span></span></button>
          <button class="quick-card" type="button" data-view="announcementForm"><strong>新增公告</strong><span></span></button>
          <button class="quick-card" type="button" data-view="financeForm"><strong>新增帳務流水</strong><span></span></button>
        </div>`
      )}
      ${layoutSection(
        "近期廟務動態",
        "",
        `<button class="button secondary" type="button" data-view="recentRecords">查看全部</button>`,
        `<div class="activity-list">
          ${data.recentRecords.slice(0, 6).map((activity) => `
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
        `${isAdmin() ? `<button class="button secondary" type="button" data-view="adminModule">進入管理者設定</button>` : `<span class="tag disabled">需管理者權限</span>`}`,
        `<div class="compact-alerts ${isAdmin() ? "" : "locked-panel"}">
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="adminLineOps" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>系統操作紀錄</strong><span>${isAdmin() ? "查看" : "鎖定"}</span></button>
          <button class="alert-row ${isAdmin() ? "" : "locked"}" type="button" data-view="adminDataSources" ${isAdmin() ? "" : "data-locked-admin=\"true\" aria-disabled=\"true\""}><strong>系統與資料來源</strong><span>${isAdmin() ? "查看" : "鎖定"}</span></button>
        </div>`
      )}
    `;
  }

  function renderRecentRecords() {
    return layoutSection(
      "近期廟務動態",
      "彙整最近來訪、公告、活動、善信服務與團隊值勤等廟務事件。",
      `<button class="button secondary" type="button" data-view="dashboard">返回主控台</button>`,
      `<div class="activity-list">
        ${data.recentRecords.map((activity) => `
          <button class="activity-row" type="button" data-view="${activity.targetView}">
            <span>${activity.dateLabel}</span>
            <strong>${activity.title}</strong>
            <em>${activity.type}</em>
          </button>
        `).join("")}
      </div>`
    );
  }

  function renderDevotees(showPrimaryAction = true) {
    const keyword = state.devoteeSearch;
    const filtered = data.devotees.filter((devotee) => {
      return [devotee.name, devotee.phone, devotee.lineStatus, devotee.note].join(" ").includes(keyword);
    });

    return layoutSection(
      "善信資料列表",
      "先搜尋善信，再進入詳情處理發財金、平安龜、還金 / 還願與授權查詢。",
      showPrimaryAction ? `<button class="button" type="button" data-view="devoteeForm">新增善信</button>` : "",
      `<div class="filters">
        <div class="field wide">
          <label for="devoteeSearch">搜尋善信</label>
          <input id="devoteeSearch" type="search" value="${state.devoteeSearch}" placeholder="輸入姓名、電話或備註">
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>電話</th>
              <th>LINE 狀態</th>
              <th>發財金</th>
              <th>平安龜</th>
              <th>最近紀錄</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((devotee) => `
              <tr>
                <td><strong>${devotee.name}</strong></td>
                <td>${devotee.phone}</td>
                <td><span class="pill">${devotee.lineStatus}</span></td>
                <td>${devotee.fortuneMoneyStatus}</td>
                <td>${devotee.peaceTurtleStatus}</td>
                <td>${devotee.latestRecord}</td>
                <td><button class="small-button primary" type="button" data-devotee-detail="${devotee.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderDevoteeModule() {
    return renderDevotees(true);
  }

  function renderDevoteeDetail() {
    const devotee = selectedDevotee();
    const fortuneRecords = data.fortuneMoneyRecords.filter((record) => record.devoteeId === devotee.id);
    const turtleRecords = data.peaceTurtleRecords.filter((record) => record.devoteeId === devotee.id);
    const repayments = data.repaymentRecords.filter((record) => record.devoteeId === devotee.id);
    const queryLogs = data.devoteeQueryLogs.filter((log) => log.devoteeId === devotee.id);

    return `
      ${layoutSection(
        "善信詳情",
        "",
        `<button class="button secondary" type="button" data-view="devotees">返回列表</button>
         <button class="button" type="button" data-view="devoteeForm">編輯善信</button>
         <button class="button secondary" type="button" data-view="counterDesk">櫃檯接待</button>
         <button class="button secondary" type="button" data-view="financeForm">新增帳務流水</button>
         <button class="button quiet" type="button" data-draft>停用善信</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>姓名</span><strong>${devotee.name}</strong></div>
          <div class="info-item"><span>電話</span><strong>${devotee.phone}</strong></div>
          <div class="info-item"><span>LINE 狀態</span><strong>${devotee.lineStatus}</strong></div>
          <div class="info-item"><span>授權查詢</span><strong>${devotee.authorizedLookup ? "可查本人紀錄" : "未授權"}</strong></div>
          <div class="info-item"><span>最近紀錄</span><strong>${devotee.latestRecord}</strong></div>
          <div class="info-item"><span>是否啟用</span><strong>${devotee.enabled ? "啟用" : "停用"}</strong></div>
        </div>
        <div class="mini-card"><strong>備註</strong><p>${devotee.note}</p></div>
        <div class="mini-card"><strong>查詢權限</strong><p>善信本人只能查詢與自己相關的授權紀錄，不可查看內部帳務流水。</p></div>`
      )}
      ${layoutSection(
        "年度紀錄",
        "",
        "",
        `<div class="summary-strip">
          <div class="info-item"><span>發財金</span><strong>${fortuneRecords.length}</strong></div>
          <div class="info-item"><span>平安龜</span><strong>${turtleRecords.length}</strong></div>
          <div class="info-item"><span>還金 / 還願</span><strong>${repayments.length}</strong></div>
          <div class="info-item"><span>本人查詢</span><strong>${queryLogs.length}</strong></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>類型</th><th>年度 / 日期</th><th>狀態</th><th>關聯帳務</th><th>備註</th></tr></thead>
            <tbody>
              ${fortuneRecords.map((record) => `<tr><td>發財金</td><td>${record.year}</td><td>${record.status}</td><td>${record.relatedFinanceId || "未關聯"}</td><td>${record.note}</td></tr>`).join("")}
              ${turtleRecords.map((record) => `<tr><td>平安龜</td><td>${record.year}</td><td>${record.status}</td><td>${record.relatedFinanceId || "未關聯"}</td><td>${record.note}</td></tr>`).join("")}
              ${repayments.map((record) => `<tr><td>${record.type}</td><td>${record.date}</td><td>${record.status}</td><td>${record.relatedFinanceId || "未關聯"}</td><td>${record.note}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>`
      )}
    `;
  }

  function renderDevoteeForm() {
    const devotee = selectedDevotee();
    return renderFormPanel(
      "善信新增 / 編輯",
      "只作畫面雛形；電話請使用遮罩或由正式授權流程處理。",
      `<div class="form-grid">
        ${field("姓名", "text", devotee.name)}
        ${field("電話", "text", devotee.phone)}
        ${selectField("LINE 狀態", ["已加入", "未加入", "現場登記"], devotee.lineStatus)}
        ${selectField("本人授權查詢", ["可查本人紀錄", "未授權"], devotee.authorizedLookup ? "可查本人紀錄" : "未授權")}
        ${selectField("是否啟用", ["啟用", "停用"], devotee.enabled ? "啟用" : "停用")}
        ${textareaField("備註", devotee.note, "wide")}
      </div>`
    , { backView: "devotees" });
  }

  function renderCounterDesk() {
    const devotee = selectedDevotee();
    return renderFormPanel(
      "櫃檯接待窗口",
      "現場搜尋善信後，處理還金、平安龜、香油錢與備註；本階段不寫入正式資料。",
      `<div class="form-grid">
        ${selectField("善信", data.devotees.map((item) => item.name), devotee.name)}
        ${selectField("處理事項", ["還發財金", "還平安龜", "添香油錢", "補備註"], "還發財金")}
        ${field("金額", "text", "1,000")}
        ${selectField("經手人 / 現場值班", data.teamMembers.map((member) => member.name), data.teamMembers[0]?.name)}
        ${selectField("關聯帳務", ["建立帳務流水草稿", "暫不建立"], "建立帳務流水草稿")}
        ${textareaField("備註", "金額輸入未來會清洗全形數字、逗號與單位。", "wide")}
      </div>`
    , { backView: "devotees" });
  }

  function renderTemples(showPrimaryAction = true) {
    const filtered = data.temples.filter((temple) => {
      return [
        temple.name,
        temple.alias,
        temple.mainGod,
        temple.address,
        temple.relationStatus,
        temple.latestInteraction,
        temple.enabled ? "啟用" : "停用",
        temple.latestVisitDate
      ].join(" ").includes(state.templeSearch);
    });

    return layoutSection(
      "友宮資料列表",
      "畫面用語使用友宮；內部資料模型使用 temple。",
      showPrimaryAction ? `<button class="button" type="button" data-view="templeForm">新增友宮</button>` : "",
      `
      <div class="filters">
        <div class="field wide">
          <label for="templeSearch">搜尋友宮</label>
          <input id="templeSearch" type="search" value="${state.templeSearch}" placeholder="輸入宮廟名稱、主神、地址、關係狀態或最近互動">
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
              <th>最近互動</th>
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
                <td>${temple.latestInteraction || "尚無紀錄"}${temple.latestVisitDate ? `<br><span class="muted">${temple.latestVisitDate}</span>` : ""}</td>
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
    return renderTemples(true);
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
         <button class="button" type="button" data-view="visitForm" data-temple="${temple.id}" data-source="temple">新增來訪紀錄</button>
         <button class="button" type="button" data-view="announcementForm" data-temple="${temple.id}" data-source="announcement">新增相關公告</button>
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
        "關聯資料摘要，不在此區直接編輯。",
        `<button class="button secondary" type="button" data-view="contacts">管理聯絡人</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>聯絡人數</span><strong>${contacts.length}</strong></div>
          <div class="info-item"><span>最近聯絡人</span><strong>${contacts[0]?.name || "尚無"}</strong></div>
        </div>
        <div class="stack">${contacts.slice(0, 1).map((contact) => `
          <div class="mini-card">
            <strong>${contact.name}｜${contact.role}</strong>
            <span class="muted">${contact.phone}｜${contact.enabled ? "啟用" : "停用"}</span>
          </div>
        `).join("") || `<p class="muted">尚無聯絡人。</p>`}</div>`
      )}
      ${layoutSection(
        "來訪 / 請帖紀錄",
        "關聯紀錄摘要，完整內容請進入來訪詳情。",
        `<button class="button secondary" type="button" data-view="visits">查看來訪紀錄</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>紀錄數</span><strong>${visits.length}</strong></div>
          <div class="info-item"><span>最近紀錄</span><strong>${visits[0]?.date || "尚無"}</strong></div>
        </div>
        <div class="stack">${visits.slice(0, 1).map((visit) => `
          <div class="mini-card">
            <strong>${visit.date}｜${visit.title}</strong>
            <span class="muted">${visit.types.join("、")}｜${visit.peopleCount} 人｜${visit.needsReply ? "需要回覆" : "不需回覆"}</span>
          </div>
        `).join("") || `<p class="muted">尚無紀錄。</p>`}</div>`
      )}
      ${layoutSection(
        "相關公告",
        "關聯資料摘要，不在此區正式發送。",
        `<button class="button secondary" type="button" data-view="announcements">查看公告</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>公告數</span><strong>${announcements.length}</strong></div>
          <div class="info-item"><span>最近公告</span><strong>${announcements[0]?.title || "尚無"}</strong></div>
        </div>
        <div class="stack">${announcements.slice(0, 1).map((announcement) => `
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
        ${formSourceSummary("temple")}
        ${field("宮廟名稱", "text", temple.name)}
        ${field("別名", "text", temple.alias)}
        ${field("主神", "text", temple.mainGod)}
        ${field("電話", "text", temple.phone)}
        ${field("地址", "text", temple.address, "wide")}
        ${selectField("關係狀態", ["長期往來", "近期互動", "請帖往來", "待補資料", "資料待確認"], temple.relationStatus)}
        ${selectField("是否啟用", ["啟用", "停用"], temple.enabled ? "啟用" : "停用")}
        ${textareaField("公開摘要", temple.publicSummary, "wide")}
        ${textareaField("內部備註", temple.internalNote, "wide")}
      </div>
      <div class="mini-card source-card">
        <strong>儲存後下一步</strong>
        <p>完成友宮資料後，可接著管理聯絡人、新增來訪紀錄或新增相關公告。</p>
        <div class="actions">
          <button class="button secondary" type="button" data-view="contacts">管理聯絡人</button>
          <button class="button secondary" type="button" data-view="visitForm" data-temple="${temple.id}" data-source="temple">新增來訪紀錄</button>
          <button class="button secondary" type="button" data-view="announcementForm" data-temple="${temple.id}" data-source="announcement">新增相關公告</button>
        </div>
      </div>`
    , { backView: "temples", sourceView: state.formSource?.templeId ? "templeDetail" : "" });
  }

  function renderContacts() {
    return layoutSection(
      "友宮聯絡人管理",
      "聯絡人職稱示範對應未來 role_types，電話皆為遮罩或假資料。",
      `<button class="button secondary" type="button" data-view="templeDetail">返回來源資料</button>
       <button class="button" type="button" data-view="contactForm">聯絡人新增 / 編輯</button>`,
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
    , { backView: "contacts" });
  }

  function renderVisits(showPrimaryAction = true) {
    const filtered = data.visits.filter((visit) => {
      return [
        templeName(visit.templeId),
        visit.date,
        visit.title,
        visit.types.join(" "),
        `${visit.peopleCount}人`,
        visit.needsReply ? "需要回覆" : "不需回覆",
        visit.note
      ].join(" ").includes(state.visitSearch);
    });
    return layoutSection(
      "來訪 / 請帖紀錄列表",
      "記錄某間友宮在某一天的一次互動；來訪次數未來由紀錄自動計算。",
      showPrimaryAction ? `<button class="button" type="button" data-view="visitForm">新增來訪紀錄</button>` : "",
      `<div class="filters">
        <div class="field wide">
          <label for="visitSearch">搜尋來訪 / 請帖</label>
          <input id="visitSearch" type="search" value="${state.visitSearch}" placeholder="輸入友宮、日期、型態、回覆狀態或備註">
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>友宮名稱</th>
              <th>日期</th>
              <th>型態</th>
              <th>主題</th>
              <th>來訪人數</th>
              <th>是否需要回覆</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((visit) => `
              <tr>
                <td><strong>${templeName(visit.templeId)}</strong></td>
                <td>${visit.date}</td>
                <td>${visit.types.map((type) => `<span class="pill">${type}</span>`).join(" ")}</td>
                <td>${visit.title}</td>
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
        ${formSourceSummary("temple")}
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
    , { backView: "visits", sourceView: state.formSource?.templeId ? "templeDetail" : "" });
  }

  function renderVisitDetail() {
    const visit = selectedVisit();
    const linkedAnnouncements = data.announcements.filter((announcement) => announcement.relatedVisitId === visit.id);
    return `
      ${layoutSection(
        "來訪 / 請帖詳情",
        "",
        `<button class="button secondary" type="button" data-view="visits">返回列表</button>
         <button class="button" type="button" data-view="visitForm" data-temple="${visit.templeId}">編輯來訪紀錄</button>
         <button class="button secondary" type="button" data-detail="${visit.templeId}">關聯友宮</button>
         <button class="button" type="button" data-view="announcementForm" data-temple="${visit.templeId}" data-visit="${visit.id}" data-source="announcement">新增相關公告</button>
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
      ${layoutSection(
        "關聯公告 / 活動",
        "關聯資料只顯示摘要，需進入對應詳情後再編輯。",
        `<button class="button secondary" type="button" data-view="announcements">查看公告列表</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>相關公告</span><strong>${linkedAnnouncements.length}</strong></div>
          <div class="info-item"><span>最近公告</span><strong>${linkedAnnouncements[0]?.title || "尚無"}</strong></div>
        </div>`
      )}
    `;
  }

  function renderVisitModule() {
    return renderVisits(true);
  }

  function renderVisitTypeSettings() {
    return layoutSection(
      "來訪型態設定",
      "目前先固定為 V2 討論中的型態清單；未來可改為可維護選單。",
      `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>`,
      `<div class="checkbox-row">
        ${visitTypes.map((type) => `<span class="pill">${type}</span>`).join("")}
      </div>
      <div class="mini-card">
        <strong>多選原則</strong>
        <p>同一筆互動可同時是請帖、邀請、祝壽或用餐等多種型態。來訪次數不手動填，由同一友宮的紀錄數自動計算。</p>
      </div>`
    );
  }

  function renderAnnouncements(showPrimaryAction = true) {
    const filtered = data.announcements.filter((announcement) => {
      const relatedVisit = data.visits.find((visit) => visit.id === announcement.relatedVisitId);
      return [
        announcement.title,
        announcement.status,
        announcement.date,
        announcement.channels.join(" "),
        relatedVisit?.title,
        relatedVisit ? templeName(relatedVisit.templeId) : "",
        announcement.lineText,
        announcement.content
      ].join(" ").includes(state.announcementSearch);
    });
    return layoutSection(
      "公告列表",
      "公告可整理 LINE / FB / VOOM 文字，但第一版不做正式發送。",
      showPrimaryAction ? `<button class="button" type="button" data-view="announcementForm">新增公告</button>` : "",
      `<div class="filters">
        <div class="field wide">
          <label for="announcementSearch">搜尋公告</label>
          <input id="announcementSearch" type="search" value="${state.announcementSearch}" placeholder="輸入標題、狀態、日期、發布管道或關聯友宮">
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
        ${formSourceSummary("announcement")}
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
    , { backView: "announcements", sourceView: state.formSource?.visitId ? "visitDetail" : state.formSource?.templeId ? "templeDetail" : "" });
  }

  function renderAnnouncementDetail() {
    const announcement = selectedAnnouncement();
    const linkedVisit = data.visits.find((visit) => visit.id === announcement.relatedVisitId);
    const linkedEvents = data.events.filter((eventItem) => eventItem.linkedAnnouncementId === announcement.id);
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
      ${layoutSection(
        "關聯來訪 / 活動",
        "關聯資料只顯示摘要，需進入對應詳情後再編輯。",
        `<button class="button secondary" type="button" data-view="visits">查看來訪紀錄</button>
         <button class="button secondary" type="button" data-view="events">查看活動列表</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>關聯來訪</span><strong>${linkedVisit ? linkedVisit.title : "未關聯"}</strong></div>
          <div class="info-item"><span>關聯活動</span><strong>${linkedEvents.length}</strong></div>
        </div>`
      )}
    `;
  }

  function renderAnnouncementModule() {
    return `
      ${renderAnnouncements(true)}
      ${renderEvents(true)}
    `;
  }

  function renderEvents(showPrimaryAction = true) {
    return layoutSection(
      "活動列表",
      "活動資料使用本機測試資料，可與公告或來訪紀錄建立關聯雛形。",
      showPrimaryAction ? `<button class="button" type="button" data-view="eventForm">新增活動</button>` : "",
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
      "活動先作為本機測試資料，不代表正式活動排程。",
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
    , { backView: "events" });
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
         <button class="button secondary" type="button" data-view="announcementForm">關聯公告</button>
         <button class="button secondary" type="button" data-view="templeModule">關聯友宮</button>
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
      ${layoutSection(
        "關聯資料",
        "關聯資料只顯示摘要，需進入對應詳情後再編輯。",
        `<button class="button secondary" type="button" data-view="announcements">查看公告列表</button>`,
        `<div class="summary-strip">
          <div class="info-item"><span>關聯公告</span><strong>${announcement ? announcement.title : "未關聯"}</strong></div>
          <div class="info-item"><span>關聯友宮</span><strong>待建立欄位</strong></div>
        </div>`
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

  function renderTeamMembers(showPrimaryAction = true) {
    return layoutSection(
      "團隊成員列表",
      "團隊成員可為志工、現場協助者或值勤人員，不一定是系統登入使用者。",
      showPrimaryAction ? `<button class="button" type="button" data-view="teamMemberForm">新增團隊成員</button>` : "",
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>電話</th>
              <th>角色</th>
              <th>是否系統使用者</th>
              <th>近期值勤</th>
              <th>是否啟用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.teamMembers.map((member) => `
              <tr>
                <td><strong>${member.name}</strong></td>
                <td>${member.phone}</td>
                <td>${member.teamRole}</td>
                <td>${member.systemUser ? "是" : "否"}</td>
                <td>${member.latestDuty}</td>
                <td>${statusTag(member.enabled)}</td>
                <td><button class="small-button primary" type="button" data-team-member-detail="${member.id}">查看詳情</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderTeamModule() {
    return `
      ${renderTeamMembers(true)}
      ${renderDutyRosters()}
    `;
  }

  function renderTeamMemberDetail() {
    const member = selectedTeamMember();
    const rosters = data.dutyRosters.filter((roster) => roster.teamMemberId === member.id);
    return `
      ${layoutSection(
        "團隊成員詳情",
        "",
        `<button class="button secondary" type="button" data-view="teamMembers">返回列表</button>
         <button class="button" type="button" data-view="teamMemberForm">編輯團隊成員</button>
         <button class="button secondary" type="button" data-view="dutyRosters">管理值勤班表</button>
         <button class="button secondary" type="button" data-view="members">查看廟務職務 / 系統權限</button>
         <button class="button secondary" type="button" data-view="roleAssignments">查看職務任期</button>
         <button class="button secondary" type="button" data-view="counterDesk">設為現場值班</button>
         <button class="button quiet" type="button" data-draft>停用團隊成員</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>姓名</span><strong>${member.name}</strong></div>
          <div class="info-item"><span>電話</span><strong>${member.phone}</strong></div>
          <div class="info-item"><span>團隊角色</span><strong>${member.teamRole}</strong></div>
          <div class="info-item"><span>系統使用者</span><strong>${member.systemUser ? "是" : "否"}</strong></div>
          <div class="info-item"><span>值勤筆數</span><strong>${rosters.length}</strong></div>
          <div class="info-item"><span>是否啟用</span><strong>${member.enabled ? "啟用" : "停用"}</strong></div>
        </div>
        <div class="mini-card"><strong>權限邊界</strong><p>團隊成員不一定是系統使用者，也不一定有帳務管理權限。</p></div>
        <div class="mini-card"><strong>備註</strong><p>${member.note}</p></div>`
      )}
      ${layoutSection(
        "值勤紀錄",
        "",
        `<button class="button secondary" type="button" data-view="dutyRosters">查看值勤班表</button>`,
        `<div class="table-wrap">
          <table>
            <thead><tr><th>日期</th><th>農曆 / 節日</th><th>備註</th><th>是否啟用</th></tr></thead>
            <tbody>
              ${rosters.map((roster) => `<tr><td>${roster.dutyStartDate} ~ ${roster.dutyEndDate}</td><td>${roster.lunarNote || roster.festivalNote || "一般值勤"}</td><td>${roster.note}</td><td>${statusTag(roster.active)}</td></tr>`).join("") || `<tr><td colspan="4">尚無值勤紀錄</td></tr>`}
            </tbody>
          </table>
        </div>`
      )}
    `;
  }

  function renderTeamMemberForm() {
    const member = selectedTeamMember();
    return renderFormPanel(
      "團隊成員新增 / 編輯",
      "團隊成員可作為值勤提醒、活動支援與現場經手人候選。",
      `<div class="form-grid">
        ${field("姓名", "text", member.name)}
        ${field("電話", "text", member.phone)}
        ${selectField("團隊角色", ["志工", "現場協助", "值勤人員", "活動支援"], member.teamRole)}
        ${selectField("是否系統使用者", ["否", "是"], member.systemUser ? "是" : "否")}
        ${selectField("是否啟用", ["啟用", "停用"], member.enabled ? "啟用" : "停用")}
        ${textareaField("備註", member.note, "wide")}
      </div>`
    , { backView: "teamMembers" });
  }

  function renderDutyRosters() {
    return layoutSection(
      "值勤班表",
      "值勤班表不等於職務任期；可作為現場表單的經手人 / 現場值班預設。",
      `<button class="button secondary" type="button" data-view="teamModule">返回團隊管理</button>
       <button class="button secondary" type="button" data-view="teamMemberForm">新增值勤人員</button>`,
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>值勤人員</th>
              <th>輪值日期</th>
              <th>農曆備註</th>
              <th>節日備註</th>
              <th>備註</th>
              <th>是否啟用</th>
            </tr>
          </thead>
          <tbody>
            ${data.dutyRosters.map((roster) => `
              <tr>
                <td><strong>${teamMemberName(roster.teamMemberId)}</strong></td>
                <td>${roster.dutyStartDate} ~ ${roster.dutyEndDate}</td>
                <td>${roster.lunarNote || "無"}</td>
                <td>${roster.festivalNote || "無"}</td>
                <td>${roster.note}</td>
                <td>${statusTag(roster.active)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`
    );
  }

  function renderMembers(showPrimaryAction = false) {
    return `
      ${layoutSection(
        "廟務職務 / 系統權限名單",
        `此區是團隊管理的下一層內容；廟務職務是人在廟裡的職稱，系統權限是能使用後台哪些功能。${data.mockNotice}。`,
        showPrimaryAction ? `<button class="button" type="button" data-view="memberForm">新增職務 / 權限資料</button>` : "",
        `<div class="filters">
          <div class="field"><label>職務篩選</label><select><option>全部</option><option>主任委員</option><option>總幹事</option><option>委員</option><option>監事</option></select></div>
          <div class="field"><label>狀態篩選</label><select><option>全部</option><option>啟用</option><option>停用</option></select></div>
          <div class="field"><label>名冊狀態</label><input value="待校對 / 不代表正式名冊" readonly></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>成員</th>
                <th>電話</th>
                <th>廟務職務</th>
                <th>系統權限</th>
                <th>任期</th>
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
        "職務任期檢視",
        "只顯示摘要；具體人員任期資料屬於團隊管理，不放在管理者設定。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>任期資料</strong><p>${data.memberRoleAssignments.length} 筆測試任期資料。</p></div>
          <div class="mini-card"><strong>年度職務</strong><p>值年爐主、值年副爐主一年一選，需保留歷史任期。</p></div>
        </div>`
      )}
    `;
  }

  function renderMemberModule() {
    return renderMembers(true);
  }

  function renderMemberDetail() {
    const member = selectedMember();
    return `
      ${layoutSection(
        "廟務職務 / 系統權限詳情",
        "",
        `<button class="button secondary" type="button" data-view="members">返回列表</button>
         <button class="button" type="button" data-view="memberForm">編輯職務 / 權限資料</button>
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
          <div class="mini-card"><strong>待校對 / 不代表正式名冊</strong><p>${member.source || "照片轉錄，待校對"}</p></div>
          <div class="mini-card"><strong>廟務職務 ≠ 系統權限</strong><p>總幹事是廟務職務；admin 是系統權限，未來可轉移、增減、停用。</p></div>
          <div class="mini-card"><strong>任期 / 權限摘要</strong><p>此成員的職務與權限關聯需進入管理者設定或任期檢視後管理。</p></div>
          <div class="mini-card"><strong>備註</strong><p>${member.note}</p></div>
        </div>`
      )}
    `;
  }

  function renderMemberForm() {
    const member = data.members.find((item) => item.systemPermission === "admin") || data.members[0];
    return renderFormPanel(
      "職務 / 權限新增 / 編輯",
      "職務與權限資料只供畫面測試；照片轉錄名冊仍需使用者校對。",
      `<div class="form-grid">
        ${field("成員姓名", "text", member.name)}
        ${field("電話", "text", member.phone)}
        ${selectField("廟務職務", data.roleTypes.filter((role) => role.category === "廟務職務").map((role) => role.name), member.templeRole)}
        ${selectField("系統權限", ["admin", "staff", "viewer", "停用"], member.systemPermission)}
        ${field("任期或年度", "text", member.term)}
        ${selectField("是否啟用", ["啟用", "停用"], member.enabled ? "啟用" : "停用")}
        ${textareaField("備註", member.note, "wide")}
      </div>`
    , { backView: "members" });
  }

  function renderRoleAssignments() {
    return layoutSection(
      "職務任期",
      "示範 member_role_assignments：一人多職、任期起訖、年度職務都應保留。",
      `<button class="button secondary" type="button" data-view="teamModule">返回團隊管理</button>
       <button class="button" type="button" data-view="memberForm">新增職務 / 權限資料</button>`,
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
      `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>`,
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
                <td>${role.category === "友宮聯絡人" ? "友宮聯絡人表單" : role.category === "系統權限" ? "後台權限檢視" : "團隊管理下一層"}</td>
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
      `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>`,
      `<div class="stack">
        <div class="mini-card"><strong>admin</strong><p>可管理後台設定；不綁定單一個人，未來可轉移、增減、停用。</p></div>
        <div class="mini-card"><strong>staff</strong><p>可協助維護友宮、來訪、公告與活動資料。</p></div>
        <div class="mini-card"><strong>viewer</strong><p>以檢視為主，適合一般委員或年度職務查看資料。</p></div>
      </div>`
    );
  }

  function renderFinanceRecords(showPrimaryAction = true) {
    const filtered = data.financeRecords.filter((record) => {
      return [
        record.date,
        record.direction,
        record.category,
        record.item,
        record.amountLabel,
        record.relatedLabel,
        teamMemberName(record.handledBy),
        record.status,
        record.note
      ].join(" ").includes(state.financeSearch);
    });
    return layoutSection(
      "帳務流水紀錄",
      "廟務流水帳、收支摘要與月報公告草稿；不做正式會計、報稅、審計或銀行帳務。",
      showPrimaryAction ? `<button class="button" type="button" data-view="financeForm">新增帳務流水</button>` : "",
      `<div class="filters">
        <div class="field wide">
          <label for="financeSearch">搜尋帳務流水</label>
          <input id="financeSearch" type="search" value="${state.financeSearch}" placeholder="輸入日期、收支、分類、項目、關聯來源、經手人或狀態">
        </div>
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
              <th>關聯來源</th>
              <th>經手人</th>
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
                <td>${record.relatedLabel}</td>
                <td>${teamMemberName(record.handledBy)}</td>
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
      ${renderFinanceRecords(true)}
      ${renderMonthlyFinanceReports()}
    `;
  }

  function renderFinanceDetail() {
    const record = selectedFinanceRecord();
    return `
      ${layoutSection(
        "帳務詳情",
        "",
        `<button class="button secondary" type="button" data-view="financeRecords">返回列表</button>
         <button class="button" type="button" data-view="financeForm">編輯帳務流水</button>
         <button class="button secondary" type="button" data-draft>儲存草稿</button>
         <button class="button quiet" type="button" data-draft>標記作廢</button>
         <button class="button secondary" type="button" data-view="financeForm">補備註</button>
         <button class="button secondary" type="button" data-view="adminBasics">類別檢視</button>
         <button class="button secondary" type="button" data-view="monthlyFinanceReports">月報公告草稿</button>`,
        `<div class="info-grid">
          <div class="info-item"><span>日期</span><strong>${record.date}</strong></div>
          <div class="info-item"><span>收支</span><strong>${record.direction}</strong></div>
          <div class="info-item"><span>類別</span><strong>${record.category}</strong></div>
          <div class="info-item"><span>項目</span><strong>${record.item}</strong></div>
          <div class="info-item"><span>金額</span><strong>${record.amountLabel}</strong></div>
          <div class="info-item"><span>關聯來源</span><strong>${record.relatedLabel}</strong></div>
          <div class="info-item"><span>月報期間</span><strong>${record.monthlyReportPeriod}</strong></div>
          <div class="info-item"><span>公告對象</span><strong>${record.announcementTargetGroup}</strong></div>
          <div class="info-item"><span>狀態</span><strong>${record.status}</strong></div>
          <div class="info-item"><span>經手人 / 現場值班</span><strong>${teamMemberName(record.handledBy)}</strong></div>
        </div>
        <div class="mini-card"><strong>備註</strong><p>${record.note}</p></div>
        <div class="mini-card"><strong>作廢 / 沖銷</strong><p>原始流水不可直接刪除；作廢需保留原紀錄，必要時另建沖銷紀錄。</p></div>
        <div class="mini-card"><strong>安全提醒</strong><p>測試資料不包含銀行帳號、真實收據號碼、帳戶、個資或敏感資訊。</p></div>`
      )}
    `;
  }

  function renderFinanceForm() {
    const record = data.financeRecords[0];
    return renderFormPanel(
      "新增 / 編輯帳務流水",
      "只作畫面雛形，不處理正式會計、帳戶、銀行或真實收據。",
      `<div class="form-grid">
        ${field("日期", "date", record.date)}
        ${selectField("收支", ["收入", "支出"], record.direction)}
        ${selectField("收支分類", data.financeCategories.map((category) => category.name), record.category)}
        ${field("項目名稱", "text", record.item)}
        ${field("金額", "text", record.amountLabel)}
        ${selectField("關聯來源", ["手動", "善信", "發財金", "平安龜", "還金 / 還願", "友宮來訪", "活動", "公告"], record.relatedTypeLabel)}
        ${selectField("經手人 / 現場值班", data.teamMembers.map((member) => member.name), teamMemberName(record.handledBy))}
        ${selectField("是否納入月報", ["納入", "不納入"], record.announcementVisibility ? "納入" : "不納入")}
        ${selectField("公告對象", ["團隊成員", "管理委員會成員", "系統管理者"], record.announcementTargetGroup)}
        ${field("月報期間", "text", record.monthlyReportPeriod)}
        ${selectField("狀態", ["草稿", "待確認", "已確認", "作廢"], record.status)}
        ${textareaField("備註", record.note, "wide")}
      </div>`
    , { backView: "financeRecords" });
  }

  function renderMonthlyFinanceReports() {
    return layoutSection(
      "月報公告草稿",
      "依月份彙整帳務流水，產生可貼到 LINE 群組的公告草稿；本階段不正式推播。",
      `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>`,
      `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>期間</th>
              <th>標題</th>
              <th>公告對象</th>
              <th>狀態</th>
              <th>內容摘要</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyFinanceReports.map((report) => `
              <tr>
                <td>${report.period}</td>
                <td><strong>${report.title}</strong></td>
                <td>${report.targetGroup}</td>
                <td><span class="pill">${report.status}</span></td>
                <td>${report.summaryText}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="mini-card"><strong>揭露原則</strong><p>公開摘要與內部完整版本分開；善信本人只能查詢與自己相關的授權紀錄。</p></div>`
    );
  }

  function renderFinanceCategories() {
    return layoutSection(
      "收支分類",
      "分類只供帳務流水畫面使用，不代表正式會計科目。",
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
      "對應 LINE Bot 查詢紀錄概念，但只使用本機測試資料，不讀寫正式 line_query_logs。",
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
      "對應現有 LINE Bot 補資料建議概念；只作本機測試資料視覺化。",
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
        "資料來源說明",
        "Web 後台目前是預覽模式，不影響正式 LINE Bot。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>正式主檔保護</strong><p>不修改正式 Google Sheets 主檔「中原福德宮_AppSheet_0612」。</p></div>
          <div class="mini-card"><strong>後續資料來源規劃</strong><p>後續如需串資料，只能指向「中原福德宮_AppSheet_0612_正式啟用前備份_20260616」或本機測試資料。</p></div>
          <div class="mini-card"><strong>目前資料</strong><p>目前只使用本機測試資料，不寫入正式資料。</p></div>
        </div>`
      )}
      ${layoutSection(
        "LINE Bot 狀態說明",
        "正式 LINE Bot V1 維持現有 runtime，本預覽頁不改 webhook、不改查詢、不改 log 寫入。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>不接正式 LINE Bot</strong><p>畫面中的 LINE / 查詢紀錄都是本機測試資料。</p></div>
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
    const publishChannels = ["LINE", "Facebook", "VOOM", "宮廟公告欄"];
    const publishStatuses = ["草稿", "預覽", "不正式發送", "已發布"];
    const templeRoles = data.roleTypes.filter((role) => role.category === "廟務職務").map((role) => role.name);
    const contactRoles = data.roleTypes.filter((role) => role.category === "友宮聯絡人").map((role) => role.name);
    const systemPermissions = data.roleTypes.filter((role) => role.category === "系統權限").map((role) => role.name);
    const accountingCategories = ["香油錢", "發財金還金", "平安龜還願", "餐費", "供品", "其他"];
    const tagGroup = (title, items) => `
      <div class="mini-card">
        <strong>${title}</strong>
        <div class="checkbox-row">${items.map((item) => `<span class="pill">${item}</span>`).join("")}</div>
      </div>
    `;

    return `
      ${layoutSection(
        "標籤 / 主檔管理",
        "分類只維護選單與規則，不放具體人員任期資料。",
        `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>${adminAccessTag()}`,
        `<div class="stack">
          ${tagGroup("發布管道", publishChannels)}
          ${tagGroup("發布狀態", publishStatuses)}
          ${tagGroup("來訪型態", visitTypes)}
          ${tagGroup("廟務職務", templeRoles)}
          ${tagGroup("友宮聯絡人職稱", contactRoles)}
          ${tagGroup("系統權限", systemPermissions)}
          ${tagGroup("帳務分類", accountingCategories)}
          <div class="mini-card">
            <strong>分類原則</strong>
            <p>LINE / Facebook / VOOM 是發布管道；預覽 / 不正式發送是發布狀態。admin / staff / viewer 是系統權限，不是廟務職務。</p>
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
        `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>${adminAccessTag()}`,
        `<div class="stack">
          <div class="mini-card"><strong>admin</strong><p>系統權限，可管理設定；未來可轉移、增減、停用。</p></div>
          <div class="mini-card"><strong>staff</strong><p>系統權限，可協助維護日常資料。</p></div>
          <div class="mini-card"><strong>viewer</strong><p>系統權限，以檢視為主。</p></div>
          <div class="mini-card"><strong>總幹事</strong><p>廟務職務，不等於 admin。使用者本人目前可作為「總幹事 / admin」mock 範例。</p></div>
        </div>`
      )}
      ${layoutSection(
        "管理者清單",
        "只顯示管理者權限摘要；具體人員任期資料請回到團隊管理。",
        `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>`,
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
        "職務任期入口",
        "職務任期屬於團隊管理，不作為管理者設定主內容。",
        `<button class="button secondary" type="button" data-view="teamModule">返回團隊管理</button>`,
        `<div class="mini-card"><strong>分類原則</strong><p>管理者設定只保留權限規則與系統參數；具體人員任期請在團隊管理中檢視與維護。</p></div>`
      )}
    `;
  }

  function renderAdminLineOps() {
    return `
      ${layoutSection(
        "系統操作紀錄",
        "這些資料僅供維運與補資料，不是一般使用者主要操作。",
        `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>${adminAccessTag()}`,
        `<div class="mini-card"><strong>不讀寫正式 line_query_logs</strong><p>目前畫面只使用本機測試資料，對應現有 LINE Bot 查詢紀錄與補資料建議概念。</p></div>`
      )}
      ${renderLineLogs()}
      ${renderNotFoundLogs()}
      ${renderMissingData()}
      ${layoutSection(
        "LINE Bot 狀態說明",
        "正式 LINE Bot V1 runtime 不受 Web 後台預覽頁影響。",
        "",
        `<div class="stack">
          <div class="mini-card"><strong>不修改 Webhook</strong><p>本預覽頁不改 LINE Developers Webhook。</p></div>
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
        `<button class="button secondary" type="button" data-view="adminModule">返回管理者設定</button>${adminAccessTag()}`,
        `<div class="stack">
          <div class="mini-card"><strong>正式主檔保護提醒</strong><p>正式主檔「中原福德宮_AppSheet_0612」不得修改 tab、欄位、表頭或資料結構。</p></div>
          <div class="mini-card"><strong>Web 後台目前資料</strong><p>目前只使用本機測試資料。</p></div>
          <div class="mini-card"><strong>後續資料來源規劃</strong><p>後續如需資料來源，只能使用「中原福德宮_AppSheet_0612_正式啟用前備份_20260616」或本機測試資料。</p></div>
          <div class="mini-card"><strong>AppSheet 備援說明</strong><p>AppSheet 保留備援，但不再作為正式前端方向。</p></div>
          <div class="mini-card"><strong>LINE Bot 正式 runtime</strong><p>正式 LINE Bot 不受影響，不修改 Render GOOGLE_SHEET_ID，也不修改 LINE Developers Webhook。</p></div>
          <div class="mini-card"><strong>V2 temples / V1 shrines</strong><p>Web 後台與 V2 模型使用 temples；短期正式 V1 runtime 仍保留 shrines。</p></div>
          <div class="mini-card"><strong>V2 temple_visits / V1 shrine_visits</strong><p>Web 後台與 V2 模型使用 temple_visits；短期正式 V1 runtime 仍保留 shrine_visits。</p></div>
          <div class="mini-card"><strong>資料保護提醒</strong><p>不放真實 LINE UID、token、secret、銀行資料、帳戶、真實收據號碼或敏感個資。</p></div>
        </div>`
      )}
    `;
  }

  function renderAdminModule() {
    return `
      ${layoutSection(
        "管理者設定",
        "",
        adminAccessTag(),
        `<div class="quick-grid">
          <button class="quick-card" type="button" data-view="adminBasics"><strong>標籤 / 主檔管理</strong><span>發布管道、發布狀態、來訪型態、職稱、權限、帳務分類。</span></button>
          <button class="quick-card" type="button" data-view="adminPermissions"><strong>權限與角色</strong><span>系統權限、管理者清單與權限規則。</span></button>
          <button class="quick-card" type="button" data-view="adminLineOps"><strong>系統操作紀錄</strong><span>查詢紀錄、查無資料與補資料建議。</span></button>
          <button class="quick-card" type="button" data-view="adminDataSources"><strong>系統與資料來源</strong><span>正式主檔保護、AppSheet 備援與資料來源。</span></button>
        </div>`
      )}
    `;
  }

  function renderFormPanel(title, description, fieldsHtml, options = {}) {
    const backView = options.backView || state.previousView || "dashboard";
    const sourceView = options.sourceView;
    return `
      <form class="form-panel" id="prototypeForm">
        <div class="section-header">
          <div>
            <h3>${title}</h3>
            <p>${description}</p>
            <p class="form-help">預覽，不會寫入正式資料。</p>
          </div>
          <div class="actions">
            <button class="button secondary" type="button" data-view="${backView}">返回上一頁</button>
            ${sourceView ? `<button class="button secondary" type="button" data-view="${sourceView}">返回來源資料</button>` : ""}
          </div>
        </div>
        ${fieldsHtml}
        <div class="form-footer">
          <button class="button quiet" type="button" data-view="${backView}">取消</button>
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
    pageTitle.textContent = viewLabels[state.view] || current?.label || "主控台";

    const views = {
      dashboard: renderDashboard,
      recentRecords: renderRecentRecords,
      devoteeModule: renderDevoteeModule,
      devotees: renderDevotees,
      devoteeDetail: renderDevoteeDetail,
      devoteeForm: renderDevoteeForm,
      counterDesk: renderCounterDesk,
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
      teamModule: renderTeamModule,
      teamMembers: renderTeamMembers,
      teamMemberDetail: renderTeamMemberDetail,
      teamMemberForm: renderTeamMemberForm,
      dutyRosters: renderDutyRosters,
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
      monthlyFinanceReports: renderMonthlyFinanceReports,
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
      showToast("此區需管理者權限；目前只做預覽模式權限提示。");
      return;
    }

    const viewTarget = event.target.closest("[data-view]");
    if (viewTarget) {
      const templeId = viewTarget.getAttribute("data-temple");
      const visitId = viewTarget.getAttribute("data-visit");
      const sourceType = viewTarget.getAttribute("data-source");
      setView(viewTarget.getAttribute("data-view"), { templeId, visitId, sourceType });
    }

    const detailTarget = event.target.closest("[data-detail]");
    if (detailTarget) {
      setView("templeDetail", { templeId: detailTarget.getAttribute("data-detail") });
    }

    const devoteeDetailTarget = event.target.closest("[data-devotee-detail]");
    if (devoteeDetailTarget) {
      setView("devoteeDetail", { devoteeId: devoteeDetailTarget.getAttribute("data-devotee-detail") });
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

    const teamMemberDetailTarget = event.target.closest("[data-team-member-detail]");
    if (teamMemberDetailTarget) {
      setView("teamMemberDetail", { teamMemberId: teamMemberDetailTarget.getAttribute("data-team-member-detail") });
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
    if (event.target.id === "devoteeSearch") {
      state.devoteeSearch = event.target.value.trim();
      render();
    }
    if (event.target.id === "visitSearch") {
      state.visitSearch = event.target.value.trim();
      render();
    }
    if (event.target.id === "announcementSearch") {
      state.announcementSearch = event.target.value.trim();
      render();
    }
    if (event.target.id === "financeSearch") {
      state.financeSearch = event.target.value.trim();
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
