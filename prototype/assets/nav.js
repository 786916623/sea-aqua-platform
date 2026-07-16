/* 共享侧边栏导航 */
const SITE_LIST = ['全部站点','连江渔排','三沙湾养殖点','罗源湾一号养殖点','鉴江海区养殖点','霞浦鱼井澳养殖点','闽江大学实验室'];
window.SITE_CTX = window.SITE_CTX || localStorage.getItem('siteCtx') || '全部站点';  // 全局站点上下文（顶栏下拉框，跨页持久化）
const NAV = [
  { group: '总览', items: [
    { name: '总览驾驶舱', icon: '🌊', href: 'index.html' },
  ]},
  { group: '数据', items: [
    { name: '水质监测', icon: '💧', href: 'water-quality.html' },
    { name: '养殖站点', icon: '📍', href: 'sites.html' },
    { name: '投喂管理', icon: '🍽️', href: 'feeding.html' },
    { name: '鱼群生物量', icon: '🐟', href: 'biomass.html' },
    { name: '气象海洋', icon: '🌤️', href: 'weather.html' },
    { name: '告警中心', icon: '⚠️', href: 'alerts.html' },
    { name: '报表中心', icon: '📑', href: 'reports.html' },
  ]},
  { group: 'AI 智能', items: [
    { name: 'AI 智能分析', icon: '🤖', href: 'ai-advice.html' },
    { name: 'AI 智能问答', icon: '💬', href: 'ai-chat.html' },
    { name: '智能体配置', icon: '⚙️', href: 'agent.html' },
    { name: '知识库管理', icon: '📚', href: 'knowledge.html' },
  ]},
];

function activeHref(){
  const p = location.pathname.split('/').pop() || 'index.html';
  return p;
}

function renderSidebar(){
  const cur = activeHref();
  let html = `<div class="brand">
    <div class="logo">🐠</div>
    <div><b>智慧海洋养殖</b><small>管控平台 v2 原型</small></div>
  </div>`;
  const GC = {'总览':'go','数据':'gd','AI 智能':'ga'};
  NAV.forEach(g=>{
    const gc = GC[g.group] || '';
    html += `<div class="nav-group"><div class="g-title ${gc}">${g.group}</div>`;
    g.items.forEach(it=>{
      html += `<a class="nav-item ${it.href===cur?'active':''}" href="${it.href}">
        <span class="ic">${it.icon}</span><span>${it.name}</span></a>`;
    });
    html += `</div>`;
  });
  const el = document.getElementById('sidebar');
  if(el) el.innerHTML = html;
}

function topbar(crumbs, sitePicker=true){
  const last = crumbs[crumbs.length-1];
  const trail = crumbs.slice(0,-1).join(' / ');
  let html = `<div class="crumbs">${trail ? trail+' / ' : ''}<b>${last}</b></div>
    <div class="topbar-ticker"><span class="tk-tag">🚨 紧急</span>
      <div class="tk-track"><div class="ticker-content" id="tickerContent"></div></div></div>
    <div class="actions">`;
  if(sitePicker){
    const opts = SITE_LIST.map(s=>`<option ${s===window.SITE_CTX?'selected':''}>${s}</option>`).join('');
    html += `<div class="site-pick">📍 全局范围 <select id="globalSite" onchange="window.SITE_CTX=this.value;localStorage.setItem('siteCtx',this.value);window.dispatchEvent(new Event('sitechange'))" style="border:none;background:transparent;font-size:13px;outline:none;font-weight:600;color:#0284c7">${opts}</select></div>`;
  }
  html += `<span>🔔</span><div class="avatar">U</div></div>`;
  return html;
}

document.addEventListener('DOMContentLoaded', renderSidebar);
document.addEventListener('DOMContentLoaded', renderCopilot);
document.addEventListener('DOMContentLoaded', applySiteFilter);
document.addEventListener('DOMContentLoaded', renderTicker);

/* 紧急事件滚动条（全站悬浮顶部居中） */
const TICKER = [
  ['🔴','连江渔排','DO 3.9mg/L、pH 6.27 异常，疑似传感器故障 → 立即校准'],
  ['🟠','三沙湾养殖点','历史水温 31.2℃，高温应激 → 傍晚投喂、避正午'],
  ['🟡','鉴江海区','盐度 32.10ppt 偏高 → 关注上升'],
  ['🟡','霞浦鱼井澳','历史溶解氧偏低 → 夜间增氧'],
  ['🌊','全局','农历大潮期 → 加强网衣巡检'],
  ['☀️','全局','明日高温 34℃ → 避开正午、防泛塘'],
];
function renderTicker(){
  const box=document.getElementById('tickerContent');
  if(!box) return;   // 顶栏未渲染则跳过
  const items=TICKER.map(x=>`<span class="item">${x[0]} <b>${x[1]}</b> ${x[2]}</span><span class="sep">▪</span>`).join('');
  box.innerHTML = items + items;
}

/* 通用：按全局站点筛选（标记 data-site="站点名" 的元素；支持多站点空格分隔） */
function applySiteFilter(){
  const scope = window.SITE_CTX || '全部站点';
  document.querySelectorAll('[data-site]').forEach(el=>{
    const sites=(el.getAttribute('data-site')||'').split(/\s+/).filter(Boolean);
    el.style.display = (scope==='全部站点' || sites.includes(scope)) ? '' : 'none';
  });
  document.querySelectorAll('[data-scope-label]').forEach(e=> e.textContent = scope);
  document.querySelectorAll('[data-scope-chip]').forEach(e=>{
    e.style.display='inline-block';
    e.textContent='🔍 已筛选：'+scope;
  });
}
window.applySiteFilter = applySiteFilter;
window.addEventListener('sitechange', applySiteFilter);

/* ===== 通用弹框 ===== */
function openModal(title, bodyHTML, opts){
  opts = opts || {};
  closeModal();
  const width = opts.width || 560;
  const foot = opts.foot===false ? '' :
    `<div class="modal-foot"><span class="right-note">${opts.note||''}</span>
       <button class="btn" onclick="closeModal()">取消</button>
       <button class="btn primary" onclick="closeModal();${opts.onSave||''}">${opts.saveText||'保存'}</button></div>`;
  const el = document.createElement('div');
  el.className='modal-mask'; el.id='modalMask';
  el.innerHTML = `<div class="modal" style="width:${width}px">
      <div class="modal-head"><h3>${title}</h3><div class="x" onclick="closeModal()">×</div></div>
      <div class="modal-body">${bodyHTML}</div>${foot}</div>`;
  el.addEventListener('click',e=>{ if(e.target===el) closeModal(); });
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('open'));
}
function closeModal(){ const m=document.getElementById('modalMask'); if(m) m.remove(); }
window.openModal=openModal; window.closeModal=closeModal;

/* 通用：导出弹框 */
function exportData(what){
  const body=`<div class="form-row">
    <div class="field"><label>导出范围</label><select class="select"><option>全部${what||'数据'}</option><option>当前筛选结果</option></select></div>
    <div class="field"><label>时间范围</label><select class="select"><option>近 24 小时</option><option>近 7 天</option><option>近 30 天</option><option>自定义…</option></select></div>
  </div>
  <div class="row-line" style="border:none;padding:6px 0"><span>文件格式</span>
    <select class="select" style="width:auto"><option>Excel (.xlsx)</option><option>CSV</option><option>PDF</option></select></div>
  <div class="note blue" style="margin-top:6px"><span>📥</span><div>点击导出后，文件将生成并提供下载。</div></div>`;
  openModal('📥 导出'+(what||''), body, {width:480, saveText:'导出'});
}
window.exportData=exportData;

/* 通用：一键 AI 分析 */
function quickAI(){
  const body=`<div style="padding:10px 4px">
    <div style="display:flex;align-items:center;gap:10px;color:#0284c7"><span style="font-size:22px">🤖</span><b>正在汇总 6 个站点实时数据并调用大模型…</b></div>
    <div style="height:6px;background:#f1f5f9;border-radius:4px;margin:12px 0;overflow:hidden"><div style="height:100%;width:100%;background:linear-gradient(90deg,#0ea5e9,#14b8a6)"></div></div>
    <div class="ok small">✅ 分析完成 · 共 1 处置 / 1 关注 / 4 正常</div>
    <div class="note" style="margin-top:10px"><span>⚠️</span><div><b>连江渔排</b>：DO 3.9/pH 6.27 疑似传感器故障，建议暂停投喂并校准。</div></div>
    <a href="ai-advice.html" class="btn primary" style="width:100%;justify-content:center;margin-top:12px">查看完整建议 →</a>
  </div>`;
  openModal('🤖 一键 AI 分析', body, {width:460, foot:false});
}
window.quickAI=quickAI;

/* ===== AI 副驾 (copilot) ===== */
const CO_ADVICE_KEY = 'copilot:adviceVersion';   // 已读建议版本
const CO_LATEST_ADVICE = '20260715-1800';        // 当前最新一版定时分析建议（演示固定值）
function adviceUnread(){ return localStorage.getItem(CO_ADVICE_KEY) !== CO_LATEST_ADVICE; }
function markAdviceRead(){ localStorage.setItem(CO_ADVICE_KEY, CO_LATEST_ADVICE); }

function copilotTitle(){
  const map = {
    'index.html':'总览驾驶舱','water-quality.html':'水质监测','sites.html':'养殖站点',
    'feeding.html':'投喂管理','biomass.html':'鱼群生物量','weather.html':'气象海洋',
    'alerts.html':'告警中心','reports.html':'报表中心','ai-advice.html':'AI 智能分析',
    'ai-chat.html':'AI 智能问答','agent.html':'智能体配置','knowledge.html':'知识库','导航.html':'原型导航'
  };
  return map[activeHref()] || '当前页面';
}

let coSite = '全部站点';   // 副驾咨询范围（独立于顶栏全局范围）
function coScope(){ return coSite==='全部站点' ? '全部 6 个站点' : '「'+coSite+'」'; }
function coWelcome(){ return `👋 你好，我是<b>养殖副驾</b>。当前咨询范围：<b>${coScope()}</b>。可结合实时数据给投喂、水质、风险建议。试试 👇`; }

function renderCopilot(){
  if(document.getElementById('copilotFab')) return; // 防重复
  const html = `
  <button class="copilot-fab" id="copilotFab" title="AI 养殖副驾">
    🤖<span class="badge" id="copilotBadge" style="display:none">1</span>
  </button>
  <div class="copilot-panel" id="copilotPanel">
    <div class="copilot-head">
      <div class="ava">🐠</div>
      <div class="ti"><b>AI 养殖副驾</b><small>已接入实时数据 + 大黄鱼知识库</small></div>
      <div class="close" id="copilotClose">✕</div>
    </div>
    <div class="copilot-ctx">
      <span>📍 咨询范围</span>
      <select id="copilotSite" class="copilot-sel"></select>
    </div>
    <div class="copilot-body" id="copilotBody">
      <div class="msg ai" id="coWelcome"><div class="bubble">${coWelcome()}</div></div>
    </div>
    <div class="copilot-suggest" id="copilotSuggest"></div>
    <div class="copilot-input">
      <input id="copilotInput" placeholder="问我投喂量、溶氧、上市时间…" />
      <button id="copilotSend">➤</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const fab = document.getElementById('copilotFab');
  const panel = document.getElementById('copilotPanel');
  const badge = document.getElementById('copilotBadge');
  const body = document.getElementById('copilotBody');
  const input = document.getElementById('copilotInput');
  const suggest = document.getElementById('copilotSuggest');
  const siteSel = document.getElementById('copilotSite');

  // 填充站点选择（含“全部站点”）
  siteSel.innerHTML = SITE_LIST.map(s=>`<option ${s===coSite?'selected':''}>${s}</option>`).join('');
  siteSel.addEventListener('change',()=>{
    coSite = siteSel.value;
    const w = document.getElementById('coWelcome');
    if(w) w.querySelector('.bubble').innerHTML = coWelcome();
    input.placeholder = coSite==='全部站点' ? '问我投喂量、溶氧、上市时间…' : `针对「${coSite}」提问…`;
  });

  const SUGGEST = ['今天该投多少料？','溶解氧偏低怎么办？','这批鱼何时上市？','有无风险提示？'];
  function renderSuggest(){ suggest.innerHTML = SUGGEST.map(s=>`<span class="chip">${s}</span>`).join('');
    suggest.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{input.value=c.textContent;send();})); }

  function refreshBadge(){
    if(adviceUnread()){ badge.style.display='flex'; badge.textContent='1'; fab.classList.add('pulse'); }
    else{ badge.style.display='none'; fab.classList.remove('pulse'); }
  }

  function open(){
    panel.classList.add('open');
    const wasUnread = adviceUnread();
    markAdviceRead(); refreshBadge();
    renderSuggest();
    // 若有未读建议，顶部插入一条新建议通知
    if(wasUnread){
      addMsg('ai',`🔔 <b>你有 1 条新的「每日养殖建议」</b>（07-15 18:00 生成）<br>3 个正常 / 1 关注 / 1 需处置。<a href="ai-advice.html" style="color:#0ea5e9">查看完整建议 →</a>`);
    }
    setTimeout(()=>input.focus(),120);
  }
  function close(){ panel.classList.remove('open'); }
  function toggle(){ panel.classList.contains('open') ? close() : open(); }

  refreshBadge();   // 初始化：仅当有新建议时才亮红点 + 脉冲
  // 进入「AI 分析建议」页 = 已查看 → 标记已读，角标清除
  if(activeHref()==='ai-advice.html' && adviceUnread()){ markAdviceRead(); refreshBadge(); }

  fab.addEventListener('click',toggle);
  document.getElementById('copilotClose').addEventListener('click',close);

  function addMsg(who,text){
    const d=document.createElement('div'); d.className='msg '+who;
    d.innerHTML=`<div class="bubble">${text}</div>`; body.appendChild(d); body.scrollTop=body.scrollHeight;
  }
  function typing(){
    const d=document.createElement('div'); d.className='msg ai'; d.id='ty';
    d.innerHTML=`<div class="bubble"><span class="copilot-typing"><span></span><span></span><span></span></span></div>`;
    body.appendChild(d); body.scrollTop=body.scrollHeight;
  }

  // 简易原型回复（关键词匹配 + 上下文）
  function reply(q){
    const scope = coScope();   // 咨询范围前缀
    const has=(...ks)=>ks.some(k=>q.includes(k));
    if(has('投','喂','料')) return `📊 <b>${scope} 投喂建议</b><br>按水温 25.6℃（最适区）、DO 充足、投喂率 1.5%BW：<br><b>建议 14.0kg / 日，分 2 次（07:00、17:00）</b>。<br>提示：避开夜间低氧期；摄食响应弱则下次下调 10–20%。`;
    if(has('溶解氧','溶氧','DO','缺氧')) return `📊 范围：${scope}<br>⚠️ 当前 DO 偏低。建议：① 暂停投喂；② 夜间开启增氧；③ 凌晨加密巡检防泛塘。<br>注：连江渔排 DO 3.9 与邻站(7–8)系统性背离，疑似<b>传感器故障</b>，需先校准。`;
    if(has('上市','起捕','规格','卖')) return `📊 范围：${scope}<br>🐟 以声纳体长均值 22.6cm、均重 ~503g 看，距常见上市规格(400–500g)已接近，预计 <b>2–3 周</b>内可达规格。建议结合生长曲线(二期)精确预测。`;
    if(has('风险','告警','危险','台风')) return `📊 范围：${scope}<br>🚨 当前 1 条严重(三沙湾水温过高)、7 条关注。<b>未来 24h</b>：明日高温 34℃叠加、农历大潮期，需加强夜间溶氧与网衣巡检。无台风预报。`;
    if(has('pH','酸碱')) return `📊 范围：${scope}<br>🧪 pH 适宜区 7.8–8.5。当前多数站点 ~8.1 正常；<b>连江 6.27 已入危险区</b>，但疑似传感器异常，建议校准。`;
    if(has('盐度','咸')) return `📊 范围：${scope}<br>🧂 盐度适宜区 25–32ppt。三沙湾 31.38、鉴江 32.10 略偏高，关注上升，必要时换水。`;
    if(has('你好','hi','嗨','在吗')) return `👋 在的！当前咨询范围 <b>${scope}</b>。我能帮你算投喂量、判断水质风险、预估上市时间。直接问就行～`;
    return `已收到「${q}」。<br>📊 当前咨询范围 <b>${scope}</b>。我是原型副驾，暂用示例回答；正式版将接入实时数据与大模型。试试：<b>今天该投多少料 / 溶解氧偏低怎么办</b>`;
  }

  function send(){
    const q=(input.value||'').trim(); if(!q) return;
    addMsg('user',q); input.value=''; typing();
    setTimeout(()=>{ const t=document.getElementById('ty'); if(t) t.remove(); addMsg('ai',reply(q)); },650);
  }
  document.getElementById('copilotSend').addEventListener('click',send);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
}
