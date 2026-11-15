/* ==========================================================================
 *
 *   这是本项目唯一需要你修改的文件。
 *   界面文案、题库、主题配色、评定标准、管理员名单 —— 全部在这里。
 *   计分方式写在 app.js：原始分值 + 理论最高得分 + 得分率。
 *   改完保存，刷新网页就生效。
 *
 * ========================================================================== */


/* ============================ 一、基本信息 ============================ */
window.QUIZ_CONFIG = {
  schoolName: "玉溪一中附属中学（红塔中学）",   // 学校名，出现在标题栏、成绩单上
  title:      "运动会 · 教师专场问答",          // 大标题
  subtitle:   "教师专场 · 答完不许真实学生",   // 副标题，随便皮一下

  totalQuestions:  30,        // 每位老师抽到的题数（固定 30 道）
  durationMinutes: 15,        // 默认总时长（分钟），管理员可在开局页临时改
  checkpoints:     [10, 5, 1],// 剩余多少分钟时弹提醒

  shuffleOptions: true,       // 每个选项顺序随机打乱（不让 A 总是最高分）
                              // 想按题库原本顺序显示就改成 false

  /* —— 回看时揭晓答案 ——
   * "all"   = 所有人回看已答题都能看（默认）
   * "admin" = 只有管理员能看
   * false   = 关掉，回看只显示当时的作答
   * 只影响「已提交」的题回看，未答的题点不开，不扣分、不加分。 */
  reviewShowAnswer: "all",

  /* —— 退出按钮 —— */
  quitEnabled:     true,     // 是否在答题页显示"退出答题"按钮
  quitConfirm:     true,     // 退出前是否弹出确认框
  quitConfirmText: "退出后回到开局页，当前进度会保留在本机，下次进来可继续作答。确定退出吗？"
};


/* ============================ 二、管理员 ============================
 * 输入下面这些名字即进入管理员模式（忽略大小写、忽略空格）
 * 管理员可以：查看全部题目与反馈、多次做题、调整时间限制
 * 想加人就往数组里加，想删人就删掉那一项
 * -------------------------------------------------------------------- */
window.QUIZ_ADMINS = [
"11762",
"88172",
"52631",
"99875"
];


/* ============================ 三、界面文案 ============================
 * 所有页面上出现的文字都在这里，想改哪句直接改。
 * {xxx} 是占位符，程序会自动替换，别删掉花括号里的词。
 * -------------------------------------------------------------------- */
window.QUIZ_TEXTS = {

  /* —— 开局页：姓名 —— */
  nameLabel:    "请先写下你的名字",
  namePlaceholder: "例如：王小明",
  nameEmpty:    "先写个名字再开始吧，不然成绩单不知道算谁的。",
  nameHint:     "名字只会显示在你的成绩单上，不会上传到任何地方",

  /* —— 开局页 —— */
  btnStart:      "开始答题",
  discTitle:     "🛡 宇宙安全免责声明",
  startFootnote: "共 {total} 题 · 限时 {min} 分钟 · 按得分率评称号 · 进度自动保存在本机",

  /* —— 免责声明：上面严肃，下面轻松 —— */
  disclaimerSerious: [
    "本场问答为运动会期间教师联谊活动，结果不记入任何考核，不作为任何评价依据。",
    "所有作答数据仅保存在你本机浏览器中，不上传、不联网、不对外公布个人得分。",
    "如遇页面异常，关掉重开即可，已答题目不会丢失。"
  ],
  disclaimerFunny: [
    "题目由老师们（以及若干不肯署名的学生）共同撰写，答案带有强烈的主观偏好。",
    "如果某道题让你想找出题人理论，请选择2月31日",
    "分数高低与教学水平无关，只与运气、手速，以及你对本校黑话的熟悉程度有关。"
  ],

  /* —— 管理员面板 —— */
  adminBadge:     "👑 管理员模式",
  adminWelcome:   "你好，{name}。以下功能只有你能看到。",
  adminTimeLabel: "时间限制（分钟）",
  adminTimeUnlimited: "不限时",
  adminTimeApply: "改回限时",
  adminTimeSaved: "时间限制已设为 {min} 分钟",
  adminTimeOff:   "已设为不限时，倒计时关闭",
  adminPeek:      "查看全部题目与反馈",
  adminPeekTitle: "题库检视 · 共 {n} 题",
  adminPeekTip:   "这里会列出每道题每个选项的分值和反馈，答题前别让老师看到。",
  adminPeekClose: "关闭",
  adminRecords:   "历史成绩（本机）",
  adminNoRecord:  "还没有历史记录",
  adminRedo:      "再来一套（管理员）",
  adminReview:    "查看本次作答回顾",
  adminReviewTip: "逐题查看你选了什么、拿到多少分",

  /* —— 答题页 —— */
  btnSubmit:    "提交本题",
  btnSubmitEmpty: "一个都不选，直接提交",
  btnNext:      "下一题",
  btnResult:    "查看成绩单",
  scoreLabel:   "得分",

  /* —— 偷看本题答案 —— */
  peekBtn:       "瞄一眼答案",
  peekWarn:      "点了就扣分，而且不给答案",
  peekAdminTitle:"本题答案（管理员）",
  peekAdminTip:  "你是管理员，看了不扣分。",
  peekDeny:      "想什么呢，扣 {n} 分",
  peekPenalty:   "本次扣 {n} 分。本场你已经瞄了 {c} 次，累计被扣 {t} 分。",
  peekNoAnswer:  "答案是不会给的。",
  peekNoAnswer2: "想看答案？叫出题人把你加成管理员。",
  peekStat:      "👀 本场瞄了 {c} 次，被扣 {t} 分",

  /* —— 回看 —— */
  navHint:    "点绿色题号回看：能看本题答案，改不了选择",
  navDone:    "已作答，点开回看答案",
  navUndone:  "还没答",
  navLocked:  "这题还没答，回看不了。",
  reviewTip:  "👀 正在回看第 {n} 题 · 答案在下面，选择改不了了",
  backToCurrent: "回到第 {n} 题",

  /* —— 回看时揭晓的本题答案 —— */
  answerTitle:   "📖 本题答案",
  answerFree:    "回看不扣分",
  answerMaxLine: "本题理论最高 {max} 分 · 本题得分 {got} 分",
  answerBest:    "最优作答：{picks}",
  answerBestNone:"最优作答：什么都不选（0 分）",
  answerMine:    "你选的",
  answerShould:  "应选",
  answerReviewLine: "理论最高 {max} 分 · 最优 {picks}",

  /* —— 不选 —— */
  noneChosen: "你一个都没选。有时候不选也是一种答案。",
  progressText: "第 {n} / {total} 题 · 当前 {score}（{rate}%）",
  secretBefore: "",                       // 彩蛋标签前面的装饰，可留空
  secretReveal: "真实标签：",              // 揭晓时的前缀
  secretSuffix: "刚才那个是逗你的。",       // 揭晓时的后缀
  commentMark:  "💬 ",                     // 整体评价前面的小图标

  /* —— 倒计时提醒 —— */
  timerToast:   "⏰ 还剩 {m} 分钟，老师们加油～",
  lastMinute:   "⏰ 最后 1 分钟，手速拉满！",
  timerOff:     "不限时",

  /* —— 成绩单 —— */
  resultTitle:  "成绩单",
  resultWho:    "{name} 老师",
  labelScore:   "得分",
  labelCount:   "答题数",
  labelTime:    "用时",
  labelPercent: "得分率",
  labelMax:     "理论最高",
  labelFinish:  "完成时间",
  rankSuffix:   "（理论最高 {max} 分 · 得分率 {rate}%）",
  forceTip:     "⏰ 时间到，系统已自动收卷。未作答的题目记 0 分。",

  /* —— 导出按钮 —— */
  btnPng:   "下载成绩单图片",
  btnCopy:  "复制文字版",
  btnCsv:   "下载答题明细（Excel）",
  btnJson:  "下载原始数据",
  btnReset: "清掉记录，再答一次",
  btnTheme: "主题",

  /* —— 操作后的小提示 —— */
  toastCopy:  "已复制，去群里粘贴吧 ✅",
  toastCsv:   "明细已下载，Excel 直接能打开",
  toastJson:  "原始数据已下载",
  toastPng:   "成绩单图片已下载 🖼",
  toastResume:"已恢复上次进度，继续答题",
  resetConfirm: "确定清空本机答题记录，重新答一套新题？\n（当前成绩单会消失，且无法恢复）",
  lowBankWarn:  "题库只有 {n} 道题，少于设定的 {need} 题。\n点“确定”按现有题量作答，点“取消”先去加题。",

  /* —— 成绩单图片上的文字 —— */
  pngScoreLine: "得分 / 理论最高 {max} 分 · 得分率 {rate}%",
  pngNote1: "本场问答纯属娱乐，分数不代表任何评价",
  pngNote2: "数据仅保存在本机 · 宇宙安全免责声明适用",
  pngShield: "🛡 已通过宇宙安全认证",

  /* —— 文字版成绩单 —— */
  textLine1: "【{title}】成绩单",
  textSchool:"学校：{school}",
  textName:  "姓名：{name}",
  textScore: "得分：{score} / {max} 分",
  textMax:   "理论最高：{max} 分",
  textRate:  "得分率：{rate}%",
  textRank:  "称号：{rank}",
  textCount: "答题：{n} / {total} 题",
  textTime:  "用时：{time}",
  textStamp: "完成时间：{stamp}",
  textTail:  "—— 数据保存在本机，仅供娱乐",

  footNote: "数据只存在这台电脑的浏览器里，换电脑或清缓存就没了。",

  /* —— 退出按钮 —— */
  btnQuit:     "退出答题",
  quitTip:     "已退出，进度已保留在本机"
};


/* ============================ 四、段位称号 ============================
 * 格式：[达到多少得分率（%）, 显示什么称号]
 * 得分率 = 实际得分 ÷ 本卷理论最高得分 × 100%，从上往下匹配，
 * 第一个满足的生效，最后一行留个兜底。
 *
 * 理论最高不用手填，程序按每道题能拿到的最好结果自动算：
 *   单选 = 分最高的那个选项（低于 0 记 0）
 *   多选 / 不定项 = 所有加分项之和（低于 0 记 0）
 * 选项全是扣分的题，什么都不选就是最高分，理论最高记 0，
 * 不占分母。每套卷抽到的题不同，理论最高也不同，用得分率才好比较。
 *
 * 门槛沿用原来 150 分制的比例：95% ≈ 143 分、85% ≈ 128 分、
 * 70% ≈ 105 分、50% ≈ 75 分、1% ≈ 2 分。
 * -------------------------------------------------------------------- */
window.QUIZ_RANKS = [
  [  95, "🏆 传奇教师 · 全校传闻级"],
  [  85, "🎓 学霸教师 · 学生已经开始害怕"],
  [  70, "👍 稳住的老将 · 基本盘很扎实"],
  [  50, "🙂 及格线上蹦迪"],
  [   1, "🌱 重在参与 · 精神可嘉"],
  [-999, "🤪 反向天才 · 建议出一版反向题库"]
];


/* ============================ 五、主题配色 ============================
 * 想改颜色：直接改下面的十六进制值。
 * 想加一套主题：复制一整段，改个英文名和 label 就行，右上角会自动出现。
 * 想删一套主题：把那一段整个删掉。
 *
 *   vars 里的各项含义：
 *     bg1/bg2   页面背景渐变（上 → 下）
 *     panel     卡片底色        ink     主文字
 *     sub       次要文字        soft    浅色底（选项、反馈框）
 *     line      边框线          primary 主色（按钮、标签）
 *     primaryInk 主色按钮上的字  ok/bad  得分正/负的颜色
 *     radius    圆角大小        font    字体
 *   png : 成绩单图片的背景渐变（上 → 下）
 * -------------------------------------------------------------------- */
window.QUIZ_THEMES = {

  /* 1. 运动会活力橙（默认） */
  sport: {
    label: "运动会活力橙",
    vars: {
      bg1:"#FFF3E6", bg2:"#FFD9AE", panel:"#FFFFFF", ink:"#2B1A0F", sub:"#8A6A4F",
      primary:"#FF6B1A", primaryInk:"#FFFFFF", soft:"#FFE9D6", line:"#F2DCC6",
      ok:"#17A673", bad:"#E5484D", radius:"18px",
      font:'"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif'
    },
    png: ["#FF8A3D", "#FFD07A"]
  },

  /* 2. 校园清新蓝白 */
  fresh: {
    label: "校园清新蓝白",
    vars: {
      bg1:"#EAF3FF", bg2:"#D7E8FF", panel:"#FFFFFF", ink:"#12314F", sub:"#5C7794",
      primary:"#2F80ED", primaryInk:"#FFFFFF", soft:"#DDEBFF", line:"#D6E4F5",
      ok:"#128A5B", bad:"#D64550", radius:"14px",
      font:'"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif'
    },
    png: ["#7FB6F5", "#DCEBFF"]
  },

  /* 3. 夜间护眼深色 */
  night: {
    label: "夜间护眼深色",
    vars: {
      bg1:"#151A24", bg2:"#1E2635", panel:"#222B3A", ink:"#E6EAF2", sub:"#93A0B4",
      primary:"#7C93FF", primaryInk:"#10131A", soft:"#2C374A", line:"#333E52",
      ok:"#4CC38A", bad:"#FF6369", radius:"14px",
      font:'"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif'
    },
    png: ["#151A24", "#232C3D"]
  },

  /* 4. 黑板粉笔风 */
  chalk: {
    label: "黑板粉笔风",
    vars: {
      bg1:"#1E3B2C", bg2:"#2C5340", panel:"#254A3B", ink:"#F2F6EF", sub:"#A9C3B4",
      primary:"#F5E7B2", primaryInk:"#1E3B2C", soft:"#2F5B45", line:"#3A6A52",
      ok:"#8FD9A8", bad:"#FF9B9B", radius:"8px",
      font:'"Kaiti SC","STKaiti","KaiTi","Microsoft YaHei",serif'
    },
    png: ["#1E3B2C", "#2C5340"]
  },

  /* 5. 紫气东来（主色 RGB 112,15,150） */
  grape: {
    label: "紫气东来",
    vars: {
      bg1:"#F3E7FA", bg2:"#E6CDF2", panel:"#FFFFFF", ink:"#2A0B38", sub:"#7A5A88",
      primary:"#700F96", primaryInk:"#FFFFFF", soft:"#EFDCF8", line:"#E3CFEE",
      ok:"#1E8E5A", bad:"#C62E47", radius:"16px",
      font:'"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif'
    },
    png: ["#700F96", "#C06BD8"]
  }
};


/* ============================ 六、题库 ================================
 *
 * 字段说明（照着填就行，不需要的字段删掉也可以）：
 *
 *   contentTag : 内容标签，如 "整活题" / "正经题" / "知识题" / "常识题"
 *   type       : 题型，只能是 "单选" / "多选" / "不定项"
 *   secretTag  : 【彩蛋】填了就会把上面两个标签整个盖掉，只显示它。
 *                出题人想整活时用，留空 "" 就是正常显示。
 *   text       : 题干
 *   image      : 配图路径，如 "images/q1.jpg"；不用图就留空 ""
 *   comment    : 提交后显示的整体评价（可留空）
 *   options    : 选项数组
 *       text     : 选项文字
 *       score    : 分值，可正可负，如 5 / -1 / 0
 *       feedback : 选中这个选项后单独弹给他的话
 *
 * 计分规则：单选 = 所选那一项的分值
 *           多选/不定项 = 所选各项分值相加（可以为负，总分也可以为负）
 *           一个都不选 = 0 分，也算一种作答
 *
 * 理论最高不用手动填，程序自动算：单选看分最高的选项，
 * 多选/不定项把所有加分项加起来；全是扣分项时，
 * 最高就是什么都不选的 0 分。最后按「实际得分 ÷ 理论最高」
 * 的得分率评称号。
 * -------------------------------------------------------------------- */
window.QUESTION_BANK = [

  {
    id: 1,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "你认为我们学校的学生经常把我们学校的名字（玉溪一中附属中学、红塔中学）简称为？",
    image: "",
    options: [
      { text: "玉附", score: 2,  feedback: "出题人觉得很好听，所以给你两分，但它并不普遍。" },
      { text: "红中", score: -1, feedback: "哇，老师，你不觉得很难听吗？" },
      { text: "塔中", score: 5,  feedback: "恭喜老师，你答对了。" },
      { text: "一附", score: 1,  feedback: "出题人觉得还行所以决定给一分，但悲伤的是老师你答错了。" }
    ],
    comment: "这题的正确率据说能测出你在学校待了多久。"
  },

  {
    id: 2,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我们学校的校门开在哪条路上？",
    image: "",
    options: [
      { text: "红塔大道1号", score: 0, feedback: "红塔大道上确实热闹，但那不是我们。" },
      { text: "聂耳东路13号", score: 5, feedback: "对。学校由原玉溪第二职业高级中学北校区改建，就在聂耳东路13号。" },
      { text: "东风中路66号", score: 1, feedback: "东风中路是我们学区划片的一条边界线，不是校址。方向对了，门牌错了。" },
      { text: "玉江大道88号", score: -1, feedback: "这个门牌号听起来像某个小区，不是学校。" }
    ],
    comment: "占地 69.51 亩，位于红塔区凤凰街道。"
  },

  {
    id: 3,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我们学校是哪一天正式开学、举行首届开学典礼的？",
    image: "",
    options: [
      { text: "2025年9月2日", score: -2, feedback: "整整晚了一年，老师你这记忆时间戳有问题。" },
      { text: "2024年7月10日", score: 2, feedback: "7月10日是红塔区人民政府与玉溪一中签订合作办学协议的日子，是创办日不是开学日，给两分。" },
      { text: "2024年9月1日", score: 1, feedback: "差一天。9月1日前后是报到，典礼在9月2日上午九点。" },
      { text: "2024年9月2日", score: 5, feedback: "对。当天上午九点，全体师生在绿茵操场举行了升旗仪式和开学典礼。" }
    ],
    comment: "首届招收 8 个班，共 400 名新生。"
  },

  {
    id: 4,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "我们学校的校训是哪一句？",
    image: "",
    options: [
      { text: "人生在勤，志达天下", score: 1, feedback: "这是历城二中的校训啊老师" },
      { text: "入生在立，行达天下", score: -1, feedback: "审题啊！" },
      { text: "人生在立，行达天下", score: 5, feedback: "正是。学校每一篇推文的结尾都在用这句话。" },
      { text: "踏出校门一步，肩负红塔荣辱", score: 3, feedback: "这句也是学校反复强调的话，被称为“魂”，但校训是上面那句。给三分。" }
    ],
    comment: "学校以“立行”为根，以“致远”为志。"
  },

  {
    id: 5,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "首届开学时，学校一共配备多少位教职工？其中一半来自哪里？",
    image: "",
    options: [
      { text: "17 位，来自全国引进", score: 0, feedback: "17 是 2024 年教师引进公告里的人数，不是首届教职工总数。" },
      { text: "30 位，一半来自玉溪一中", score: 2, feedback: "人数记少了，实际是 32 位，且只有一半来自玉溪一中。" },
      { text: "32 位，一半来自玉溪一中", score: 5, feedback: "完全正确。首届开学时共配备 32 位教职工，其中一半为玉溪一中在职在编教师，另一半通过市内选调择优录取。" },
      { text: "50 位，全部校内选调", score: -1, feedback: "人数和来源都错了。" }
    ],
    comment: "在教师职称、年龄及学科搭配上均做了优质均衡配置。"
  },

  {
    id: 6,
    contentTag: "常识题",
    type: "单选",
    secretTag: "色彩大考",
    text: "我校主题配色的主色是紫色，它正确的 RGB 值是哪一组？",
    image: "",
    options: [
      { text: "RGB(102, 8, 116)", score: -1, feedback: "差一点点，但这是清华紫。肉眼几乎分不出来，可不是我们的。" },
      { text: "RGB(148, 7, 10)", score: -2, feedback: "这是北大红。老师，我们是红塔，不是博雅塔。" },
      { text: "RGB(112, 15, 150)", score: 5, feedback: "正是。深沉又有精神的紫红，主题里叫“紫气东来”。" },
      { text: "#700F96", score: 4, feedback: "写法不同，其实是同一个颜色的十六进制表达。换算过来正是 RGB(112,15,150)，给四分。" },
      { text: "RGB(0, 176, 240)", score: -1, feedback: "这是一支很精神的蓝，可惜颜色都跑偏了。" }
    ],
    comment: "换主题时右上角点“主题”，最后一套“紫气东来”就是这个颜色。"
  },

  {
    id: 7,
    contentTag: "正经题",
    type: "多选",
    secretTag: "",
    text: "（多选）关于我校的办学与管理模式，下面哪些说法是对的？",
    image: "",
    options: [
      { text: "民办寄宿制学校，自主招生", score: -3, feedback: "公办，老师这个记错了要扣分。" },
      { text: "公办全日制初级中学", score: 3, feedback: "对，红塔区教育体育局主管、玉溪一中主办。" },
      { text: "封闭式、寄宿制管理", score: 3, feedback: "对，学校坚持教育与生活管理合一。" },
      { text: "初高六年完中", score: -3, feedback: "啊？我咋不知道" }
    ],
    comment: "办学目标是“全市第一、全省一流”。"
  },

  {
    id: 8,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "老师，你想作弊吗？",
    image: "",
    options: [
      { text: "想", score: 0, feedback: "那您好好想想。" },
      { text: "我现在就要！！", score: -2, feedback: "想什么呢，您可是要教导学生的。" },
      { text: "额，算了", score: 1, feedback: "坚定一点嘛。" },
      { text: "不！！！", score: 5, feedback: "这才对嘛。" }
    ],
    comment: "录进去了，学生会不会看到我不知道。"
  },

  {
    id: 9,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "出题人很讨厌为难学生的试卷。您觉得，出题人想让您得分吗？",
    image: "",
    options: [
      { text: "不想", score: 1, feedback: "原本还想多给点呢，我有那么坏吗" },
      { text: "我哪知道", score: -1, feedback: "要有取悦阅卷人的勇气与决心啊" },
      { text: "那绝对的", score: 2, feedback: "那还说啥，给点" },
      { text: "出题人一定有他的道理", score: 0, feedback: "出题人当年在考场上也是这么想的" }
    ],
    comment: "这题考的不是脑子。"
  },

  {
    id: 10,
    contentTag: "整活题",
    type: "多选",
    secretTag: "",
    text: "（多选）下面这些话，你对学生说过几句？",
    image: "",
    options: [
      { text: "“我再讲最后一题”", score: -2, feedback: "然后讲了二十分钟。学生早就看穿了。" },
      { text: "“当年我带过一个学生，也就是你们xx届的师兄师姐”", score: +1, feedback: "老师，咱就是说，吹牛就吹牛，能少拖堂不" },
      { text: "“你们是我带过最差的一届”", score: -3, feedback: "每一届都听过这句。这句话的保质期是一年。" },
      { text: "“这道题我都不用看答案”", score: -1, feedback: "吹牛。但你确实比他们快。" }
    ],
    comment: "一个都没选的老师，要么是真的没说过，要么是不肯承认。两种情况都记 0 分；这题能拿到的分本来就不多，想多拿还得自己从选项里挑。"
  },

  {
    id: 11,
    contentTag: "整活题",
    type: "单选",
    secretTag: "不动就不扣分",
    text: "（可以不选）下面四个选项，选哪个都要扣分。你打算怎么办？",
    image: "",
    options: [
      { text: "选 A，认了", score: -1, feedback: "明知道要扣还选，实在。" },
      { text: "选 B，试试", score: -1, feedback: "试试就试试，扣了也认。" },
      { text: "选 C，我偏要", score: -1, feedback: "叛逆期来了是吧。" },
      { text: "选 D，随便", score: -1, feedback: "随便也是要付钱的。" }
    ],
    comment: "交白卷的人拿 0 分，已经是这题的最高分；这题不往理论最高里凑数。这就是本场的设计。"
  },

  {
    id: 12,
    contentTag: "常识题",
    type: "不定项",
    secretTag: "不知道也是一种答案",
    text: "（不定项，可以一个都不选）早读时一个学生把书立起来、脑袋一点一点的。他可能怎么了？",
    image: "",
    options: [
      { text: "没睡醒", score: 3, feedback: "八成是这个。觉是睡不完的老师！" },
      { text: "脑袋一抬一落，想cos石油钻井", score: 1, feedback: "也有可能，万一他/她想去油田工作呢" },
      { text: "身体不舒服", score: 2, feedback: "有，但比例小。而且这种情况他一般会举手说。" },
      { text: "在梦里背单词", score: -2, feedback: "老师，梦里背的单词醒来一个都不记得。" }
    ],
    comment: "一个都不选？倒也没比猜一个体面。"
  },

  {
    id: 13,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "晚自习教室后排传来窸窸窣窣的声音，你回头一看，学生齐刷刷坐直了。最可能是？",
    image: "",
    options: [
      { text: "在讨论题", score: -1, feedback: "有这种好事？那你不用回头了。" },
      { text: "在干亏心事", score: 3, feedback: "多半是这个" },
      { text: "有人在哭", score: 1, feedback: "如果是这个，您得走过去，不能只回头看一眼。" },
      { text: "什么都没发生，你幻听", score: -1, feedback: "三十年教龄之前，别下这个结论。" }
    ],
    comment: "他们坐直的速度，和心虚的程度成正比。"
  },

  {
    id: 14,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "一个学生在走廊上远远看见你，突然拐进了另一条道。他多半是？",
    image: "",
    options: [
      { text: "没看见你", score: -1, feedback: "看见了的。他拐弯的那个角度太刻意了。" },
      { text: "作业没写，心虚", score: 4, feedback: "经典。也有可能是上次被你叫去谈话过。" },
      { text: "急着上厕所", score: 2, feedback: "有可能，但真急的话会直接跑过去，不会拐弯。" },
      { text: "想给你一个惊喜", score: -2, feedback: "这个年纪的学生，不会用这种方式表达惊喜。" }
    ],
    comment: "如果你想通了这一点，下次别在走廊尽头等他。"
  },

  {
    id: 15,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "学生说“老师，我作业忘带了”。据你观察，这句话的可靠程度是？",
    image: "",
    options: [
      { text: "十次里有一次是真的", score: 3, feedback: "这是多数老师的经验值。剩下九次，本子还是白的。" },
      { text: "十次里有八次是真的", score: -2, feedback: "老师，你太温柔了。温柔会被反复利用。" },
      { text: "一次都不是真的", score: 1, feedback: "也不至于" },
      { text: "他们从不说这句话", score: -1, feedback: "那说明你还没开始收作业。" }
    ],
    comment: "有时候吧，宽容一点，万一他/她会补呢"
  },

  {
    id: 16,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "课间十分钟，最先冲出教室的那批学生，多半是去？",
    image: "",
    options: [
      { text: "食堂", score: 5, feedback: "对。铃响前十分他们就准备了。" },
      { text: "办公室问问题", score: 1, feedback: "有，但他们是走过去的，不是冲过去的。" },
      { text: "操场打球", score: 2, feedback: "那是男生的另一个分支。但食堂的排在他们前面。" },
      { text: "厕所", score: 3, feedback: "合理。但厕所的人流是匀速的，食堂是脉冲式的。" },
      { text: "回宿舍拿东西", score: -2, feedback: "课间十分钟跑不了一个来回，除非他本来就想溜。" }
    ],
    comment: "区分方法：冲过去的是找吃的，走过去的是问问题。"
  },

  {
    id: 17,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "自习课你从前门走进去，全班在三秒内安静下来。这说明？",
    image: "",
    options: [
      { text: "他们本来就在学习", score: 0, feedback: "本来就在学的话，不需要三秒。他们根本不会抬头。" },
      { text: "门口有人放风", score: 5, feedback: "对。而且放风的那个人，此刻坐得最端正。" },
      { text: "你气场强", score: 1, feedback: "气场不气场另说，放风的人是真的存在。" }
    ],
    comment: "找那个坐得最端正的，一般就是。"
  },

  {
    id: 18,
    contentTag: "常识题",
    type: "不定项",
    secretTag: "学生视角",
    text: "（不定项）寄宿制学校，学生最想念家里的什么？",
    image: "",
    options: [
      { text: "家里的饭", score: 4, feedback: "第一周就开始想。食堂再好吃，也不是妈做的那个味。" },
      { text: "自己的床", score: 4, feedback: "宿舍的床硬，而且上铺爬上去麻烦。" },
      { text: "不用排队洗澡", score:0, feedback: "不至于，塔中的宿舍有双人洗澡间" },
      { text: "学校的作业", score: -3, feedback: "这个不用想，天天见。" }
    ],
    comment: "他们很少说出口。但周日下午返校时，书包里塞的东西会变多。"
  },

  {
    id: 19,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "学生课桌上贴得最多的东西是什么？",
    image: "",
    options: [
      { text: "课程表", score: 1, feedback: "有，但通常贴在桌角，而且已经卷边了。" },
      { text: "偶像贴纸", score: 3, feedback: "多。而且会为了贴纸的位置跟同桌吵架。" },
      { text: "自己写的目标分数", score: 1, feedback: "大抵有。写得比考得高，但这不重要——写了就有用。" },
      { text: "什么都没有", score: 5, feedback: "因为有的班要换座位" }
    ],
    comment: "谁知道呢，反正出题人从来不贴"
  },

  {
    id: 20,
    contentTag: "整活题",
    type: "单选",
    secretTag: "互联网谜踪",
    text: "新老师第一次在网上搜“红塔中学”三个字，最可能搜出来什么？",
    image: "",
    options: [
      { text: "一堆红塔山香烟的链接", score: 1, feedback: "有一定生活经验，但排在最前面的通常不是这个。" },
      { text: "玉溪一中的官网", score: 2, feedback: "会混在结果里，但不是最显眼的那个。" },
      { text: "我们学校，毫无干扰", score: -2, feedback: "太天真了。不信你现在打开手机搜一下。" },
      { text: "江苏省宜兴市红塔中学", score: 5, feedback: "踩过坑吧。那边还有个公众号叫“红中在线”，每年也办体育节。" }
    ],
    comment: "新教师入职培训第一题。"
  },

  {
    id: 21,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "我校首届体育艺术节在哪几天举行？",
    image: "",
    options: [
      { text: "2025年11月11日至13日", score: 2, feedback: "这是第二届体艺节的时间，主题是“行者”。首届比它早一整年。" },
      { text: "3月23日至4月13日", score: -1, feedback: "那是 2028 届校园篮球赛的时间，看清楚题干。" },
      { text: "2024年11月13日至15日", score: 5, feedback: "对。三天，主题是“少年”。" },
      { text: "9月2日至9月6日", score: 1, feedback: "那是首届开学后开展入学教育的时间。" }
    ],
    comment: "开幕式上，初一（2）班担任彩旗队入场。"
  },

  {
    id: 22,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我校第二届体育艺术文化节的主题是哪一个？",
    image: "",
    options: [
      { text: "少年", score: 2, feedback: "这是首届（2024年）的主题。记住：先少年，后行者。" },
      { text: "弘美", score: -1, feedback: "“弘美体育节”是江苏那所红塔中学的，你又搜串了。" },
      { text: "追梦", score: 1, feedback: "《追梦赤子心》是级歌，不是体艺节主题。" },
      { text: "行者", score: 5, feedback: "对。“行者”不仅是赶路的人，更是创造风景的人。" }
    ],
    comment: "学校原话：“立行”不仅是当下的行动，更是面向未来的品格。"
  },

  {
    id: 23,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年2月21日，我校启动的教学改革专题培训，主讲人是谁？",
    image: "",
    options: [
      { text: "王加平", score: 2, feedback: "校长上过研讨课，但这第一场培训不是他讲的。" },
      { text: "邓瑞", score: 1, feedback: "邓瑞副校长的研讨课排在后面，3月21日。" },
      { text: "李猛", score: 5, feedback: "对。教学副校长李猛主讲“教学评一体化”，拉开改革序幕。" },
      { text: "杨智勇", score: -1, feedback: "书记管的是另一头，不主讲教学培训。" }
    ],
    comment: "之后王加平校长、邓瑞副校长都亲自上过研讨课。"
  },

  {
    id: 24,
    contentTag: "知识题",
    type: "单选",
    secretTag: "同一天，两件事",
    text: "2025年12月18日，学校发生了两件事。一件是第一届新团员入团仪式，另一件是？",
    image: "",
    options: [
      { text: "新建学生宿舍楼正式动工", score: 3, feedback: "宿舍楼确实是12月动工的，但不是18日当天这两件之一。" },
      { text: "邢台三中名师团队到校做教学诊断", score: 5, feedback: "对。同一天，河北邢台三中的名师团队来校做“教学评一体化”诊断。" },
      { text: "重庆大学城一中校长来讲座", score: 2, feedback: "那是11月29日的事，早了近一个月。" },
      { text: "元旦联欢晚会", score: -1, feedback: "那是12月31日，而且是在玉溪一中办的。" }
    ],
    comment: "这题答对，说明你把学校的年度回顾读到了最后一段。"
  },

  {
    id: 25,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年11月29日，哪位校外专家到我校开展专题讲座？",
    image: "",
    options: [
      { text: "重庆大学城一中校长王海洋", score: 5, feedback: "对。讲的是“教学评一体化落地路径”，专门剖析评价工具的设计。" },
      { text: "聂耳小学杨翠英校长", score: 2, feedback: "杨校长来过，但是5月8日带团队来搞小初衔接教研。" },
      { text: "溪汇中学的校长", score: -1, feedback: "溪汇中学是4月10日来访交流，没办讲座。" },
      { text: "邢台三中的名师", score: 1, feedback: "邢台三中团队是12月18日来的，不是11月29日。" }
    ],
    comment: "同期还有“云岭教师发展协同提质计划”名校长跟岗研修。"
  },

  {
    id: 26,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年9月19日，学校启动了哪项教师培养机制？",
    image: "",
    options: [
      { text: "新教师培训", score: 1, feedback: "新教师培训是7月6日至8日，暑假里的事。" },
      { text: "青蓝工程", score: 5, feedback: "对。以老带新、师徒结对，是匠心的接续。" },
      { text: "教学评一体化", score: 2, feedback: "那是2月就启动了，比这早七个月。" },
      { text: "家校共读一本书", score: -1, feedback: "那是4月25日到5月12日的事。" }
    ],
    comment: "青蓝相继，薪火相传。"
  },

  {
    id: 27,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年4月，2027届5班代表我校参加玉溪一中的班会竞赛课。带班老师是？",
    image: "",
    options: [
      { text: "陈庆蓉", score: 5, feedback: "对。她的《溯源·知行·铭心——友善成长的三重修炼》拿去参赛了。" },
      { text: "李艳", score: 2, feedback: "李艳老师是德育主任，负责宣布体艺节奖项，不是这节课。" },
      { text: "罗榕", score: -1, feedback: "罗榕是篮球赛那篇推文的文字编辑。" },
      { text: "郑阳", score: 1, feedback: "郑阳也写推文，但不带这个班。" }
    ],
    comment: "那届是玉溪一中第二十二届“健心杯”。"
  },

  {
    id: 28,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年6月1日，学校为七年级学生办的成长礼，主题是什么？",
    image: "",
    options: [
      { text: "童话终章·双语记忆与永恒的童年宝藏", score: 5, feedback: "对。学生用英语演童话，家长送“时光胶囊”。" },
      { text: "我和祖国共庆生", score: 1, feedback: "那是10月的主题班会。" },
      { text: "元旦充电堡", score: -1, feedback: "那是12月31日的活动，差半年。" },
      { text: "弘毅以立学，笃行启新程", score: 2, feedback: "这是初2028届升初二时的年级主题，不是成长礼。" }
    ],
    comment: "童年兑换仪式上，学生给家长颁“最佳童年守护者”。"
  },

  {
    id: 29,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "学校倡导的育人主线被概括为“初中三年必做的十件事”，它属于哪方面的工作？",
    image: "",
    options: [
      { text: "教学，课程建设", score: 1, feedback: "课程建设另有一套：五大学科竞赛课程、初高中贯通培养。" },
      { text: "德育，活动育人", score: 5, feedback: "对，这就是德育口的活动育人主线。" },
      { text: "后勤，寄宿管理", score: -2, feedback: "后勤管的不是这个。" },
      { text: "招生，宣传口径", score: -1, feedback: "拿来招生宣传是顺带的效果，本职还是德育。" }
    ],
    comment: "目的是让学生身心健康、全面发展。"
  },

  {
    id: 30,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "下面哪句话被称为我校的“魂”？",
    image: "",
    options: [
      { text: "踏出校门一步，肩负红塔荣辱", score: 5, feedback: "正是。新年贺词里写得很清楚：以校训为根，以这句话为魂。" },
      { text: "人生在立，行达天下", score: 2, feedback: "这是校训，是“根”不是“魂”。别搞混。" },
      { text: "立德立志，立学立身", score: 1, feedback: "这是校园里另一组“四立”，也对，但不是那一句“魂”。" },
      { text: "弘毅以立学，笃行启新程", score: 0, feedback: "这是初2028届升初二时的年级主题。" }
    ],
    comment: "校训是根，荣辱是魂，二者别记串。"
  },

  {
    id: 31,
    contentTag: "整活题",
    type: "多选",
    secretTag: "出题人已放弃治疗",
    text: "（多选）运动会当天，老师在操场上最常做的事有哪些？",
    image: "",
    options: [
      { text: "坐在看台上改作业", score: -2, feedback: "这位老师，运动会是用来放松的！" },
      { text: "举着喇叭喊自己班的学生", score: 3, feedback: "嗓子是老师最重要的教学设备，请妥善保管。" },
      { text: "被太阳晒到怀疑人生", score: 2, feedback: "防晒霜已经在教务处抽屉里躺了三年。" },
      { text: "偷偷讨论哪个班口号喊得最响", score: 2, feedback: "别装了，大家都听到了。" }
    ],
    comment: "勾了「举着喇叭喊自己班的学生」的同学，赛后到教务处领一瓶润喉糖；改作业那项就别勾了。"
  },

  {
    id: 32,
    contentTag: "知识题",
    type: "不定项",
    secretTag: "",
    text: "（不定项）下面哪些是我校真实举办过的活动？答案可能不止一个。",
    image: "",
    options: [
      { text: "全校师生环红塔山徒步露营", score: -3, feedback: "没有这回事，老师你想多了。" },
      { text: "“立行致远·以篮聚力”校园篮球赛", score: 4, feedback: "对，2028 届篮球赛，决赛后全场齐唱《追梦赤子心》。" },
      { text: "“家校聚力，立行未来”户外家校团建", score: 4, feedback: "对，趣味抢水、气球列车、充气毛毛虫、动力同心绳。" },
      { text: "“少年”主题首届体育艺术节", score: 4, feedback: "对，首届体艺节的主题就是“少年”。" }
    ],
    comment: "德育以“初中三年必做的十件事”为主线，四季浸润、五育并举。"
  },

  {
    id: 33,
    contentTag: "知识题",
    type: "不定项",
    secretTag: "",
    text: "（不定项）关于我校学生在区级比赛中的表现，下面哪些说法是真的？",
    image: "",
    options: [
      { text: "从来没有参加过区级比赛", score: -2, feedback: "这就过分了，名次是实打实拼出来的。" },
      { text: "2026年区校园足球联赛初中男子组第二名", score: 4, feedback: "是真的。冠军是玉溪第四中学，我们第二。" },
      { text: "包揽了所有项目的第一名", score: -3, feedback: "老师，谦虚一点，我们才办了两届多。" },
      { text: "篮球赛决赛后全场齐唱《追梦赤子心》", score: 4, feedback: "是真的，李副校长带全场大合唱，那届篮球赛最动人的一幕。" }
    ],
    comment: "联赛高中男子组第一名是玉溪三中，别记串了。"
  },

  {
    id: 34,
    contentTag: "知识题",
    type: "不定项",
    secretTag: "",
    text: "（不定项）下面哪些说法是关于我校学生的真实情况？答案可能不止一个，也可能只有一个。",
    image: "",
    options: [
      { text: "全体都在认真做眼保健操", score: -3, feedback: "老师，你抬头看一眼窗边那排。" },
      { text: "跑完 1500 米还能上第二节课", score: 4, feedback: "年轻真好，老师当年的 1500 米是走下来的。" },
      { text: "广播操做得像在跳街舞", score: 3, feedback: "艺术节见，这位同学。" }
    ],
    comment: "不信的话，下课间操去走廊站两分钟。"
  },

  {
    id: 35,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我校的首任校长是哪一位？",
    image: "",
    options: [
      { text: "李猛", score: 1, feedback: "李猛是教学副校长，别抢校长的椅子。" },
      { text: "杨智勇", score: 2, feedback: "杨智勇是学校书记，常出现在推文终审一栏。" },
      { text: "王加平", score: 5, feedback: "对。首届开学典礼上就是他致辞的。" },
      { text: "赖汝贵", score: -1, feedback: "这位是红塔区教育体育局局长，管我们，但不驻我们学校。" }
    ],
    comment: "推文的“终审”一栏常年是：杨智勇、王加平。"
  },

  {
    id: 36,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年学校启动“家校共读一本书”活动，读的是哪一本？",
    image: "",
    options: [
      { text: "《追梦赤子心》", score: -1, feedback: "那是一首歌，2028届的级歌，不是书。" },
      { text: "《聂耳》", score: 0, feedback: "那是我校组织师生观看的花灯剧，不是读的书。" },
      { text: "《男孩、鼹鼠、狐狸和马》", score: 5, feedback: "对。学生、家长、教师三方共读，温暖哲思照亮教育本质。" },
      { text: "《童年》", score: 1, feedback: "书名很应景，但不是我们读的那一本。" }
    ],
    comment: "4月25日到5月12日。"
  },

  {
    id: 37,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我校目前开设了多少个特色社团？",
    image: "",
    options: [
      { text: "16 个", score: 0, feedback: "这个数记串了，首届招的是 8 个班；社团目前是 37 个。" },
      { text: "30 个", score: 1, feedback: "30 是规划班级数，不是社团数。" },
      { text: "37 个", score: 5, feedback: "对。我校目前共开设 37 个特色社团，覆盖话剧、花灯等多个门类。" },
      { text: "50 个以上", score: -1, feedback: "多估了，目前是 37 个，还没到这个数。" }
    ],
    comment: "云南网报道里专门提过这个数字。"
  },

  {
    id: 38,
    contentTag: "知识题",
    type: "多选",
    secretTag: "",
    text: "（多选）下面哪些人是我校的校级领导？",
    image: "",
    options: [
      { text: "赖汝贵", score: -2, feedback: "这位是红塔区教育体育局局长，是上级，不是本校领导。" },
      { text: "王加平", score: 3, feedback: "对，校长。" },
      { text: "杨智勇", score: 3, feedback: "对，学校书记。" },
      { text: "李猛", score: 3, feedback: "对，教学副校长。" },
      { text: "陈庆蓉", score: -1, feedback: "陈庆蓉老师是班主任，带班参加过“健心杯”班会竞赛，不是校级领导。" },
      { text: "邓瑞", score: 3, feedback: "对，副校长。也常负责推文的文字编辑与初审——顺便说一句，他还是本答题系统的管理员。" }
    ],
    comment: "错选一位，说明你还没认真看过公众号的落款。"
  },

  {
    id: 39,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "我校 2028 届（现初二年级）的同学，是什么时候入校的？",
    image: "",
    options: [
      { text: "2024年8月", score: 1, feedback: "那是首届 2027 届的入学教育时间，早了一年。" },
      { text: "2025年8月23日至29日", score: 5, feedback: "对。这几天苦乐交织的入学教育之后，他们身上就印上了红塔少年的底色。" },
      { text: "2026年8月", score: -1, feedback: "那是 2029 届的，不是 2028 届。" },
      { text: "2025年9月2日", score: 2, feedback: "9月2日是首届开学典礼的日子，2028届的入学教育在8月下旬就开始了。" }
    ],
    comment: "2027届是首届，2028届是第二届，两届别混。"
  },

  {
    id: 40,
    contentTag: "知识题",
    type: "不定项",
    secretTag: "",
    text: "（不定项）下面哪些事是我校在 2025 年真实做过的？",
    image: "",
    options: [
      { text: "承办省级高考阅卷工作", score: -3, feedback: "我们是初中，不承办高考阅卷。" },
      { text: "组织全校师生观看花灯剧《聂耳》", score: 4, feedback: "对，7月1日建党节，在艺术浸润中做品格培养。" },
      { text: "举行第一届新团员入团仪式", score: 4, feedback: "对，12月18日，新团员在团旗前庄严宣誓。" },
      { text: "新建学生宿舍楼正式动工", score: 4, feedback: "对，2025年12月动工，进一步优化寄宿生活环境。" }
    ],
    comment: "同年12月31日还办了“元旦充电堡”师生同乐活动。"
  },

  {
    id: 41,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "学校的“四立”指的是哪四个字？",
    image: "",
    options: [
      { text: "比学习、比纪律、比卫生、比出操", score: 1, feedback: "这是班级日常评比的“四比”，不是“四立”。" },
      { text: "勤问近思、博学笃志", score: 0, feedback: "这是学风标语，也不是“四立”。" },
      { text: "立德、立志、立学、立身", score: 5, feedback: "正是。校园里常年挂着这八个字。" },
      { text: "有理想信念、有道德情操、有扎实学识、有仁爱之心", score: 2, feedback: "这是“四有好老师”标准，答错了但方向不错。" }
    ],
    comment: "立德立志，立学立身——和校训的“立”是一脉相承的。"
  },

  {
    id: 42,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "学校改扩建项目的总投资约是多少？",
    image: "",
    options: [
      { text: "868 万元", score: -1, feedback: "少了一个零，这点钱修不了 69.51 亩。" },
      { text: "998244353 亿元", score: -2, feedback: "我们没那么壕。" },
      { text: "1.5 亿元", score: 0, feedback: "这个数字凭空来的，不给分。" },
      { text: "8680 万元", score: 5, feedback: "对。分两期建设，一期在2024年8月20日前完工。" }
    ],
    comment: "二期工程计划 2025 年 1 月启动。"
  },

  {
    id: 43,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "我校首届招收的学生，是哪一届？",
    image: "",
    options: [
      { text: "2028 届", score: 2, feedback: "2028届是第二届，2025年8月入学。差一届，给两分。" },
      { text: "2027 届", score: 5, feedback: "对。2024年9月入学的首届8个班，2027年毕业。" },
      { text: "2026 届", score: -1, feedback: "早了一届，那时候学校还没创办。" },
      { text: "2029 届", score: -2, feedback: "那是更晚的学弟学妹了。" }
    ],
    comment: "首届毕业生2027年才中考，所以现在还没有“首届中考成绩”这种东西。"
  },

  {
    id: 44,
    contentTag: "常识题",
    type: "单选",
    secretTag: "",
    text: "我校校园占地面积是多少？",
    image: "",
    options: [
      { text: "69.51 亩", score: 5, feedback: "对，这个数字很具体，记住它。" },
      { text: "86.8 亩", score: 1, feedback: "你把投资额 8680 万记成面积了。" },
      { text: "150 亩", score: -1, feedback: "翻了一倍多，我们没那么大。" },
      { text: "998244353 亩", score: -4, feedback: "这得多大？" }
    ],
    comment: "由原玉溪第二职业高级中学北校区闲置校舍改建而成。"
  },

  {
    id: 45,
    contentTag: "正经题",
    type: "不定项",
    secretTag: "",
    text: "（不定项）作为玉溪一中的附属初中，我校在课程上做了哪些探索？",
    image: "",
    options: [
      { text: "开展五大学科竞赛课程", score: 4, feedback: "对，学有余力的同学可以走竞赛这条路。" },
      { text: "适当前置奥赛、强基课程内容", score: 4, feedback: "对，遵循拔尖创新人才培养规律，做初高中衔接。" },
      { text: "小初高贯通式培养", score: 4, feedback: "对，这是创办这所学校的初衷之一。" },
      { text: "取消中考，直接升入玉溪一中", score: -3, feedback: "没有这种好事，老师你想多了。" }
    ],
    comment: "目标是探索初高中一体化发展与跨学段集团化办学。"
  },

  {
    id: 46,
    contentTag: "知识题",
    type: "单选",
    secretTag: "",
    text: "2025年11月3日至7日，哪个项目到我校进行跟岗研修？",
    image: "",
    options: [
      { text: "“云岭教师发展协同提质计划”培训项目（名校长）", score: 5, feedback: "对。学校分享了德育管理与课程建设经验。" },
      { text: "“国培计划”乡村教师访学项目", score: -1, feedback: "不是这个名目。" },
      { text: "玉溪市学科基地校教学诊断培训", score: 2, feedback: "名字接近，但那是11月29日的事，不是11月初。" },
      { text: "云南省校长任职资格培训", score: 0, feedback: "没这个项目。" }
    ],
    comment: "同期学校承办了市级学科基地校课堂教学改革质量提升培训会。"
  },

  {
    id: 47,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "学生私下里给老师起外号，多半依据什么？",
    image: "",
    options: [
      { text: "老师的名字改变", score: 4, feedback: "对。“六涛”“banana”这类，一学一个准。" },
      { text: "一些意外事件", score: 3, feedback: "也有。这种外号一般来说最持久。" },
      { text: "老师的学历", score: -2, feedback: "这个他们不关心，也很少知道。" }
    ],
    comment: "知道了也别去问。问了他们会换一个，你更不知道。"
  },

  {
    id: 48,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "运动会上，学生喊得最响的口号是给谁的？",
    image: "",
    options: [
      { text: "给本班参赛的同学", score: 5, feedback: "对。而且是给跑在最后那个喊得最响。" },
      { text: "给班主任", score: 2, feedback: "喊，但那是起哄，不是加油。" },
      { text: "给裁判老师", score: -1, feedback: "给裁判的那不叫加油，叫施压。" },
      { text: "给自己", score: 1, feedback: "看台上的学生喊给自己，那叫发泄。" }
    ],
    comment: "跑在最后那个同学冲过终点时的音量，是全场峰值。这事每年都一样。"
  },

  {
    id: 49,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "一个平时很闹的学生，最近一周突然安静了。你会先想到？",
    image: "",
    options: [
      { text: "他在憋大招", score: -2, feedback: "老师，这个年纪没有那么多计谋。" },
      { text: "家里出事了", score: 2, feedback: "寄宿制学校，家里的事他们不会主动说。" },
      { text: "被班主任批评了", score: 1, feedback: "有可能，但被批评的反应是烦躁的吐槽，不是安静。" },
      { text: "长大了，开智了", score: 2, feedback: "偶尔真是。但“突然”这两个字，通常不是好事。" },
      { text: "跟好朋友闹翻了", score: 5, feedback: "很常见。我们这个年纪，朋友的事比家里的事更能让他沉默。" }
    ],
    comment: "直接叫他来谈话可能会有用，除非您就是原因。"
  },

  {
    id: 50,
    contentTag: "整活题",
    type: "单选",
    secretTag: "这题不科学",
    text: "如果让你给运动会教师接力赛的队伍起个名，出题人最想看到哪个？",
    image: "",
    options: [
      { text: "红塔荣耀队", score: 2, feedback: "这话你自己说着都不信吧。" },
      { text: "人生在立队", score: 5, feedback: "好好好，校训用上了，出题人很欣慰。" },
      { text: "教职工伙食代表队", score: -2, feedback: "食堂师傅会记在小本子上。" },
      { text: "踏出校门一步队", score: 3, feedback: "有创意，但广播员会念到喘不过气。" }
    ],
    comment: "得分全看出题人当天心情。"
  },

  {
    id: 51,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "运动会期间，老师最需要的装备是什么？",
    image: "",
    options: [
      { text: "一些作业", score: -10, feedback: "老师，放下。" },
      { text: "润喉糖", score: 5, feedback: "喊一天口号全靠它。" },
      { text: "防晒霜", score: 3, feedback: "玉溪的太阳从不跟你商量。" },
      { text: "小喇叭", score: 2, feedback: "隔壁班老师也带了一个。" }
    ],
    comment: "除了第一项，选哪个都能加点分；这题只能挑一个，润喉糖给得最多。"
  },

  {
    id: 52,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "你最想在成绩单上看到哪个称号？",
    image: "",
    options: [
      { text: "🤪 反向天才", score: 5, feedback: "有梗。" },
      { text: "🏆 传奇教师", score: 3, feedback: "格局打开了。" },
      { text: "🌱 重在参与", score: 1, feedback: "很佛系。" },
      { text: "🎓 学霸教师", score: 2, feedback: "中规中矩。" },
      { text: "都不想要，我只想下班", score: 4, feedback: "诚实。反正也不加工资。" }
    ],
    comment: "分数高低不影响下班时间。"
  },

  {
    id: 53,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "本场问答一共 30 道题，你的真实想法是？",
    image: "",
    options: [
      { text: "越多越好，我还想加题", score: 5, feedback: "出题人当场想给你发奖。" },
      { text: "越少越好，最好三道", score: -2, feedback: "诉求听到了，驳回。" },
      { text: "30 道刚刚好", score: 3, feedback: "行，就当是。" },
      { text: "我弃权", score: 0, feedback: "弃权记 0 分，也照样收卷，这就是本场的温柔之处。" }
    ],
    comment: "题量在 questions.js 里一行就能改。"
  },

  {
    id: 54,
    contentTag: "整活题",
    type: "单选",
    secretTag: "",
    text: "现在，只有两个选项。你选哪个？",
    image: "",
    options: [
      { text: "往下走", score: 3, feedback: "行。" },
      { text: "我先歇会儿", score: 3, feedback: "也行。反正进度存住了。" }
    ],
    comment: "这题两个选项都是三分，因为它根本不是在考你。"
  },

  {
    id: 55,
    contentTag: "常识题",
    type: "单选",
    secretTag: "学生视角",
    text: "一个学生拿着卷子来问你“老师，这题为什么扣我分”。他真正想要的是？",
    image: "",
    options: [
      { text: "搞懂这道题", score: 3, feedback: "有一部分是。但这部分通常三句话就能解决。" },
      { text: "把分要回来", score: 5, feedback: "对。他站在这里不走，就是想让你改主意。" },
      { text: "让你看见他在努力", score: 2, feedback: "也有。这种行为是演给办公室里所有老师看的。" },
      { text: "想知道正确答案", score: 2, feedback: "如果是这个，他会先说“老师这题怎么做”，而不是“为什么扣我分”。" },
      { text: "投诉你", score: 1, feedback: "不至于吧。真要投诉，他会去找同学吐槽，哪有贴连开大的。" },
      { text: "找你聊天", score: 1, feedback: "偶尔。一般是课代表。" }
    ],
    comment: "先问他是哪一种，再用不同的方式回答。省时间。"
  },

  {
    id: 56,
    contentTag: "整活题",
    type: "多选",
    secretTag: "",
    text: "（多选）答到这一题，你可能已经有点累了。以下哪些是真的？",
    image: "",
    options: [
      { text: "眼睛有点酸", score: 2, feedback: "换主题，右上角有个深色。" },
      { text: "想去倒杯水", score: 2, feedback: "去。回来进度还在。" },
      { text: "想知道同事考了多少", score: 3, feedback: "人之常情。不过成绩只存在各自电脑上。" },
      { text: "一点也不累", score: -1, feedback: "那你是刚坐下没多久。" }
    ],
    comment: "累了就歇会儿，反正倒计时不管这个。"
  },

{
  id: 57,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "刚上初一，学生最需要老师帮一把的是哪件事？",
  image: "",
  options: [
    { text: "把考试成绩先抓起来", score: 0, feedback: "成绩迟早要抓，可刚进校门连教室都找不顺，先别急着上强度。" },
    { text: "适应新的学习和生活环境", score: 5, feedback: "对。先认路、认课表、认作息，后面才谈得上别的。" },
    { text: "多报几个竞赛", score: 1, feedback: "竞赛有人适合，但不是所有人一进初中就该走这条路。" },
    { text: "少布置点课堂任务", score: -1, feedback: "任务一减，连适应新节奏的机会都一起减了。" }
  ],
  comment: "新环境这一关过了，成绩才有地方落脚。"
},
{
  id: 58,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "带初二，老师最该多留个心眼的是？",
  image: "",
  options: [
    { text: "社团报了几个", score: 1, feedback: "社团要管，但不是初二最让人放心不下的那桩。" },
    { text: "体锻课去没去", score: 1, feedback: "动一动确实能松快点，不过盯这个还盯不到根上。" },
    { text: "学习压力和心理变化", score: 5, feedback: "对。初二看着风平浪静，底下最容易憋事。" },
    { text: "迟到次数", score: -1, feedback: "迟到是露在外头的那截，原因往往不在考勤表上。" }
  ],
  comment: "初二这年，安静不代表没事。"
},
{
  id: 59,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "初三了，学生最指望老师给的是什么？",
  image: "",
  options: [
    { text: "多安排点娱乐活动", score: 0, feedback: "放松要有，可到了初三，光靠玩稳不住人。" },
    { text: "课堂纪律再严一点", score: 2, feedback: "纪律是底子，只加严解决不了心里那点慌。" },
    { text: "再加点考试和练习", score: 1, feedback: "练要练，题海不等于有人给你指路。" },
    { text: "学习规划，加上心理支持", score: 5, feedback: "对。路线有人帮着排，情绪有地方放，这两样最实在。" }
  ],
  comment: "初三要的不只是卷子，还有方向。"
},
{
  id: 60,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "初一、初二、初三，差别最大的其实在哪儿？",
  image: "",
  options: [
    { text: "成长阶段和心理需求", score: 5, feedback: "对。课表变了是小事，人变了才是大事。" },
    { text: "校服款式", score: -1, feedback: "三年同一套校服，人可没停在同一处。" },
    { text: "午饭胃口", score: 0, feedback: "饭量确实会涨，但这算不上最大的差别。" },
    { text: "对校园环境的看法", score: 2, feedback: "看法会变，也是因为人在长，不是因为楼在变。" }
  ],
  comment: "年级换了一级，心里的盘算就换了一套。"
},
{
  id: 61,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "最该让学生养成的习惯，你选哪个？",
  image: "",
  options: [
    { text: "课间对答案", score: 1, feedback: "对两句无妨，可别把十分钟开成答案发布会。" },
    { text: "及时复习、整理错题", score: 5, feedback: "对。听懂不算会，错题回头能自己做出来才算。" },
    { text: "多买几本资料", score: -1, feedback: "资料堆得再高，不翻也长不进脑子里。" },
    { text: "只背考试重点", score: 0, feedback: "背重点能应付一阵，题目换个问法就露馅。" }
  ],
  comment: "听懂到做对，中间还差一次回头。"
},
{
  id: 62,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "学生什么时候最容易把信心丢掉？",
  image: "",
  options: [
    { text: "被老师表扬的时候", score: -1, feedback: "表扬只会让人更有劲，哪有越夸越泄气的。" },
    { text: "参加集体活动的时候", score: 0, feedback: "活动里顶多是累，不至于把信心弄丢。" },
    { text: "跟朋友聊天的时候", score: 0, feedback: "聊天不背这个锅，真磨人的是一直看不到起色。" },
    { text: "努力了好几回，分数还是不动", score: 5, feedback: "对。最难受的不是不会，是下了功夫却看不出变化。" }
  ],
  comment: "看不见进步，比题目难更伤人。"
},
{
  id: 63,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "说到底，什么最能让学生把学校当自己学校？",
  image: "",
  options: [
    { text: "校服统一", score: 0, feedback: "一眼能认出同校的人，可认得出不等于待得住。" },
    { text: "宣传栏办得热闹", score: 1, feedback: "栏子能传话，让人安心的是平时怎么被对待。" },
    { text: "师生相互尊重、愿意沟通", score: 5, feedback: "对。话有人听、事有人商量，比什么布置都管用。" },
    { text: "多办几场大型活动", score: 2, feedback: "活动挺热闹，散场之后留不留得住，还得看日常。" }
  ],
  comment: "归属感是平时攒出来的，不是办一次活动就有的。"
},
{
  id: 64,
  contentTag: "学生视角",
  type: "单选",
  secretTag: "",
  text: "十分钟课间，你觉得该留给学生干什么？",
  image: "",
  options: [
    { text: "再写点作业", score: -1, feedback: "刚下课就接着写，脑子先不干了。" },
    { text: "放松一下、跟同学说说话", score: 5, feedback: "对。喘口气、聊两句，下节课才坐得住。" },
    { text: "预习下一节", score: 1, feedback: "预习能安排，别把每个课间都排满。" },
    { text: "找老师个别辅导", score: 2, feedback: "辅导有用，可替代不了那口喘气的时间。" }
  ],
  comment: "课间就是课间，别顺手改成第 41 分钟。"
},
{
  id: 65,
  contentTag: "学生视角",
  type: "不定项",
  secretTag: "",
  text: "（不定项）学生愿意来参加学校活动，多半是因为什么？",
  image: "",
  options: [
    { text: "能少上一节课", score: 3, feedback: "实话，这条确实有吸引力，不过别只盯着少上课。" },
    { text: "有奖励拿", score: 1, feedback: "奖励能热闹一阵，留不留人还得看活动本身。" },
    { text: "有意思，还能露一手自己的特长", score: 3, feedback: "对。有得玩、有得展示，才会自己想来，不用被通知。" },
    { text: "大家都在报名", score: -2, feedback: "跟着报的不一定是真想去，学生也想自己挑。" }
  ],
  comment: "自己想来和被点名来，是两回事。"
},
{
  id: 66,
  contentTag: "学生视角",
  type: "不定项",
  secretTag: "",
  text: "（不定项）排课后服务、晚自习，得先把哪些事算进去？",
  image: "",
  options: [
    { text: "当天已经有多少作业", score: 2, feedback: "先看看今天背了多少，再加就压垮了。" },
    { text: "放学回家路上安不安全", score: 2, feedback: "这条是前提，天黑得早的时候尤其不能跳过去。" },
    { text: "学生想学什么、缺什么", score: 2, feedback: "各人情况不一样，全按一个时刻表来，谁都不舒服。" },
    { text: "时间拉长，成绩自然就上去", score: -3, feedback: "时间不是橡皮筋，拉得越长不等于学得越好。" }
  ],
  comment: "排之前先问一句：多出来的这一小时，学生用得上吗？"
},
{
  id: 67,
  contentTag: "学生视角",
  type: "不定项",
  secretTag: "",
  text: "（不定项）学生自己安排学习，一般挑哪两个时段？",
  image: "",
  options: [
    { text: "早读前", score: 1, feedback: "有人来得早，但大多数人那会儿还没醒透。" },
    { text: "中午下课后", score: 3, feedback: "对。吃完饭缓一缓，这一小段最好自己支配。" },
    { text: "晚自习前", score: 3, feedback: "也对。到那会儿心定下来了，适合坐下来啃一会儿。" },
    { text: "课间十分钟", score: -1, feedback: "十分钟够喝口水、串个座位，塞不进一整段自习。" }
  ],
  comment: "中午下课后、晚自习前，是两个最常见的空档。"
}

];

/* ============================ 七、加题模板 ============================
 * 复制下面这一整段，粘贴到上面题库的方括号里，改内容即可。
 * 注意：每段之间要有逗号，最后一段后面不要逗号。
 * 理论最高得分不用填，程序按选项分值自动算；全是扣分项时按 0 算。
 * --------------------------------------------------------------------
{
    id: 68,
    contentTag: "整活题",
  type: "单选",
  secretTag: "",
  text: "这里写题干",
  image: "",                 // 要用图就写 "images/你的文件名.jpg"
  options: [
    { text: "选项A", score: 5,  feedback: "选A之后单独弹给他的话" },
    { text: "选项B", score: -1, feedback: "选B之后单独弹给他的话" },
    { text: "选项C", score: 0,  feedback: "选C之后单独弹给他的话" }
  ],
  comment: "提交后显示的整体评价，可留空"
},
-------------------------------------------------------------------- */
