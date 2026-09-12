const STORAGE_KEY = 'roomie-hub-demo-v1';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultData = {
  bills: [
    { id: 'bill-rent', name: '房租', amount: 2600, payer: '王强', participants: 4, splitType: '均摊', pending: 650, status: '待支付' },
    { id: 'bill-utilities', name: '水电', amount: 420, payer: '李四', participants: 4, splitType: '按实际用量', pending: 180, status: '待支付' },
    { id: 'bill-internet', name: '网费', amount: 128, payer: '张三', participants: 4, splitType: '均摊', pending: 0, status: '已结清' },
    { id: 'bill-cleaning', name: '清洁用品', amount: 196, payer: '王强', participants: 4, splitType: '均摊', pending: 49, status: '待支付' },
  ],
  schedule: [
    { id: 'task-bathroom', title: '卫生间深度清洁', members: ['王强', '张三', '李四'], rotationIndex: 0, startDate: '2026-09-14', time: '20:00', frequency: '每周' },
    { id: 'task-kitchen', title: '厨房大扫除', members: ['李四', '王强', '张三'], rotationIndex: 0, startDate: '2026-09-16', time: '19:30', frequency: '每周' },
    { id: 'task-trash', title: '垃圾分类', members: ['张三', '李四', '王强'], rotationIndex: 0, startDate: '2026-09-18', time: '08:00', frequency: '每周' },
  ],
  items: [
    { id: 'item-tissue', title: '卫生纸', now: 2, min: 4, unit: '包' },
    { id: 'item-detergent', title: '洗洁精', now: 1, min: 3, unit: '瓶' },
    { id: 'item-coffee', title: '咖啡豆', now: 5, min: 2, unit: '包' },
  ],
  rules: [
    { id: 'rule-clean', text: '公共区域每晚 22:00 前保持整洁，避免堆积', level: 'must' },
    { id: 'rule-shared', text: '共享物品使用后必须登记并更新数量', level: 'good' },
    { id: 'rule-power', text: '非自用电器开关要及时关闭，避免浪费', level: 'must' },
  ],
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultData));
}

function normalizeData(data) {
  const fallback = cloneDefaults();
  return {
    bills: Array.isArray(data?.bills) ? data.bills.map((bill) => ({
      id: bill.id || createId(), name: bill.name || '未命名费用', amount: Number(bill.amount) || 0,
      payer: bill.payer || '未记录', participants: Number(bill.participants) || 4,
      splitType: bill.splitType || (bill.method?.includes('实际') ? '按实际用量' : '均摊'),
      splitNote: bill.splitNote || '',
      pending: Number(bill.pending) || 0, status: bill.status || '待支付',
    })) : fallback.bills,
    schedule: Array.isArray(data?.schedule) ? data.schedule.map((task, index) => ({
      id: task.id || createId(), title: task.title || '未命名任务',
      members: Array.isArray(task.members) && task.members.length ? task.members : [task.owner || '待认领'],
      rotationIndex: Number(task.rotationIndex) || 0,
      startDate: task.startDate || `2026-09-${String(14 + index * 2).padStart(2, '0')}`,
      time: task.time || '20:00', frequency: task.frequency || '每周',
    })) : fallback.schedule,
    items: Array.isArray(data?.items) ? data.items.map((item) => ({
      id: item.id || createId(), title: item.title || '未命名物品', now: Math.max(0, Number(item.now) || 0),
      min: Math.max(1, Number(item.min) || 1), unit: item.unit || '件',
    })) : fallback.items,
    rules: Array.isArray(data?.rules) ? data.rules.map((rule) => ({
      id: rule.id || createId(), text: rule.text || '未填写公约', level: rule.level === 'must' ? 'must' : 'good',
    })) : fallback.rules,
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeData(JSON.parse(saved)) : cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

let appData = loadData();
let toastTimer;

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function formatMoney(value) {
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderSummary() {
  const total = appData.bills.reduce((sum, bill) => sum + bill.amount, 0);
  const pending = appData.bills.reduce((sum, bill) => sum + bill.pending, 0);
  const lowStock = appData.items.filter((item) => item.now <= item.min).length;
  const summary = [
    { label: '本月总支出', value: `¥ ${formatMoney(total)}`, note: `共 ${appData.bills.length} 笔费用` },
    { label: '待收款', value: `¥ ${formatMoney(pending)}`, note: pending ? '点击费用可标记结清' : '本月费用已全部结清' },
    { label: '清洁提醒', value: `${appData.schedule.length} 件`, note: '按设定周期自动轮值' },
    { label: '低库存物品', value: `${lowStock} 项`, note: lowStock ? '已达到补货提醒线' : '当前库存充足' },
  ];
  document.getElementById('summary-grid').innerHTML = summary.map((item) => `
    <article class="summary-card"><div class="summary-label"><span>${item.label}</span><span class="tag blue">实时</span></div>
    <div class="summary-value">${item.value}</div><div class="summary-note">${item.note}</div></article>`).join('');
}

function renderBills() {
  document.getElementById('bill-table-body').innerHTML = appData.bills.length ? appData.bills.map((bill) => {
    const method = bill.splitType === '均摊' ? `均摊 ${bill.participants} 人` : `${bill.splitType}${bill.splitNote ? `（${bill.splitNote}）` : ''} · ${bill.participants} 人`;
    return `<tr><td><strong>${escapeHtml(bill.name)}</strong><div class="list-meta">${escapeHtml(bill.payer)} 先行支付</div></td>
      <td>¥ ${formatMoney(bill.amount)}</td><td>${escapeHtml(method)}</td><td>¥ ${formatMoney(bill.pending)}</td>
      <td><div class="list-actions"><span class="status-pill ${bill.status === '已结清' ? 'status-ok' : 'status-warn'}">${bill.status}</span>
      ${bill.status !== '已结清' ? `<button class="secondary-btn" data-action="settle-bill" data-id="${bill.id}">结清</button>` : ''}
      <button class="danger-btn" data-action="delete-bill" data-id="${bill.id}">删除</button></div></td></tr>`;
  }).join('') : '<tr><td colspan="5" class="list-meta">还没有费用记录，点击“新增费用”开始记账。</td></tr>';
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(date);
}

function renderSchedule() {
  document.getElementById('schedule-list').innerHTML = appData.schedule.length ? appData.schedule.map((task) => {
    const owner = task.members[task.rotationIndex % task.members.length];
    return `<div class="list-item"><div class="list-main"><div class="list-title">${escapeHtml(task.title)}</div>
      <div class="list-meta">本轮：${escapeHtml(owner)} · ${formatDate(task.startDate)} ${escapeHtml(task.time)} · ${escapeHtml(task.frequency)}</div></div>
      <div class="list-actions"><span class="tag blue">轮值 ${task.rotationIndex + 1}</span><button class="danger-btn" data-action="delete-schedule" data-id="${task.id}">删除</button></div></div>`;
  }).join('') : '<div class="list-item"><span class="list-meta">暂无值日任务，可以新增一项轮值安排。</span></div>';
}

function renderItems() {
  document.getElementById('items-list').innerHTML = appData.items.length ? appData.items.map((item) => {
    const urgent = item.now <= item.min;
    return `<div class="list-item"><div class="list-main"><div class="list-title">${escapeHtml(item.title)}</div>
      <div class="list-meta">低于或等于 ${item.min} ${escapeHtml(item.unit)}时提醒补货</div></div><div class="list-actions">
      <strong>${item.now} ${escapeHtml(item.unit)}</strong><span class="tag ${urgent ? 'orange' : 'green'}">${urgent ? '需要补货' : '库存正常'}</span>
      <button class="secondary-btn" data-action="consume-item" data-id="${item.id}">−1</button><button class="secondary-btn" data-action="restock-item" data-id="${item.id}">+1</button>
      <button class="danger-btn" data-action="delete-item" data-id="${item.id}">删除</button></div></div>`;
  }).join('') : '<div class="list-item"><span class="list-meta">暂无公共物品，可以登记第一件物品。</span></div>';
}

function renderRules() {
  document.getElementById('rules-list').innerHTML = appData.rules.length ? appData.rules.map((rule) => `
    <li><div class="rule-content"><span>${escapeHtml(rule.text)}</span><span class="priority ${rule.level}">${rule.level === 'must' ? '必须遵守' : '建议遵守'}</span></div>
    <button class="danger-btn" data-action="delete-rule" data-id="${rule.id}">删除</button></li>`).join('')
    : '<li><span class="list-meta">暂无室友公约，可以添加大家共同认可的规则。</span></li>';
}

function render() {
  renderSummary(); renderBills(); renderSchedule(); renderItems(); renderRules();
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  dialog.showModal();
  dialog.querySelector('input, textarea, select')?.focus();
}

function closeDialog(element) {
  element.closest('dialog')?.close();
}

function confirmDelete(collection, id, label) {
  if (!window.confirm(`确定删除这条${label}吗？`)) return;
  appData[collection] = appData[collection].filter((entry) => entry.id !== id);
  saveData(); render(); showToast(`${label}已删除`);
}

document.getElementById('reset-demo').addEventListener('click', () => {
  if (!window.confirm('确定恢复为初始演示数据吗？当前修改将被清除。')) return;
  appData = cloneDefaults(); saveData(); render(); showToast('演示数据已重置');
});

document.getElementById('add-bill').addEventListener('click', () => openDialog('bill-dialog'));
document.getElementById('add-schedule').addEventListener('click', () => openDialog('schedule-dialog'));
document.getElementById('add-item').addEventListener('click', () => openDialog('item-dialog'));
document.getElementById('add-rule').addEventListener('click', () => openDialog('rule-dialog'));
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => closeDialog(button)));
document.querySelectorAll('.dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));

document.getElementById('bill-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const amount = Number(data.get('amount'));
  const participants = Number(data.get('participants'));
  const customShare = Number(data.get('shareAmount'));
  appData.bills.push({ id: createId(), name: data.get('name').trim(), amount, payer: data.get('payer').trim(), participants,
    splitType: data.get('splitType'), splitNote: data.get('splitNote').trim(),
    pending: Number((customShare || amount / participants).toFixed(2)), status: '待支付' });
  saveData(); render(); event.currentTarget.reset(); event.currentTarget.elements.participants.value = 4;
  closeDialog(event.currentTarget); showToast('费用已添加，人均金额已计算');
});

document.getElementById('schedule-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const members = data.get('members').split(/[，,]/).map((name) => name.trim()).filter(Boolean);
  if (!members.length) return;
  appData.schedule.push({ id: createId(), title: data.get('title').trim(), members, rotationIndex: 0,
    startDate: data.get('startDate'), time: data.get('time'), frequency: data.get('frequency') });
  saveData(); render(); event.currentTarget.reset(); event.currentTarget.elements.time.value = '20:00';
  event.currentTarget.elements.startDate.value = new Date().toISOString().slice(0, 10);
  closeDialog(event.currentTarget); showToast('轮值任务已添加');
});

document.getElementById('item-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  appData.items.push({ id: createId(), title: data.get('title').trim(), now: Number(data.get('now')), min: Number(data.get('min')), unit: data.get('unit').trim() });
  saveData(); render(); event.currentTarget.reset(); event.currentTarget.elements.now.value = 1; event.currentTarget.elements.min.value = 2;
  closeDialog(event.currentTarget); showToast('公共物品已登记');
});

document.getElementById('rule-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  appData.rules.push({ id: createId(), text: data.get('text').trim(), level: data.get('level') });
  saveData(); render(); event.currentTarget.reset(); closeDialog(event.currentTarget); showToast('新公约已保存');
});

document.getElementById('rotate-schedule').addEventListener('click', () => {
  if (!appData.schedule.length) return openDialog('schedule-dialog');
  appData.schedule = appData.schedule.map((task) => {
    const nextDate = new Date(`${task.startDate}T00:00:00`);
    if (task.frequency === '每月') nextDate.setMonth(nextDate.getMonth() + 1);
    else nextDate.setDate(nextDate.getDate() + (task.frequency === '每两周' ? 14 : 7));
    return { ...task, rotationIndex: (task.rotationIndex + 1) % task.members.length, startDate: nextDate.toISOString().slice(0, 10) };
  });
  saveData(); render(); showToast('已生成下一轮值日安排');
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'delete-bill') return confirmDelete('bills', id, '费用');
  if (action === 'delete-schedule') return confirmDelete('schedule', id, '排班');
  if (action === 'delete-item') return confirmDelete('items', id, '物品');
  if (action === 'delete-rule') return confirmDelete('rules', id, '公约');
  if (action === 'settle-bill') {
    const bill = appData.bills.find((entry) => entry.id === id);
    if (bill) { bill.pending = 0; bill.status = '已结清'; saveData(); render(); showToast('费用已标记结清'); }
  }
  if (action === 'consume-item' || action === 'restock-item') {
    const item = appData.items.find((entry) => entry.id === id);
    if (item) { item.now = Math.max(0, item.now + (action === 'consume-item' ? -1 : 1)); saveData(); render(); showToast('库存数量已更新'); }
  }
});

document.getElementById('schedule-form').elements.startDate.value = new Date().toISOString().slice(0, 10);
render();
