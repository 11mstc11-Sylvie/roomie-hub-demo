const STORAGE_KEY = 'roomie-hub-demo-v1';

const defaultData = {
  summary: [
    { label: '本月总支出', value: '¥ 3,650', note: '较上月 +12%' },
    { label: '待收款', value: '¥ 1,460', note: '张三、李四尚未结清' },
    { label: '清洁提醒', value: '2 件', note: '本周四前需完成' },
    { label: '低库存物品', value: '3 项', note: '纸巾、洗洁精、咖啡' },
  ],
  bills: [
    {
      name: '房租',
      amount: 2600,
      method: '均摊 4 人',
      pending: 650,
      status: '待支付',
      statusClass: 'status-warn',
    },
    {
      name: '水电',
      amount: 420,
      method: '按实际用量',
      pending: 180,
      status: '待支付',
      statusClass: 'status-warn',
    },
    {
      name: '网费',
      amount: 128,
      method: '均摊 4 人',
      pending: 32,
      status: '已结清',
      statusClass: 'status-ok',
    },
    {
      name: '清洁用品',
      amount: 196,
      method: '均摊 4 人',
      pending: 49,
      status: '待支付',
      statusClass: 'status-warn',
    },
  ],
  schedule: [
    { title: '卫生间深度清洁', owner: '王强', meta: '周一晚 20:00 · 轮值 1', tag: '本周', tagClass: 'blue' },
    { title: '厨房大扫除', owner: '李四', meta: '周三晚 19:30 · 轮值 2', tag: '待跟进', tagClass: 'orange' },
    { title: '垃圾分类', owner: '张三', meta: '周五早 8:00 · 轮值 3', tag: '已完成', tagClass: 'green' },
  ],
  items: [
    { title: '卫生纸', now: 2, min: 4, note: '还剩 2 包，建议补货', urgent: true },
    { title: '洗洁精', now: 1, min: 3, note: '库存不足，请尽快采购', urgent: true },
    { title: '咖啡豆', now: 5, min: 2, note: '充足，可继续使用', urgent: false },
  ],
  rules: [
    { text: '公共区域每晚 22:00前保持整洁，避免堆积', level: 'must' },
    { text: '共享物品使用后必须登记到物品表并标记状态', level: 'good' },
    { text: '非自用电器开关要及时关闭，避免高峰时段浪费', level: 'must' },
  ],
};

let appData = loadData();

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(defaultData);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function renderSummary() {
  const grid = document.getElementById('summary-grid');
  grid.innerHTML = appData.summary
    .map(
      (item) => `
        <article class="summary-card">
          <div class="summary-label">
            <span>${item.label}</span>
            <span class="tag blue">Live</span>
          </div>
          <div class="summary-value">${item.value}</div>
          <div class="summary-note">${item.note}</div>
        </article>
      `,
    )
    .join('');
}

function renderBills() {
  const tbody = document.getElementById('bill-table-body');
  tbody.innerHTML = appData.bills
    .map(
      (bill) => `
        <tr>
          <td>${bill.name}</td>
          <td>¥ ${bill.amount.toLocaleString()}</td>
          <td>${bill.method}</td>
          <td>¥ ${bill.pending.toLocaleString()}</td>
          <td>
            <span class="status-pill ${bill.statusClass}">${bill.status}</span>
          </td>
        </tr>
      `,
    )
    .join('');
}

function renderSchedule() {
  const container = document.getElementById('schedule-list');
  container.innerHTML = appData.schedule
    .map(
      (item) => `
        <div class="list-item">
          <div class="list-main">
            <div class="list-title">${item.title}</div>
            <div class="list-meta">${item.owner} · ${item.meta}</div>
          </div>
          <span class="tag ${item.tagClass}">${item.tag}</span>
        </div>
      `,
    )
    .join('');
}

function renderItems() {
  const container = document.getElementById('items-list');
  container.innerHTML = appData.items
    .map(
      (item) => `
        <div class="list-item">
          <div class="list-main">
            <div class="list-title">${item.title}</div>
            <div class="list-meta">${item.note}</div>
          </div>
          <div class="list-main">
            <div class="list-title">${item.now}/${item.min}</div>
            <div class="list-meta">库存阈值</div>
          </div>
          <span class="tag ${item.urgent ? 'orange' : 'green'}">${item.urgent ? '提醒补货' : '正常'}</span>
        </div>
      `,
    )
    .join('');
}

function renderRules() {
  const rulesList = document.getElementById('rules-list');
  rulesList.innerHTML = appData.rules
    .map(
      (rule) => `
        <li>
          <span>${rule.text}</span>
          <span class="priority ${rule.level === 'must' ? 'must' : 'good'}">
            ${rule.level === 'must' ? '必须遵守' : '建议遵守'}
          </span>
        </li>
      `,
    )
    .join('');
}

function render() {
  renderSummary();
  renderBills();
  renderSchedule();
  renderItems();
  renderRules();
}

document.getElementById('reset-demo').addEventListener('click', () => {
  appData = structuredClone(defaultData);
  saveData();
  render();
});

document.getElementById('add-bill').addEventListener('click', () => {
  appData.bills.push({
    name: '新增费用',
    amount: 120,
    method: '均摊 4 人',
    pending: 30,
    status: '待支付',
    statusClass: 'status-warn',
  });
  saveData();
  render();
});

document.getElementById('rotate-schedule').addEventListener('click', () => {
  appData.schedule = [
    { title: '卫生间深度清洁', owner: '张三', meta: '周一晚 20:00 · 轮值 1', tag: '本周', tagClass: 'blue' },
    { title: '厨房大扫除', owner: '王强', meta: '周三晚 19:30 · 轮值 2', tag: '待跟进', tagClass: 'orange' },
    { title: '垃圾分类', owner: '李四', meta: '周五早 8:00 · 轮值 3', tag: '已完成', tagClass: 'green' },
  ];
  saveData();
  render();
});

document.getElementById('add-item').addEventListener('click', () => {
  appData.items.push({
    title: '新物品',
    now: 1,
    min: 2,
    note: '请提前补货',
    urgent: true,
  });
  saveData();
  render();
});

document.getElementById('add-rule').addEventListener('click', () => {
  appData.rules.push({
    text: '新增公约：共享活动前先沟通时间与预算',
    level: 'good',
  });
  saveData();
  render();
});

render();
