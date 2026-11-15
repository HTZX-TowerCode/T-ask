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
 *  计分：原始分值 + 理论最高得分 + 得分率
 *  ------------------------------------------------------------
 *  每题得分 = 所选选项的分值相加，一个都不选记 0 分。
 *  每题「理论最高得分」= 这道题能拿到的最好结果：
 *    单选        → 分最高的那个选项（低于 0 记 0）
 *    多选/不定项 → 所有加分项之和（低于 0 记 0）
 *  选项全是扣分的题，什么都不选就是最高分，理论最高记 0，
 *  不往分母里凑数。
 *
 *  本卷理论最高 = 抽到的各题理论最高之和，抽题时算好就固定。
 *  得分率 = 实际得分 ÷ 本卷理论最高 × 100%（保留一位小数），
 *  段位称号按得分率评定，不同套卷之间可以直接比。
 * ============================================================ */

/* 一道题的理论最高得分 */
function theoreticalMaxOf(q){
  if (!q || !q.options || !q.options.length) return 0;
  const scores = q.options.map(o => Number(o.score) || 0);
  const multi = (q.type === "多选" || q.type === "不定项");
  let best;
  if (multi){
    // 可以只挑加分项，也可以一个都不选
    best = scores.reduce((s, v) => s + (v > 0 ? v : 0), 0);
  } else {
    // 单选只能选一个，或者一个都不选
    best = Math.max.apply(null, scores.concat([0]));
  }
  return Math.max(0, best);
}

/* 本套卷的理论最高得分 */
function calcTheoreticalMax(ids){
  return ids.reduce((s, id) => s + theoreticalMaxOf(byId(id)), 0);
}

/* 本题的最优选项下标（规则与 theoreticalMaxOf 一致）：
 * 单选 = 分最高的那一个（没有加分项就是什么都不选）
 * 多选/不定项 = 所有加分项 */
function bestPickOf(q){
  const scores = (q && q.options ? q.options : []).map(o => Number(o.score) || 0);
  const multi = (q.type === "多选" || q.type === "不定项");
  const out = [];
  if (multi){
    scores.forEach((v, i)=>{ if (v > 0) out.push(i); });
  } else {
    let bv = 0, bi = -1;
    scores.forEach((v, i)=>{ if (v > bv){ bv = v; bi = i; } });
    if (bi >= 0) out.push(bi);
  }
  return out;
}

/* 回看答案的可见范围：QUIZ_CONFIG.reviewShowAnswer */
function canReviewAnswer(){
  const v = CONFIG.reviewShowAnswer;
  if (v === false || v === "off") return false;
  if (v === "admin") return !!isAdmin;
  return true;
}

/* 把最优选项写成屏幕上的字母，按字母顺序排好 */
function answerPickText(q, picks){
  if (!picks.length) return "";
  const qid = String(q.id);
  const sum = picks.reduce((s, i)=> s + (Number(q.options[i].score) || 0), 0);
  return picks.map(i => letterOf(qid, i)).sort().join("、") + "（" + signed(sum) + " 分）";
}

/* 回看已答题时揭晓的「本题答案」：
 * 理论最高、最优作答、每个选项的分值与反馈，并标出应选/当时选的。
 * 字母一律用屏幕顺序（letterOf），和答题时看到的 A/B/C 对得上。 */
function buildAnswer(q, a){
  const qid = String(q.id);
  const max = theoreticalMaxOf(q);
  const got = (a && Number(a.delta)) || 0;
  const best = bestPickOf(q);
  const chosen = (a && a.sel) || [];
  const bestLine = best.length
    ? fill(TEXTS.answerBest, {picks: answerPickText(q, best)})
    : TEXTS.answerBestNone;

  const opts = (q.options || []).map((o, i)=>{
    const sc = Number(o.score) || 0;
    const cls = sc > 0 ? "up" : sc < 0 ? "down" : "zero";
    const marks = (best.includes(i) ? '<span class="answer-should">'+ esc(TEXTS.answerShould) +'</span>' : '')
                + (chosen.includes(i) ? '<span class="answer-mine">'+ esc(TEXTS.answerMine) +'</span>' : '');
    return '<div class="peek-opt"><span class="k">'+ letterOf(qid, i) +'.</span>'
      + '<span><span class="s '+ cls +'">'+ signed(sc) +'</span> '+ esc(o.text) + marks
      + (o.feedback ? '<br><span class="f">→ '+ esc(o.feedback) +'</span>' : '')
      + '</span></div>';
  }).join("");

  return '<div class="answer-box">'
    + '<div class="answer-head">'+ esc(TEXTS.answerTitle)
    + '<span>'+ esc(TEXTS.answerFree) +'</span></div>'
    + '<div class="answer-line">'+ esc(fill(TEXTS.answerMaxLine, {max, got})) +'</div>'
    + '<div class="answer-line answer-best">'+ esc(bestLine) +'</div>'
    + '<div class="answer-opts">'+ opts +'</div>'
    + '</div>';
}

/* 得分率：实际得分 ÷ 理论最高，保留一位小数。
 * 分母为 0（整卷没有一道能加分的题）时，按是否扣过分给 0 或 100。 */
function rateOf(score){
  const max = (state && Number(state.theoreticalMax)) || 0;
  if (max <= 0) return score >= 0 ? 100 : 0;
  return Math.round(score / max * 1000) / 10;
}

/* 段位称号：按得分率评定，从上往下匹配 */
function rankOf(rate){
  for (const [line, name] of RANKS) if (rate >= line) return name;
  return RANKS[RANKS.length - 1][1];
}

/* 显示用的「实际得分 / 理论最高」 */
const slash = score => signed(score) + " / " + ((state && state.theoreticalMax) || 0);

/* 偷看扣分：第 n 次扣 n 分，整场累计，按原始分值口径 */
function peekCost(qid, n){ return n; }

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
  const theoreticalMax = calcTheoreticalMax(ids);  // 本卷理论最高，抽定即固定
  return { v:2, name:name||"", admin:isAdmin,
           order:ids, optOrder:buildOptOrder(ids), answers:{}, index:0, score:0,
           theoreticalMax:theoreticalMax,
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
    // 题库改过分值时，按当前题库重算理论最高，分母跟着题目走
    s.theoreticalMax = calcTheoreticalMax(s.order);
    if (s.v === 2) return s;
    /* 旧版（150 分制）存档：按理论最高把分数换算回原始分值。
     * 取整会有误差，但进行中的进度不会丢。 */
    const ratio = s.theoreticalMax / 150;
    s.score = Math.round((Number(s.score) || 0) * ratio);
    s.peekPenalty = Math.round((Number(s.peekPenalty) || 0) * ratio);
    Object.keys(s.answers || {}).forEach(k=>{
      const a = s.answers[k];
      if (a && a.delta !== undefined) a.delta = Math.round((Number(a.delta) || 0) * ratio);
    });
    s.v = 2;
    delete s.norm; delete s.alloc; delete s.maxScore; delete s.rawMax;
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
  $("#scoreNum").textContent = slash(state.score);   // 实际得分 / 理论最高
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

  const rate = rateOf(state.score);
  $("#progText").textContent = fill(TEXTS.progressText,
      {n:idx+1, total:state.order.length, score:slash(state.score), rate:rate});
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
    box.querySelectorAll(".opt").forEach(el=>{
      const i = Number(el.dataset.i), sc = Number(q.options[i].score) || 0;
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
    $("#fbBox").innerHTML = buildFeedback(q, a.sel, a.delta)
      + (canReviewAnswer() ? buildAnswer(q, a) : "");
  } else {
    $("#fbBox").innerHTML = "";
  }

  // 按钮区
  $("#btnSubmit").disabled = false;          // 允许不选直接提交
  $("#btnSubmit").textContent = readonly
    ? fill(TEXTS.backToCurrent, {n: state.index+1})
    : TEXTS.btnSubmit;
  if (!readonly) syncSubmitLabel();

  // 偷看按钮：提交后、回看时都不出现（回看答案不扣分，不用再偷看）
  const peekBtn = $("#btnPeekQ");
  peekBtn.classList.toggle("hide", readonly || !!a);
  peekBtn.disabled = false;
  $("#actionRow").classList.toggle("hide", !!readonly);

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
      // 实时判断：提交后 nav 可能还没重绘，不能用生成时固化的 done
      const isDone = !!state.answers[String(id)];
      if (i === state.index && !isDone){ viewing = null; renderAt(i, false); return; }
      if (!isDone){ toast(TEXTS.navLocked); return; }
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

  // 该题得分 = 所选选项的原始分值之和（一个都不选就是 0 分）
  let delta = 0;
  sel.forEach(i=>{ delta += (Number(q.options[i].score) || 0); });
  state.answers[qid] = { sel, delta, qtext:q.text, ts:Date.now() };
  state.score += delta;
  save();
  updateScoreBar(true);

  document.querySelectorAll("#options .opt").forEach(el=>{
    const i = Number(el.dataset.i), chosen = sel.includes(i), sc = Number(q.options[i].score) || 0;
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
  renderNav(state.index);                 // 本题变绿，立刻可以点开回看答案
  $("#btnSubmit").textContent = (state.index >= state.order.length-1) ? TEXTS.btnResult : TEXTS.btnNext;
}

function buildFeedback(q, sel, delta){
  const qid = String(q.id);
  const lines = sel.length
    ? sel.map(i=>{
        const op = q.options[i], sc = Number(op.score) || 0;
        const color = sc>0 ? "var(--ok)" : sc<0 ? "var(--bad)" : "var(--sub)";
        return '<p class="fb-line"><b>'+ letterOf(qid, i) +'. '+ esc(op.text) +'</b>　'
          + '<span style="color:'+color+';font-weight:700">'+ signed(sc) +' 分</span><br>' + esc(op.feedback||"") + '</p>';
      }).join("")
    : '<p class="fb-line">'+ esc(TEXTS.noneChosen) +'</p>';

  const realTag = (q.contentTag||"") + (q.contentTag && q.type ? " · " : "") + (q.type||"");
  const reveal = (q.secretTag && String(q.secretTag).trim())
    ? '<div class="fb-real">'+ esc(TEXTS.secretReveal) +'<span>'+ esc(realTag) +'</span>'+ esc(TEXTS.secretSuffix) +'</div>' : "";

  const rate = rateOf(state.score);
  return '<div class="feedback">'
    + '<div class="fb-head"><span class="fb-delta '+(delta>0?"up":delta<0?"down":"")+'">'+ signed(delta) +' 分</span>'
    + '<span class="fb-total">累计 '+ slash(state.score)
    + '　<span style="color:var(--primary);font-weight:700">'+ rate +'%</span></span></div>'
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
    max: state.theoreticalMax,
    rate: rateOf(state.score),
    time: state.finishedAt - state.startedAt, ts: state.finishedAt
  });
  renderResult(); show("result");
}
function renderResult(){
  const answered = Object.keys(state.answers).length;
  const used = state.finishedAt - state.startedAt;
  const rate = rateOf(state.score);

  $("#forceTip").innerHTML = state.forced ? '<div class="warnbox">'+ esc(TEXTS.forceTip) +'</div>' : "";
  $("#resultTitle").textContent = TEXTS.resultTitle;
  $("#resultSub").textContent   = fill(TEXTS.resultWho, {name: state.name || "匿名"});

  const sb = $("#scoreBig");
  sb.textContent = slash(state.score);          // 实际得分 / 理论最高
  sb.className = "score-big " + (state.score>0?"up":state.score<0?"down":"");
  $("#rankText").textContent = rankOf(rate) + fill(TEXTS.rankSuffix, {max:state.theoreticalMax, rate:rate});
  $("#statRow").innerHTML =
      '<div>'+esc(TEXTS.labelCount)+'<b>'+answered+' / '+state.order.length+'</b></div>'
    + '<div>'+esc(TEXTS.labelTime)+'<b>'+fmt(used)+'</b></div>'
    + '<div>'+esc(TEXTS.labelPercent)+'<b>'+rate+'%</b></div>'
    + '<div>'+esc(TEXTS.labelMax)+'<b>'+state.theoreticalMax+' 分</b></div>'
    + '<div>'+esc(TEXTS.labelFinish)+'<b>'+stamp(state.finishedAt)+'</b></div>';

  $("#copyBox").value = buildText(used, answered, rate);

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
    const mx = Number(r.max) || 0;
    const pc = r.rate != null ? r.rate : (mx > 0 ? Math.round(r.score / mx * 1000) / 10 : 0);
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
    const best = bestPickOf(q), max = theoreticalMaxOf(q);
    const picks = best.length ? answerPickText(q, best) : "什么都不选（0 分）";
    const ansLine = canReviewAnswer()
      ? '<div class="review-ans">'+ esc(fill(TEXTS.answerReviewLine, {max, picks})) +'</div>' : "";
    if (!a) return '<div class="review-item"><div class="rq">'+(n+1)+'. '+esc(q.text)+'</div>'
      + '<div class="ra">未作答<span class="rd">0 分</span></div>'+ ansLine +'</div>';
    const picksHtml = a.sel.map(i=>'<div>'+ letterOf(id, i) +'. '+ esc(q.options[i].text)
      + '（'+ signed(Number(q.options[i].score)||0) +'）</div>').join("");
    return '<div class="review-item"><div class="rq">'+(n+1)+'. '+esc(q.text)+'</div>'
      + '<div class="ra">'+ picksHtml +'<span class="rd">'+ signed(a.delta) +' 分</span></div>'
      + ansLine +'</div>';
  }).join("");
};
$("#btnRedo").onclick = ()=>{
  try{ state = newState(state.name); }catch(e){ return; }
  save(); startTimer(); renderQuestion(); show("quiz");
};
function buildText(used, answered, rate){
  const max = state.theoreticalMax;
  return [
    fill(TEXTS.textLine1,  {title:CONFIG.title}),
    fill(TEXTS.textSchool, {school:CONFIG.schoolName}),
    fill(TEXTS.textName,   {name: state.name || "匿名"}),
    fill(TEXTS.textScore,  {score: signed(state.score), max:max}),
    fill(TEXTS.textMax,    {max:max}),
    fill(TEXTS.textRate,   {rate:rate}),
    fill(TEXTS.textRank,   {rank: rankOf(rate)}),
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
  const rate = rateOf(state.score);
  const rows = [["姓名","题号","题目","内容标签","题型","你的选择","选项分值","本题得分","本题理论最高","反馈"]];
  state.order.forEach((id,n)=>{
    const q = byId(id), a = state.answers[id];
    if (!q) return;
    const qmax = theoreticalMaxOf(q);
    if (!a){ rows.push([who, n+1, q.text, q.contentTag||"", q.type||"", "未作答", "", 0, qmax, ""]); return; }
    rows.push([
      who, n+1, q.text, q.contentTag||"", q.type||"",
      a.sel.map(i=>letterOf(id, i)+"."+q.options[i].text).join(" / "),
      a.sel.map(i=>(Number(q.options[i].score)||0)).join(" / "),
      a.delta, qmax,
      a.sel.map(i=>q.options[i].feedback||"").join(" / ")
    ]);
  });
  rows.push([who, "合计", "", "", "", "实际得分 "+state.score+" 分", "", state.score,
             "理论最高 "+state.theoreticalMax+" 分 · 得分率 "+rate+"%", rankOf(rate)]);
  const csv = "\ufeff" + rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  download(new Blob([csv],{type:"text/csv;charset=utf-8"}), fileName("csv"));
  toast(TEXTS.toastCsv);
};
$("#btnJson").onclick = ()=>{
  const rate = rateOf(state.score);
  download(new Blob([JSON.stringify({
    config: CONFIG,
    summary: {
      name: state.name || "匿名", score: state.score,
      theoreticalMax: state.theoreticalMax, rate: rate, rank: rankOf(rate),
      answered: Object.keys(state.answers).length
    },
    progress: state, history: getHistory()
  }, null, 2)], {type:"application/json"}), fileName("json"));
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

  const sc=state.score, rate=rateOf(sc), max=state.theoreticalMax;
  c.fillStyle = sc>0 ? v.primary : (sc<0 ? v.bad : v.ink);
  c.font="800 140px "+F; c.fillText(slash(sc), C, 505);
  c.fillStyle=v.sub; c.font="500 24px "+F; c.fillText(fill(TEXTS.pngScoreLine, {max, rate}), C, 550);

  c.fillStyle=v.primary; c.font="700 34px "+F; c.fillText(rankOf(rate), C, 630);

  const used=state.finishedAt-state.startedAt, ans=Object.keys(state.answers).length;
  c.fillStyle=v.ink; c.font="700 28px "+F;

  c.fillText(ans+" / "+state.order.length+" 题", C-200, 720);
  c.fillText(fmt(used),                    C+0,   720);
  c.fillText(rate+"%",                     C+200, 720);
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
  state.score -= cost;
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
