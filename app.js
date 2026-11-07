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
function rankOf(score){
  for (const [line,name] of RANKS) if (score >= line) return name;
  return RANKS[RANKS.length-1][1];
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
  return { v:1, name:name||"", admin:isAdmin,
           order:ids, optOrder:buildOptOrder(ids), answers:{}, index:0, score:0,
           peeked:[], peekCount:0, peekPenalty:0,
           startedAt:now,
           deadline: unlimited ? now + 1000*60*60*24*365 : now + durationMin*60000,
           unlimited: !!unlimited, duration: unlimited ? 0 : durationMin,
           fired:[], finished:false, finishedAt:null, forced:false };
}
function save(){ try{ localStorage.setItem(LS_PROGRESS, JSON.stringify(state)); }catch(e){} }
function load(){ try{ const s=JSON.parse(localStorage.getItem(LS_PROGRESS)); return (s && s.order) ? s : null; }catch(e){ return null; } }

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
  $("#scoreNum").textContent = signed(state.score);
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

  $("#progText").textContent = fill(TEXTS.progressText, {n:idx+1, total:state.order.length, score:signed(state.score)});
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
      const i = Number(el.dataset.i), sc = Number(q.options[i].score)||0;
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

  const delta = sel.reduce((s,i)=> s + (Number(q.options[i].score)||0), 0);
  state.answers[qid] = { sel, delta, qtext:q.text, ts:Date.now() };
  state.score += delta;
  save();
  updateScoreBar(true);

  document.querySelectorAll("#options .opt").forEach(el=>{
    const i = Number(el.dataset.i), chosen = sel.includes(i), sc = Number(q.options[i].score)||0;
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
  const lines = sel.length
    ? sel.map(i=>{
        const op = q.options[i], sc = Number(op.score)||0;
        const color = sc>0 ? "var(--ok)" : sc<0 ? "var(--bad)" : "var(--sub)";
        return '<p class="fb-line"><b>'+ letterOf(qid, i) +'. '+ esc(op.text) +'</b>　'
          + '<span style="color:'+color+';font-weight:700">'+ signed(sc) +' 分</span><br>' + esc(op.feedback||"") + '</p>';
      }).join("")
    : '<p class="fb-line">'+ esc(TEXTS.noneChosen) +'</p>';

  const realTag = (q.contentTag||"") + (q.contentTag && q.type ? " · " : "") + (q.type||"");
  const reveal = (q.secretTag && String(q.secretTag).trim())
    ? '<div class="fb-real">'+ esc(TEXTS.secretReveal) +'<span>'+ esc(realTag) +'</span>'+ esc(TEXTS.secretSuffix) +'</div>' : "";

  return '<div class="feedback">'
    + '<div class="fb-head"><span class="fb-delta '+(delta>0?"up":delta<0?"down":"")+'">'+ signed(delta) +' 分</span>'
    + '<span class="fb-total">累计 '+ signed(state.score) +' 分</span></div>'
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
    time: state.finishedAt - state.startedAt, ts: state.finishedAt
  });
  renderResult(); show("result");
}
function renderResult(){
  const answered = Object.keys(state.answers).length;
  const used = state.finishedAt - state.startedAt;

  $("#forceTip").innerHTML = state.forced ? '<div class="warnbox">'+ esc(TEXTS.forceTip) +'</div>' : "";
  $("#resultTitle").textContent = TEXTS.resultTitle;
  $("#resultSub").textContent   = fill(TEXTS.resultWho, {name: state.name || "匿名"});

  const sb = $("#scoreBig");
  sb.textContent = signed(state.score);
  sb.className = "score-big " + (state.score>0?"up":state.score<0?"down":"");
  $("#rankText").textContent = rankOf(state.score);
  $("#statRow").innerHTML =
      '<div>'+esc(TEXTS.labelCount)+'<b>'+answered+' / '+state.order.length+'</b></div>'
    + '<div>'+esc(TEXTS.labelTime)+'<b>'+fmt(used)+'</b></div>'
    + '<div>'+esc(TEXTS.labelFinish)+'<b>'+stamp(state.finishedAt)+'</b></div>';

  $("#copyBox").value = buildText(used, answered);

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
  return '<div class="hist-head">'+esc(TEXTS.adminRecords)+'</div>' + h.map(r=>
    '<div class="hist-item"><span class="hs">'+ signed(r.score) +'</span>'
    + '<span>'+ esc(r.name||"匿名") +' · '+ r.n +'/'+ r.total +' 题 · '+ fmt(r.time) +'</span>'
    + '<span style="margin-left:auto;color:var(--sub)">'+ stamp(r.ts) +'</span></div>'
  ).join("");
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
function buildText(used, answered){
  return [
    fill(TEXTS.textLine1,  {title:CONFIG.title}),
    fill(TEXTS.textSchool, {school:CONFIG.schoolName}),
    fill(TEXTS.textName,   {name: state.name || "匿名"}),
    fill(TEXTS.textScore,  {score:signed(state.score)}),
    fill(TEXTS.textRank,   {rank:rankOf(state.score)}),
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
      a.sel.map(i=>Number(q.options[i].score)||0).join(" / "),
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

  const sc=state.score;
  c.fillStyle = sc>0 ? v.primary : (sc<0 ? v.bad : v.ink);
  c.font="800 140px "+F; c.fillText(signed(sc), C, 505);
  c.fillStyle=v.sub; c.font="500 24px "+F; c.fillText(TEXTS.labelScore, C, 550);

  c.fillStyle=v.primary; c.font="700 34px "+F; c.fillText(rankOf(sc), C, 630);

  const used=state.finishedAt-state.startedAt, ans=Object.keys(state.answers).length;
  c.fillStyle=v.ink; c.font="700 28px "+F;
  c.fillText(ans+" / "+state.order.length+" 题", C-230, 745);
  c.fillText(fmt(used), C, 745);
  c.fillText(stamp(state.finishedAt).slice(5), C+230, 745);
  c.fillStyle=v.sub; c.font="500 20px "+F;
  c.fillText(TEXTS.labelCount, C-230, 780);
  c.fillText(TEXTS.labelTime,  C, 780);
  c.fillText(TEXTS.labelFinish,C+230, 780);

  c.strokeStyle=v.primary; c.globalAlpha=.35; c.lineWidth=2;
  c.beginPath(); c.moveTo(200,705); c.lineTo(700,705); c.stroke(); c.globalAlpha=1;

  c.fillStyle=v.sub; c.font="500 22px "+F;
  c.fillText(TEXTS.pngNote1, C, 875);
  c.fillText(TEXTS.pngNote2, C, 915);
  c.font="500 20px "+F; c.globalAlpha=.7;
  c.fillText(TEXTS.pngShield, C, 1010); c.globalAlpha=1;

  return cv.toDataURL("image/png");
}

/* ==================== 偷看本题答案 ==================== */
$("#btnPeekQ").onclick = ()=>{
  const q = byId(state.order[state.index]);
  if (!q) return;
  const qid = String(q.id);

  // 非管理员：不给答案，且扣分递增（第1次 -1，第2次 -2，第3次 -3……）
  let cost = 0;
  if (!isAdmin){
    state.peekCount = (state.peekCount || 0) + 1;
    cost = state.peekCount;                       // 第 n 次点，扣 n 分
    state.peekPenalty = (state.peekPenalty || 0) + cost;
    state.peeked = state.peeked || [];
    if (!state.peeked.includes(qid)) state.peeked.push(qid);
    state.score -= cost;
    save();
    updateScoreBar(true);
  }

  $("#peekQTitle").textContent = isAdmin ? TEXTS.peekAdminTitle : fill(TEXTS.peekDeny, {n: cost});
  $("#peekQTip").textContent = isAdmin
    ? TEXTS.peekAdminTip
    : fill(TEXTS.peekPenalty, {n: cost, c: state.peekCount, t: state.peekPenalty});

  // 非管理员：只显示题干，不显示任何选项分值 / 反馈 / 评价
  const perm = (state.optOrder && state.optOrder[qid]) || [...Array((q.options||[]).length).keys()];
  const optHtml = isAdmin
    ? perm.map((oi,j)=>{
        const o = q.options[oi], sc = Number(o.score)||0;
        return '<div class="peek-opt"><span class="k">'+ String.fromCharCode(65+j) +'.</span>'
          + '<span><span class="s '+(sc>0?"up":sc<0?"down":"zero")+'">'+ signed(sc) +'</span> '+ esc(o.text)
          + (o.feedback ? '<br><span class="f">→ '+ esc(o.feedback) +'</span>' : '') + '</span></div>';
      }).join("")
    : perm.map((oi,j)=>
        '<div class="peek-opt"><span class="k">'+ String.fromCharCode(65+j) +'.</span>'
      + '<span>'+ esc(q.options[oi].text) +'</span></div>'
      ).join("")
      + '<p class="peek-cmt">'+ esc(TEXTS.peekNoAnswer) +'</p>'
      + '<p class="peek-cmt">'+ esc(TEXTS.peekNoAnswer2) +'</p>';

  $("#peekQBody").innerHTML =
      '<div class="peek-item"><p class="peek-q">'+ esc(q.text) +'</p>'
    + '<div class="peek-meta">'+ esc((q.contentTag||"")+(q.contentTag&&q.type?" · ":"")+(q.type||"")) +'</div>'
    + optHtml
    + (isAdmin && q.comment ? '<div class="peek-cmt">💬 '+ esc(q.comment) +'</div>' : '')
    + '</div>';

  $("#peekQModal").classList.remove("hide");
};
$("#btnPeekQClose").onclick = ()=> $("#peekQModal").classList.add("hide");
$("#peekQModal").onclick = e => { if (e.target.id === "peekQModal") $("#peekQModal").classList.add("hide"); };

/* ==================== 图片放大 ==================== */
$("#qImage").onclick = ()=>{
  const lb=document.createElement("div"); lb.id="lightbox";
  const im=document.createElement("img"); im.src=$("#qImage").src;
  lb.appendChild(im); lb.onclick=()=>lb.remove(); document.body.appendChild(lb);
};

/* ==================== 启动 ==================== */
(function boot(){
  BANK.forEach((q,i)=>{ if (q.id==null) q.id = i+1; });
  injectThemeCss();
  try{ setTheme(localStorage.getItem(LS_THEME) || Object.keys(THEMES)[0]); }catch(e){ setTheme(Object.keys(THEMES)[0]); }
  buildThemeMenu();
  initStart();

  const saved = load();
  if (saved && !saved.optOrder) saved.optOrder = buildOptOrder(saved.order);  // 兼容旧存档
  if (saved && !saved.peeked)   saved.peeked = [];
  if (saved && saved.peekCount == null) saved.peekCount = saved.peeked.length;  // 兼容旧存档
  if (saved && saved.peekPenalty == null){
    const n = saved.peekCount || 0;
    saved.peekPenalty = n*(n+1)/2;   // 1+2+...+n
  }
  if (saved && !saved.finished){
    state = saved;
    isAdmin = !!state.admin;
    durationMin = state.duration || CONFIG.durationMinutes;
    unlimited = !!state.unlimited;
    startTimer(); updateScoreBar(false); renderQuestion(); show("quiz"); toast(TEXTS.toastResume);
  } else if (saved && saved.finished){
    state = saved;
    isAdmin = !!state.admin;
    durationMin = state.duration || CONFIG.durationMinutes;
    unlimited = !!state.unlimited;
    renderResult(); show("result");
  }
})();
