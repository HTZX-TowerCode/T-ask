/* ============================================================
 *  程序逻辑 —— 一般不用改
 *  所有能改的内容都在 questions.js 里
 * ============================================================ */

const CONFIG = window.QUIZ_CONFIG;
const TEXTS  = window.QUIZ_TEXTS;
const RANKS  = window.QUIZ_RANKS;
const THEMES = window.QUIZ_THEMES;
const BANK   = window.QUESTION_BANK;
const ADMINS = (window.QUIZ_ADMINS || []).map(s => normName(s));

const $ = s => document.querySelector(s);
const LS_PROGRESS = "teacher_quiz_progress_v1";
const LS_THEME    = "teacher_quiz_theme_v1";
const LS_NAME     = "teacher_quiz_name_v1";
const LS_HISTORY  = "teacher_quiz_history_v1";

let state = null, timerId = null, curTheme = "sport", locked = false;
let isAdmin = false, durationMin = CONFIG.durationMinutes, unlimited = false;
let viewing = null;   // null = 正常答题；数字 = 正在回看第 n 题（只读）

/* ==================== 小工具 ==================== */
function normName(s){ return String(s==null?"":s).replace(/\s+/g,"").toLowerCase(); }
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const byId = id => BANK.find(q => String(q.id) === String(id));
const esc  = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt  = ms => { ms=Math.max(0,ms); const s=Math.floor(ms/1000); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };
const stamp= ts => { const d=new Date(ts),p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); };
const signed = n => (n>0?"+":"") + n;
const fill = (t, map) => String(t).replace(/\{(\w+)\}/g, (m,k)=> map[k]!=null ? map[k] : m);

function toast(msg, ms=2600){
  const old = document.querySelector(".toast"); if(old) old.remove();
  const t = document.createElement("div"); t.className="toast"; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), ms);
}
/* ============================================================
 *  150 分制：全程使用归一化后的分数存储与运算
 *  ------------------------------------------------------------
 *  核心原则：state.score 里存的永远是 150 分制下的分数，
 *  而不是"题库原始分值之和"。任何时刻读到 state.score，
 *  它都天然落在 [0, FULL] 区间。
 *
 *  做法：抽题时一次性把 150 分"分配"到每道题、每个选项，
 *  用"最大余数法"（Hamilton / Hare–Niemeyer 分配法）保证
 *  所有数值之和严格等于 FULL（150）。答题时只是按选中的
 *  选项查表取值、累加，不再做任何四舍五入，因此中途分数
 *  与最终总分都能精确落在 150 分制内，且全对恒为 150。
 *  ------------------------------------------------------------
 *  题目原始分值只用于：① 抽题时决定分值分配比例；② 页面
 *  上显示"+5 分"这类反馈文字。原始分不进入 state.score。
 * ============================================================ */
const FULL = 150;

/* 最大余数法：把 total 个整数单位，按 weights 的比例分配成整数数组，
 * 返回数组之和严格等于 total。 */
function hareNiemeyer(weights, total){
  const n = weights.length;
  if (total <= 0 || n === 0) return weights.map(()=> 0);
  const exact = weights.map(w=> (w < 0 ? 0 : w) * total);
  const sumW = exact.reduce((a,b)=> a + b, 0);
  const scaled = sumW > 0 ? exact.map(e=> e / sumW * total) : weights.map(()=> total / n);
  const out = scaled.map(v=> Math.floor(v));
  let rest = total - out.reduce((a,b)=> a + b, 0);
  const fracs = scaled.map((v,i)=> ({ i, f: v - Math.floor(v) }));
  fracs.sort((a,b)=> b.f - a.f || b.v - a.v);
  if (rest > 0){ for (let k = 0; k < rest; k++) out[fracs[k].i]++; }
  else if (rest < 0){
    for (let k = 0; k < -rest; k++){
      const idx = fracs[fracs.length - 1 - k].i;
      out[idx] = Math.max(0, out[idx] - 1);
    }
  }
  return out;
}

/* 计算一道题的原始满分（用于确定分值分配比例） */
function rawMaxOf(q){
  if (!q || !q.options || !q.options.length) return 0;
  const multi = (q.type === "多选" || q.type === "不定项");
  if (multi) return q.options.reduce((s,o)=> s + (Number(o.score) || 0), 0);
  let best = 0;
  q.options.forEach(o=>{ const sc = Number(o.score) || 0; if (sc > best) best = sc; });
  return best;
}

/* 本套卷的原始满分 */
function calcMaxScore(ids){
  let m = 0;
  ids.forEach(id=>{ m += rawMaxOf(byId(id)); });
  return m;
}

/* 抽题时构建 150 分制分值表：
 *   slot[id]     —— 该题分到的 150 分制分值（整数）
 *   optScore[id] —— 该题各选项的 150 分制分值（整数数组，下标=原始选项下标）
 * 两处之和都严格等于 FULL。 */
function buildNorm(ids){
  const rawMax = {};
  ids.forEach(id=>{
    const rm = rawMaxOf(byId(id));
    rawMax[id] = rm;
  });
  // 第一步：150 分按每题原始满分的比例分到各题
  const slots = hareNiemeyer(ids.map(id=> rawMax[id]), FULL);
  const slot = {};
  const optScore = {};
  ids.forEach((id,i)=>{
    slot[id] = slots[i];
    const q = byId(id);
    const weights = (q.options || []).map(o=> Number(o.score) || 0);
    let os = hareNiemeyer(weights, slots[i]);
    // 修正：选项含负分时 H-N 可能让选项之和与 slot 有偏差，补到绝对值最大的选项上
    const sumOs = os.reduce((a,b)=> a + b, 0);
    if (sumOs !== slots[i]){
      let idx = 0, mx = -1;
      os.forEach((v,j)=>{ if (Math.abs(v) > mx){ mx = Math.abs(v); idx = j; } });
      os[idx] += (slots[i] - sumOs);
    }
    optScore[id] = os;
  });
  return { rawMax, slot, optScore };
}

/* 段位称号：直接按 150 分制绝对分评定 */
function rankOf(score){
  const disp = Math.max(0, Math.min(FULL, Math.round(score)));
  for (const [line,name] of RANKS) if (disp >= line) return name;
  return RANKS[RANKS.length-1][1];
}

/* 显示用的「得分 / 150 分」字符串（满分恒为 FULL） */
const slash = score => signed(score) + " / " + FULL;

/* 得分率百分比（0~100），用于进度条/百分比小标签 */
function scorePercent(score){
  if (score <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(score / FULL * 100)));
}

/* 偷看扣分的 150 分制折算：按该卷分值池比例，把"第 n 次"折算成扣多少分。
 * 保证扣分发生在 150 分制内，且第 1 次至少扣 1 分。 */
function peekCost(qid, n){
  const optScore = (state && state.norm && state.norm.optScore && state.norm.optScore[qid]) || [];
  // 该题分值池规模（绝对值之和），用于确定"扣 1 分原始"对应 150 分制里几分
  let pool = 0;
  optScore.forEach(v=>{ pool += Math.abs(Number(v) || 0); });
  if (pool <= 0) return 1;
  const normed = Math.round(n * (FULL / Math.max(state.maxScore, 1)));
  return Math.max(1, normed);
}

const kebab = s => s.replace(/[A-Z]/g, m => "-"+m.toLowerCase());

/* ==================== 主题 ==================== */
function injectThemeCss(){
  let css = "";
  for (const [key, t] of Object.entries(THEMES)){
    const decls = Object.entries(t.vars).map(([n,v]) => "--"+kebab(n)+":"+v+";").join("");
    css += `body[data-theme="${key}"]{${decls}}`;
  }
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
}
function setTheme(key){
  curTheme = THEMES[key] ? key : Object.keys(THEMES)[0];
  document.body.dataset.theme = curTheme;
  try{ localStorage.setItem(LS_THEME, curTheme); }catch(e){}
  document.querySelectorAll("#themeMenu button").forEach(b => b.classList.toggle("active", b.dataset.k===curTheme));
}
function buildThemeMenu(){
  const box = $("#themeMenu"); box.innerHTML = "";
  Object.entries(THEMES).forEach(([k,v])=>{
    const b = document.createElement("button");
    b.textContent = v.label; b.dataset.k = k;
    b.onclick = ()=>{ setTheme(k); box.classList.remove("open"); };
    box.appendChild(b);
  });
}
$("#themeBtn").onclick = e => { e.stopPropagation(); $("#themeMenu").classList.toggle("open"); };
document.addEventListener("click", ()=> $("#themeMenu").classList.remove("open"));

/* ==================== 存档 ==================== */
function newState(name){
  const need = Math.min(CONFIG.totalQuestions, BANK.length);
  if (BANK.length < CONFIG.totalQuestions){
    if (!confirm(fill(TEXTS.lowBankWarn, {n:BANK.length, need:CONFIG.totalQuestions}))) throw new Error("题库不足");
  }
  const ids = shuffle(BANK.map(q => String(q.id))).slice(0, need);
  const now = Date.now();
  const maxScore = calcMaxScore(ids);   // 本套卷满分（原始分值口径），抽定即固定
  const norm = buildNorm(ids);           // 150 分制分值表（slot + optScore）
  return { v:1, name:name||"", admin:isAdmin,
           order:ids, optOrder:buildOptOrder(ids), answers:{}, index:0, score:0,
           maxScore:maxScore, norm:norm,
           peeked:[], peekCount:0, peekPenalty:0,
           startedAt:now,
           deadline: unlimited ? now + 1000*60*60*24*365 : now + durationMin*60000,
           unlimited: !!unlimited, duration: unlimited ? 0 : durationMin,
           fired:[], finished:false, finishedAt:null, forced:false };
}
function save(){ try{ localStorage.setItem(LS_PROGRESS, JSON.stringify(state)); }catch(e){} }
function load(){
  try{
    const s = JSON.parse(localStorage.getItem(LS_PROGRESS));
    if (!s || !s.order) return null;
    /* 旧存档迁移：此前版本 state.score 存的是原始分值（非 150 分制），
     * 且没有 alloc/rawMax。这里按当时存档里的 maxScore 反推一个近似
     * 比例，让旧进度能继续答题而不崩；精度不如新抽卷，但足够过渡。 */
    if (!s.alloc && s.maxScore && s.maxScore > 0 && FULL !== s.maxScore){
      const ratio = FULL / s.maxScore;
      s.score = Math.round((Number(s.score) || 0) * ratio);
      Object.keys(s.answers || {}).forEach(k=>{
        const a = s.answers[k];
        if (a && a.delta !== undefined){
          a.rawDelta = Number(a.rawDelta) || a.delta;
          a.delta = Math.round((Number(a.rawDelta) || a.delta) * ratio);
        }
      });
      if (s.peekPenalty) s.peekPenalty = Math.round((Number(s.peekPenalty) || 0) * ratio);
    }
    return s;
  }catch(e){ return null; }
}

/* 选项显示顺序：每位老师各自随机，一旦生成就固定下来（保证续答、回顾一致） */
function buildOptOrder(ids){
  const o = {};
  ids.forEach(id=>{
    const q = byId(id);
    const n = (q && q.options) ? q.options.length : 0;
    o[id] = CONFIG.shuffleOptions === false ? [...Array(n).keys()] : shuffle([...Array(n).keys()]);
  });
  return o;
}
/* 原始选项下标 → 屏幕上显示的字母 */
function letterOf(qid, origIdx){
  const perm = (state && state.optOrder && state.optOrder[qid]) || [];
  const i = perm.indexOf(Number(origIdx));
  return String.fromCharCode(65 + (i < 0 ? Number(origIdx) : i));
}

function pushHistory(rec){
  try{
    const h = JSON.parse(localStorage.getItem(LS_HISTORY) || "[]");
    h.unshift(rec);
    localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0,30)));
  }catch(e){}
}
function getHistory(){ try{ return JSON.parse(localStorage.getItem(LS_HISTORY) || "[]"); }catch(e){ return []; } }

/* ==================== 屏幕切换 ==================== */
function show(name){
  ["start","quiz","result"].forEach(n => $("#screen-"+n).classList.toggle("hide", n!==name));
  $("#timer").classList.toggle("hide", name!=="quiz");
  $("#scoreBar").classList.toggle("hide", name!=="quiz");
}

/* 顶部分数徽章 */
let lastScore = null;
function updateScoreBar(animate){
  if (!state) return;
  $("#scoreNum").textContent = slash(state.score);   // 150 分制：得分 / 150
  $("#scoreBar").classList.toggle("minus", state.score < 0);
  if (animate && lastScore !== null && state.score !== lastScore){
    $("#scoreBar").classList.add("bump");
    setTimeout(()=> $("#scoreBar").classList.remove("bump"), 220);
  }
  lastScore = state.score;
}

/* ==================== 开局页 ==================== */
function initStart(){
  $("#brand").textContent = CONFIG.schoolName + " · " + CONFIG.title;
  $("#startTitle").textContent = CONFIG.title;
  $("#startSub").textContent   = CONFIG.subtitle;
  $("#btnStart").textContent   = TEXTS.btnStart;
  $("#discTitle").textContent  = TEXTS.discTitle;
  $("#discSerious").innerHTML  = "<ul>" + TEXTS.disclaimerSerious.map(t=>"<li>"+esc(t)+"</li>").join("") + "</ul>";
  $("#discFunny").innerHTML    = "<ul>" + TEXTS.disclaimerFunny.map(t=>"<li>"+esc(t)+"</li>").join("") + "</ul>";
  $("#startFoot").innerHTML    = fill(TEXTS.startFootnote, {total:Math.min(CONFIG.totalQuestions,BANK.length), min:CONFIG.durationMinutes});

  $("#nameLabel").textContent       = TEXTS.nameLabel;
  $("#nameInput").placeholder       = TEXTS.namePlaceholder;
  $("#nameHint").textContent        = TEXTS.nameHint;

  $("#adminBadge").textContent   = TEXTS.adminBadge;
  $("#adminTimeLabel").textContent = TEXTS.adminTimeLabel;
  $("#btnPeek").textContent      = TEXTS.adminPeek;
  $("#btnPeek2").textContent     = TEXTS.adminPeek;
  $("#btnUnlimited").textContent = TEXTS.adminTimeUnlimited;
  $("#btnPeekClose").textContent = TEXTS.adminPeekClose;

  $("#themeBtn").textContent = TEXTS.btnTheme;
  $("#btnPng").textContent   = TEXTS.btnPng;
  $("#btnCopy").textContent  = TEXTS.btnCopy;
  $("#btnCsv").textContent   = TEXTS.btnCsv;
  $("#btnJson").textContent  = TEXTS.btnJson;
  $("#btnReset").textContent = TEXTS.btnReset;
  $("#btnReview").textContent= TEXTS.adminReview;
  $("#btnRedo").textContent  = TEXTS.adminRedo;
  $("#btnPeekQ").textContent = TEXTS.peekBtn;
  $("#peekWarn").textContent = TEXTS.peekWarn;
  $("#btnPeekQClose").textContent = TEXTS.adminPeekClose;
  $("#scoreBar").firstChild.textContent = TEXTS.scoreLabel + " ";
  $("#resultFoot").textContent = TEXTS.footNote;

  try{ const n = localStorage.getItem(LS_NAME); if(n) $("#nameInput").value = n; }catch(e){}
  refreshAdminPanel();
}

/* 姓名变化 → 判断是否管理员 */
function refreshAdminPanel(){
  const raw = $("#nameInput").value || "";
  isAdmin = ADMINS.includes(normName(raw));
  $("#adminBox").classList.toggle("hide", !isAdmin);
  if (isAdmin){
    $("#adminWelcome").textContent = fill(TEXTS.adminWelcome, {name: raw.trim()});
    if (!$("#adminTimeInput").value) $("#adminTimeInput").value = durationMin;
    $("#btnUnlimited").classList.toggle("on", unlimited);
    $("#btnUnlimited").textContent = unlimited ? TEXTS.adminTimeApply : TEXTS.adminTimeUnlimited;
    $("#adminTimeInput").disabled = unlimited;
  }
}
$("#nameInput").addEventListener("input", refreshAdminPanel);
$("#nameInput").addEventListener("keydown", e=>{ if(e.key === "Enter") $("#btnStart").click(); });

/* 管理员：时间设置 */
$("#adminTimeInput").addEventListener("change", ()=>{
  const v = parseInt($("#adminTimeInput").value, 10);
  if (!v || v < 1){ $("#adminTimeInput").value = durationMin; return; }
  durationMin = v; unlimited = false; refreshAdminPanel();
  toast(fill(TEXTS.adminTimeSaved, {min:v}));
});
$("#btnUnlimited").onclick = ()=>{
  unlimited = !unlimited; refreshAdminPanel();
  toast(unlimited ? TEXTS.adminTimeOff : fill(TEXTS.adminTimeSaved, {min:durationMin}));
};

/* 管理员：题库检视 */
function openPeek(){
  $("#peekTitle").textContent = fill(TEXTS.adminPeekTitle, {n:BANK.length});
  $("#peekTip").textContent   = TEXTS.adminPeekTip;
  $("#peekBody").innerHTML = BANK.map((q,i)=>{
    const tag = (q.contentTag||"") + (q.contentTag && q.type ? " · " : "") + (q.type||"");
    const opts = (q.options||[]).map((o,j)=>{
      const sc = Number(o.score)||0;
      const cls = sc>0 ? "up" : sc<0 ? "down" : "zero";
      return '<div class="peek-opt"><span class="k">'+ String.fromCharCode(65+j) +'.</span>'
           + '<span><span class="s '+ cls +'">'+ signed(sc) +'</span> '+ esc(o.text)
           + (o.feedback ? '<br><span class="f">→ '+ esc(o.feedback) +'</span>' : '')
           + '</span></div>';
    }).join("");
    return '<div class="peek-item">'
      + '<p class="peek-q">'+ (i+1) +'. '+ esc(q.text) +'</p>'
      + '<div class="peek-meta">'+ esc(tag) + ' ｜ ' + (q.options||[]).length + ' 个选项'
      + (CONFIG.shuffleOptions === false ? '' : '（答题时顺序随机）')
      + (q.secretTag ? ' ｜ 彩蛋：'+ esc(q.secretTag) : '')
      + (q.image ? ' ｜ 配图：'+ esc(q.image) : '') +'</div>'
      + opts
      + (q.comment ? '<div class="peek-cmt">💬 '+ esc(q.comment) +'</div>' : '')
      + '</div>';
  }).join("");
  $("#peekModal").classList.remove("hide");
}
$("#btnPeek").onclick  = openPeek;
$("#btnPeek2").onclick = openPeek;
$("#btnPeekClose").onclick = ()=> $("#peekModal").classList.add("hide");
$("#peekModal").onclick = e => { if (e.target.id === "peekModal") $("#peekModal").classList.add("hide"); };

/* 开始答题 */
$("#btnStart").onclick = ()=>{
  const raw = ($("#nameInput").value || "").trim();
  if (!raw){ toast(TEXTS.nameEmpty); $("#nameInput").focus(); return; }
  try{ localStorage.setItem(LS_NAME, raw); }catch(e){}
  try{ state = newState(raw); }catch(e){ return; }
  save(); lastScore = 0; updateScoreBar(false); startTimer(); renderQuestion(); show("quiz");
};

/* ==================== 倒计时 ==================== */
function startTimer(){ clearInterval(timerId); timerId = setInterval(tick, 250); tick(); }
function tick(){
  if (!state || state.finished){ clearInterval(timerId); return; }
  const el = $("#timer");
  if (state.unlimited){ el.textContent = TEXTS.timerOff; el.classList.remove("warn","danger"); return; }
  const left = state.deadline - Date.now();
  el.textContent = fmt(left);
  el.classList.toggle("warn",   left<=300000 && left>60000);
  el.classList.toggle("danger", left<=60000);
  CONFIG.checkpoints.forEach(m=>{
    if (left <= m*60000 && left > m*60000-1500 && !state.fired.includes(m)){
      state.fired.push(m); save();
      toast(m===1 ? TEXTS.lastMinute : fill(TEXTS.timerToast, {m}));
    }
  });
  if (left <= 0) finish(true);
}

/* ==================== 渲染题目 ==================== */
function renderQuestion(){
  viewing = null;
  // 跳过所有已答的题，保证停在第一道未答题上（防止回看返回后重复作答）
  while (state.index < state.order.length && state.answers[String(state.order[state.index])]) state.index++;
  save();
  if (state.index >= state.order.length){ finish(false); return; }
  renderAt(state.index, false);
}

function renderAt(idx, readonly){
  locked = !!readonly;
  const q = byId(state.order[idx]);
  if (!q){ finish(false); return; }
  const multi = (q.type === "多选" || q.type === "不定项");
  const qid = String(q.id);
  const a = state.answers[qid];

  $("#tagBox").innerHTML = (q.secretTag && String(q.secretTag).trim())
    ? '<span class="tag secret">'+ esc(TEXTS.secretBefore + q.secretTag) +'</span>'
    : (q.contentTag ? '<span class="tag">'+esc(q.contentTag)+'</span>' : '')
    + (q.type ? '<span class="tag">'+esc(q.type)+'</span>' : '');

  const pct = scorePercent(state.score);
  $("#progText").textContent = fill(TEXTS.progressText,
      {n:idx+1, total:state.order.length, score:slash(state.score), pct:pct});
  $("#progBar").style.width  = (idx / state.order.length * 100) + "%";

  // 题号导航
  renderNav(idx);

  // 回看提示条
  const tip = $("#reviewTip");
  if (readonly){
    tip.classList.remove("hide");
    tip.textContent = fill(TEXTS.reviewTip, {n: idx+1});
  } else tip.classList.add("hide");

  const img = $("#qImage");
  if (q.image){ img.src = q.image; img.classList.remove("hide"); img.onerror = ()=>img.classList.add("hide"); }
  else { img.classList.add("hide"); img.removeAttribute("src"); }

  $("#qText").textContent = q.text;

  const box = $("#options"); box.innerHTML = "";
  const perm = (state.optOrder && state.optOrder[qid]) || [...Array((q.options||[]).length).keys()];
  perm.forEach((origIdx, i)=>{
    const op = q.options[origIdx];
    const b = document.createElement("button");
    b.className = "opt"; b.type = "button"; b.dataset.i = origIdx;
    b.innerHTML = '<span class="mark">'+ String.fromCharCode(65+i) +'</span><span>'+ esc(op.text) +'</span>';
    b.onclick = ()=>{
      if (locked) return;
      if (multi) b.classList.toggle("sel");
      else { box.querySelectorAll(".opt").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); }
      syncSubmitLabel();
    };
    box.appendChild(b);
  });

  // 回看：还原当时的作答状态
  if (readonly && a){
    const chosen = a.sel || [];
    const optScore = (state.norm && state.norm.optScore && state.norm.optScore[qid]) || [];
    box.querySelectorAll(".opt").forEach(el=>{
      const i = Number(el.dataset.i), sc = Number(optScore[i]) || 0;
      el.classList.add("locked");
      if (chosen.includes(i)){
        el.classList.toggle("sel", true);
        el.classList.add(sc > 0 ? "right" : "wrong");
        const chip = document.createElement("span");
        chip.className = "scorechip " + (sc>0?"up":sc<0?"down":"zero");
        chip.textContent = signed(sc) + " 分";
        el.appendChild(chip);
      }
    });
    $("#fbBox").innerHTML = buildFeedback(q, a.sel, a.delta);
  } else {
    $("#fbBox").innerHTML = "";
  }

  // 按钮区
  $("#btnSubmit").disabled = false;          // 允许不选直接提交
  $("#btnSubmit").textContent = readonly
    ? fill(TEXTS.backToCurrent, {n: state.index+1})
    : TEXTS.btnSubmit;
  if (!readonly) syncSubmitLabel();

  // 偷看按钮
  const peekBtn = $("#btnPeekQ");
  peekBtn.classList.toggle("hide", readonly || !!a);
  peekBtn.disabled = false;

  updateScoreBar(false);
  window.scrollTo({top:0, behavior:"smooth"});
}

/* 一个都没选时把按钮文案改掉，避免误点 */
function syncSubmitLabel(){
  const n = document.querySelectorAll("#options .opt.sel").length;
  $("#btnSubmit").textContent = n ? TEXTS.btnSubmit : TEXTS.btnSubmitEmpty;
}

function renderNav(idx){
  const nav = $("#qnav"); nav.innerHTML = "";
  state.order.forEach((id, i)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = i+1;
    const done = !!state.answers[String(id)];
    if (i === state.index) b.className = "now";
    else if (done) b.className = "done";
    if (viewing === i) b.classList.add("viewing");
    b.title = done ? TEXTS.navDone : TEXTS.navUndone;
    b.onclick = ()=>{
      if (i === state.index){ viewing = null; renderAt(i, false); return; }
      if (!done){ toast(TEXTS.navLocked); return; }
      viewing = i; renderAt(i, true);
    };
    nav.appendChild(b);
  });
  const hint = document.querySelector(".navhint") || Object.assign(document.createElement("p"), {className:"navhint"});
  hint.textContent = TEXTS.navHint;
  nav.after(hint);
}

/* ==================== 提交 / 下一题 ==================== */
$("#btnSubmit").addEventListener("click", ()=>{
  if (viewing !== null){ renderQuestion(); return; }   // 回看中 → 回到当前题
  locked ? doNext() : doSubmit();
});

function doSubmit(){
  const q = byId(state.order[state.index]);
  const qid = String(q.id);
  const sel = [...document.querySelectorAll("#options .opt.sel")].map(el => Number(el.dataset.i));
  locked = true;   // 不选也可以提交，sel 可能为空

  // 该题得分 = 所选各选项的 150 分制分值之和（抽题时已分配好，直接查表累加）
  const optScore = (state.norm && state.norm.optScore && state.norm.optScore[qid]) || [];
  let delta = 0;
  sel.forEach(i=>{ delta += (Number(optScore[i]) || 0); });
  state.answers[qid] = { sel, delta, qtext:q.text, ts:Date.now() };
  state.score += delta;
  if (state.score > FULL) state.score = FULL;     // 累加兜底（理论上不触发）
  save();
  updateScoreBar(true);

  document.querySelectorAll("#options .opt").forEach(el=>{
    const i = Number(el.dataset.i), chosen = sel.includes(i), sc = Number(optScore[i]) || 0;
    el.classList.add("locked");
    if (chosen){
      el.classList.add(sc > 0 ? "right" : "wrong");
      const chip = document.createElement("span");
      chip.className = "scorechip " + (sc>0?"up":sc<0?"down":"zero");
      chip.textContent = signed(sc) + " 分";
      el.appendChild(chip);
    }
  });

  $("#fbBox").innerHTML = buildFeedback(q, sel, delta);
  $("#btnPeekQ").classList.add("hide");
  $("#btnSubmit").textContent = (state.index >= state.order.length-1) ? TEXTS.btnResult : TEXTS.btnNext;
}

function buildFeedback(q, sel, delta){
  const qid = String(q.id);
  const optScore = (state.norm && state.norm.optScore && state.norm.optScore[qid]) || [];
  const lines = sel.length
    ? sel.map(i=>{
        const op = q.options[i], raw = Number(op.score)||0, sc = Number(optScore[i]) || 0;
        const color = raw>0 ? "var(--ok)" : raw<0 ? "var(--bad)" : "var(--sub)";
        return '<p class="fb-line"><b>'+ letterOf(qid, i) +'. '+ esc(op.text) +'</b>　'
          + '<span style="color:'+color+';font-weight:700">'+ signed(sc) +' 分</span><br>' + esc(op.feedback||"") + '</p>';
      }).join("")
    : '<p class="fb-line">'+ esc(TEXTS.noneChosen) +'</p>';

  const realTag = (q.contentTag||"") + (q.contentTag && q.type ? " · " : "") + (q.type||"");
  const reveal = (q.secretTag && String(q.secretTag).trim())
    ? '<div class="fb-real">'+ esc(TEXTS.secretReveal) +'<span>'+ esc(realTag) +'</span>'+ esc(TEXTS.secretSuffix) +'</div>' : "";

  const pct = scorePercent(state.score);
  return '<div class="feedback">'
    + '<div class="fb-head"><span class="fb-delta '+(delta>0?"up":delta<0?"down":"")+'">'+ signed(delta) +' 分</span>'
    + '<span class="fb-total">累计 '+ slash(state.score)
    + '　<span style="color:var(--primary);font-weight:700">'+ pct +'%</span></span></div>'
    + lines
    + (q.comment ? '<div class="fb-comment">'+ esc(TEXTS.commentMark) + esc(q.comment) +'</div>' : "")
    + reveal + '</div>';
}
function doNext(){
  state.index++; save();
  if (state.index >= state.order.length){ finish(false); return; }
  renderQuestion();
}

/* ==================== 结束 & 成绩单 ==================== */
function finish(forced){
  clearInterval(timerId);
  state.finished = true; state.forced = !!forced; state.finishedAt = Date.now();
  save();
  pushHistory({
    name: state.name, score: state.score,
    n: Object.keys(state.answers).length, total: state.order.length,
    max: FULL,
    pct: scorePercent(state.score),
    time: state.finishedAt - state.startedAt, ts: state.finishedAt
  });
  renderResult(); show("result");
}
function renderResult(){
  const answered = Object.keys(state.answers).length;
  const used = state.finishedAt - state.startedAt;
  const pct = scorePercent(state.score);

  $("#forceTip").innerHTML = state.forced ? '<div class="warnbox">'+ esc(TEXTS.forceTip) +'</div>' : "";
  $("#resultTitle").textContent = TEXTS.resultTitle;
  $("#resultSub").textContent   = fill(TEXTS.resultWho, {name: state.name || "匿名"});

  const sb = $("#scoreBig");
  sb.textContent = slash(state.score);          // 150 分制：得分 / 150
  sb.className = "score-big " + (state.score>0?"up":state.score<0?"down":"");
  $("#rankText").textContent = rankOf(state.score) + "（满分 " + FULL + " 分）";
  $("#statRow").innerHTML =
      '<div>'+esc(TEXTS.labelCount)+'<b>'+answered+' / '+state.order.length+'</b></div>'
    + '<div>'+esc(TEXTS.labelTime)+'<b>'+fmt(used)+'</b></div>'
    + '<div>'+esc(TEXTS.labelPercent)+'<b>'+pct+' / '+FULL+'</b></div>'
    + '<div>'+esc(TEXTS.labelFinish)+'<b>'+stamp(state.finishedAt)+'</b></div>';

  $("#copyBox").value = buildText(used, answered, pct);

  // 偷看扣分记录（只在瞄过时才显示）
  const peekBox = $("#peekStat");
  if (peekBox){
    const c = state.peekCount || 0, t = state.peekPenalty || 0;
    peekBox.textContent = c ? fill(TEXTS.peekStat, {c, t}) : "";
    peekBox.classList.toggle("hide", !c);
  }

  // 管理员区
  const adm = !!state.admin;
  $("#adminResultBox").classList.toggle("hide", !adm);
  $("#reviewBox").innerHTML = "";
  $("#historyBox").innerHTML = adm ? renderHistory() : "";
}
function renderHistory(){
  const h = getHistory();
  if (!h.length) return '<div class="hist-head">'+esc(TEXTS.adminRecords)+'</div><div class="hist-item">'+esc(TEXTS.adminNoRecord)+'</div>';
  return '<div class="hist-head">'+esc(TEXTS.adminRecords)+'</div>' + h.map(r=>{
    const mx = r.max || 0, pc = r.pct != null ? r.pct : (mx>0 ? Math.round(r.score/mx*100) : 0);
    const slashStr = mx>0 ? signed(r.score)+' / '+mx : signed(r.score);
    return '<div class="hist-item"><span class="hs">'+ slashStr +'</span>'
      + '<span>'+ esc(r.name||"匿名") +' · '+ r.n +'/'+ r.total +' 题 · '+ pc +'%'
      + ' · '+ fmt(r.time) +'</span>'
      + '<span style="margin-left:auto;color:var(--sub)">'+ stamp(r.ts) +'</span></div>';
  }).join("");
}
$("#btnReview").onclick = ()=>{
  const box = $("#reviewBox");
  if (box.innerHTML){ box.innerHTML = ""; return; }
  box.innerHTML = state.order.map((id,n)=>{
    const q = byId(id), a = state.answers[id];
    if (!q) return "";
    if (!a) return '<div class="review-item"><div class="rq">'+(n+1)+'. '+esc(q.text)+'</div>'
      + '<div class="ra">未作答<span class="rd">0 分</span></div></div>';
    const picks = a.sel.map(i=>'<div>'+ letterOf(id, i) +'. '+ esc(q.options[i].text)
      + '（'+ signed(Number(q.options[i].score)||0) +'）</div>').join("");
    return '<div class="review-item"><div class="rq">'+(n+1)+'. '+esc(q.text)+'</div>'
      + '<div class="ra">'+ picks +'<span class="rd">'+ signed(a.delta) +' 分</span></div></div>';
  }).join("");
};
$("#btnRedo").onclick = ()=>{
  try{ state = newState(state.name); }catch(e){ return; }
  save(); startTimer(); renderQuestion(); show("quiz");
};
function buildText(used, answered, pct){
  return [
    fill(TEXTS.textLine1,  {title:CONFIG.title}),
    fill(TEXTS.textSchool, {school:CONFIG.schoolName}),
    fill(TEXTS.textName,   {name: state.name || "匿名"}),
    fill(TEXTS.textScore,  {score: pct + " / " + FULL + " 分"}),
    fill(TEXTS.textRank,   {rank: rankOf(state.score)}),
    fill(TEXTS.textCount,  {n:answered, total:state.order.length}),
    fill(TEXTS.textTime,   {time:fmt(used)}),
    fill(TEXTS.textStamp,  {stamp:stamp(state.finishedAt)}),
    TEXTS.textTail
  ].join("\n");
}

/* ==================== 导出 ==================== */
function fileName(ext){
  const d=new Date(), p=n=>String(n).padStart(2,"0");
  const nm = (state.name || "匿名").replace(/[\\/:*?"<>|]/g, "");
  return CONFIG.schoolName + "_" + nm + "_成绩单_"
       + d.getFullYear()+p(d.getMonth()+1)+p(d.getDate()) + "_" + p(d.getHours())+p(d.getMinutes()) + "." + ext;
}
function download(blob, name){
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
$("#btnCopy").onclick = ()=>{
  const t=$("#copyBox"); t.select(); t.setSelectionRange(0,99999);
  const done = ()=> toast(TEXTS.toastCopy);
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(t.value).then(done, ()=>{ document.execCommand("copy"); done(); });
  else { document.execCommand("copy"); done(); }
};
$("#btnCsv").onclick = ()=>{
  const who = state.name || "匿名";
  const rows = [["姓名","题号","题目","内容标签","题型","你的选择","选项分值","本题得分","反馈"]];
  state.order.forEach((id,n)=>{
    const q = byId(id), a = state.answers[id];
    if (!q) return;
    if (!a){ rows.push([who, n+1, q.text, q.contentTag||"", q.type||"", "未作答", "", 0, ""]); return; }
    rows.push([
      who, n+1, q.text, q.contentTag||"", q.type||"",
      a.sel.map(i=>letterOf(id, i)+"."+q.options[i].text).join(" / "),
      a.sel.map(i=>(Number(state.norm.optScore[id][i])||0)).join(" / "),
      a.delta,
      a.sel.map(i=>q.options[i].feedback||"").join(" / ")
    ]);
  });
  const csv = "\ufeff" + rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  download(new Blob([csv],{type:"text/csv;charset=utf-8"}), fileName("csv"));
  toast(TEXTS.toastCsv);
};
$("#btnJson").onclick = ()=>{
  download(new Blob([JSON.stringify({config:CONFIG, progress:state, history:getHistory()}, null, 2)], {type:"application/json"}), fileName("json"));
  toast(TEXTS.toastJson);
};
$("#btnPng").onclick = ()=>{
  const a=document.createElement("a"); a.href=makeCard(); a.download=fileName("png");
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 500);
  toast(TEXTS.toastPng);
};
$("#btnReset").onclick = ()=>{
  if (confirm(TEXTS.resetConfirm)){ localStorage.removeItem(LS_PROGRESS); location.reload(); }
};

/* ---------- 成绩单图片（纯 Canvas 绘制，不联网） ---------- */
function makeCard(){
  const W=900, H=1180, dpr=2;
  const cv=document.createElement("canvas"); cv.width=W*dpr; cv.height=H*dpr;
  const c=cv.getContext("2d"); c.scale(dpr,dpr);
  const th=THEMES[curTheme], v=th.vars;
  const F = v.font || '"Microsoft YaHei",sans-serif';
  const C = W/2;

  const g=c.createLinearGradient(0,0,W,H); g.addColorStop(0,th.png[0]); g.addColorStop(1,th.png[1]);
  c.fillStyle=g; c.fillRect(0,0,W,H);
  c.globalAlpha=.14; c.fillStyle="#fff";
  [[80,120,120],[820,240,160],[140,1080,90],[760,1000,120]].forEach(([x,y,r])=>{ c.beginPath(); c.arc(x,y,r,0,7); c.fill(); });
  c.globalAlpha=1;

  const rr=(x,y,w,h,r)=>{ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); };
  c.fillStyle="rgba(0,0,0,.14)"; rr(70,190,760,880,34); c.fill();
  c.fillStyle=v.panel;           rr(70,180,760,880,34); c.fill();

  c.textAlign="center";
  c.fillStyle=v.sub;  c.font="500 22px "+F; c.fillText(CONFIG.schoolName, C, 130);
  c.fillStyle=v.ink;  c.font="700 40px "+F; c.fillText(CONFIG.title, C, 300);

  const nm = state.name || "匿名";
  c.fillStyle=v.sub;  c.font="500 26px "+F; c.fillText(nm + " 老师", C, 355);

  const sc=state.score, pc=scorePercent(sc);
  c.fillStyle = sc>0 ? v.primary : (sc<0 ? v.bad : v.ink);
  c.font="800 140px "+F; c.fillText(slash(sc), C, 505);
  c.fillStyle=v.sub; c.font="500 24px "+F; c.fillText(TEXTS.labelScore + "　（满分 " + FULL + " 分）", C, 550);

  c.fillStyle=v.primary; c.font="700 34px "+F; c.fillText(rankOf(sc), C, 630);

  const used=state.finishedAt-state.startedAt, ans=Object.keys(state.answers).length;
  c.fillStyle=v.ink; c.font="700 28px "+F;

  c.fillText(ans+" / "+state.order.length+" 题", C-200, 720);
  c.fillText(fmt(used),                    C+0,   720);
  c.fillText(pc+" / "+FULL,                C+200, 720);
  c.fillStyle=v.sub; c.font="500 18px "+F;
  c.fillText(TEXTS.labelCount,   C-200, 758);
  c.fillText(TEXTS.labelTime,    C+0,   758);
  c.fillText(TEXTS.labelPercent, C+200, 758);

  c.fillStyle="rgba(255,255,255,.85)"; c.fillRect(120, 810, 660, 1);
  c.fillStyle=v.sub; c.font="500 20px "+F;
  c.fillText(TEXTS.pngNote1, C, 860);
  c.fillText(TEXTS.pngNote2, C, 895);

  c.fillStyle=v.primary; c.font="700 22px "+F;
  c.fillText(TEXTS.pngShield, C, 960);

  c.fillStyle=v.sub; c.font="500 16px "+F;
  c.fillText(stamp(state.finishedAt), C, 1015);

  return cv.toDataURL("image/png");
}

/* ==================== 偷看本题答案 ==================== */
$("#btnPeekQ").onclick = ()=>{
  if (viewing !== null) return;
  const q = byId(state.order[state.index]);
  if (!q) return;
  if (isAdmin){
    const body = $("#peekQBody");
    body.innerHTML = q.options.map((o,j)=>{
      const sc = Number(o.score)||0, cls = sc>0?"up":sc<0?"down":"zero";
      return '<div class="peek-opt"><span class="k">'+String.fromCharCode(65+j)+'.</span>'
        + '<span><span class="s '+cls+'">'+signed(sc)+'</span> '+esc(o.text)
        + (o.feedback?'<br><span class="f">→ '+esc(o.feedback)+'</span>':'')+'</span></div>';
    }).join("");
    $("#peekQTitle").textContent = TEXTS.peekAdminTitle;
    $("#peekQTip").textContent   = TEXTS.peekAdminTip;
    $("#peekQModal").classList.remove("hide");
    return;
  }
  state.peekCount++;
  const cost = peekCost(q.id, state.peekCount);
  state.peekPenalty += cost;
  state.score = Math.max(0, state.score - cost);
  save(); updateScoreBar(true);
  toast(fill(TEXTS.peekDeny, {n:cost}));
};
$("#btnPeekQClose").onclick = ()=> $("#peekQModal").classList.add("hide");
$("#peekQModal").onclick = e => { if (e.target.id === "peekQModal") $("#peekQModal").classList.add("hide"); };

/* ==================== 启动 ==================== */
function boot(){
  injectThemeCss();
  buildThemeMenu();
  try{ const t = localStorage.getItem(LS_THEME); if (t && THEMES[t]) curTheme = t; }catch(e){}
  setTheme(curTheme);
  initStart();
  const saved = load();
  if (saved && !saved.finished){
    state = saved;
    isAdmin = state.admin === true;
    if (!state.norm && state.maxScore && state.maxScore > 0 && FULL !== state.maxScore){
      const ratio = FULL / state.maxScore;
      state.score = Math.round((Number(state.score)||0) * ratio);
      state.peekPenalty = Math.round((Number(state.peekPenalty)||0) * ratio);
      Object.keys(state.answers||{}).forEach(k=>{
        const a = state.answers[k];
        if (a && a.delta !== undefined){ a.rawDelta = a.delta; a.delta = Math.round((Number(a.rawDelta)||0) * ratio); }
      });
      state.maxScore = FULL;
    } else if (!state.norm){
      state.norm = buildNorm(state.order);
    }
    durationMin = state.duration || CONFIG.durationMinutes;
    unlimited  = !!state.unlimited;
    lastScore = state.score;
    updateScoreBar(false);
    startTimer();
    renderQuestion();
    show("quiz");
    toast(TEXTS.toastResume);
  }
}
if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
