const stage = document.querySelector("#stage");
const quickCards = [...document.querySelectorAll(".quick-card")];
const tabs = [...document.querySelectorAll(".tab")];
const modeButtons = [...document.querySelectorAll(".mode")];
const voiceButton = document.querySelector("#voiceButton");
const voiceText = document.querySelector("#voiceText");
const profileButton = document.querySelector("#profileButton");
const sosButton = document.querySelector("#sosButton");
const todoCount = document.querySelector("#todoCount");
const medSummary = document.querySelector("#medSummary");
const sheet = document.querySelector("#sheet");
const sheetContent = document.querySelector("#sheetContent");
const sheetClose = document.querySelector("#sheetClose");
const appScreen = document.querySelector(".app-screen");

const state = {
  role: "elder",
  view: "home",
  meds: {
    morning: true,
    evening: false,
  },
  checks: {
    id: true,
    medicare: true,
    reports: false,
    prescription: true,
  },
  notices: {
    fraud: "待处理",
    med: "待确认",
    visit: "补材料",
    claim: "已归档",
  },
  largeText: false,
  simpleMode: false,
  scanStep: 0,
};

const svg = {
  camera: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3Z"/><path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9 12l2 2 4-5"/></svg>`,
  file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10V8a6 6 0 0 1 12 0v2"/><rect x="4" y="10" width="16" height="11" rx="2"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 5 5 4-8 4 8 5-5-2 12H5Z"/><path d="M5 19h14"/></svg>`,
};

function roleCopy() {
  if (state.role === "child") {
    return {
      title: "子女看到的是结论、风险和下一步",
      voice: "帮我汇总爸妈今天的待办",
      notify: "已向父母发送确认请求",
      homeLabel: "父母今日待办",
    };
  }
  return {
    title: "把健康事务变成清单",
    voice: "帮我看看这张化验单",
    notify: "已通知女儿查看",
    homeLabel: "今天要办",
  };
}

function medDoneCount() {
  return Object.values(state.meds).filter(Boolean).length;
}

function syncCounters() {
  const missedMed = medDoneCount() === 2 ? 0 : 1;
  todoCount.textContent = String(3 + missedMed);
  medSummary.textContent = `${medDoneCount()}/2`;
}

function readyCount() {
  return Object.values(state.checks).filter(Boolean).length;
}

function checkedClass(key) {
  return state.checks[key] ? "done" : "";
}

function noticeClass(key) {
  if (state.notices[key] === "已处理" || state.notices[key] === "已归档") return "done";
  if (key === "fraud" && state.notices[key] !== "已处理") return "urgent";
  return "";
}

function riskBadge(level, text) {
  return `<span class="risk-badge ${level}">${text}</span>`;
}

function scanStepText() {
  return [
    "支持拍检验单、药盒、处方、发票、出院小结。先只进入识别队列，不直接给结论。",
    "已识别：空腹血糖偏高、二甲双胍、门诊发票 3 张。置信度低的字段会标黄。",
    "请确认药名、剂量、医院、日期是否正确。子女端可远程帮父母确认。",
    "已生成：晚间用药提醒、明日复诊清单、报销材料缺项和短信风险提醒。",
  ][state.scanStep];
}

const views = {
  home: () => {
    if (state.role === "child") {
      return `
        <article class="stage-card">
          <div class="stage-head">
            <div>
              <p class="eyebrow">子女看护台</p>
              <h2 class="stage-title">红黄绿分级，先处理高风险</h2>
              <p class="stage-note">把微信里的零散消息，整理成可跟进的健康和办事状态。</p>
            </div>
            <button class="camera-button" data-action="weekly-report" aria-label="生成家庭摘要">${svg.chart}</button>
          </div>
          <div class="risk-row">
            ${riskBadge("red", "红：诈骗短信")}
            ${riskBadge("yellow", "黄：复诊缺材料")}
            ${riskBadge("green", "绿：血压正常")}
          </div>
          <div class="care-grid">
            <button class="care-card danger" data-view="notifications"><strong>1 条高风险</strong><span>${state.notices.fraud} · 疑似诈骗短信</span></button>
            <button class="care-card" data-view="medicine"><strong>${medDoneCount()}/2 已确认</strong><span>${state.notices.med} · 今晚降压药</span></button>
            <button class="care-card" data-view="visit"><strong>${readyCount()}/4 材料</strong><span>${state.notices.visit} · 明早复诊</span></button>
          </div>
          <div class="task-list">
            <button class="task-row" data-detail="visit">
              <span class="task-icon mint">诊</span>
              <div><strong>妈妈明早 09:20 复诊</strong><p>报告未完全备齐，可一键提醒老人拍照上传</p></div>
              <span class="status-pill">跟进</span>
            </button>
            <button class="task-row" data-detail="claim">
              <span class="task-icon amber">单</span>
              <div><strong>报销材料缺 2 项</strong><p>费用明细、医保结算单还没归档</p></div>
              <span class="status-pill">提醒</span>
            </button>
            <button class="primary-action" data-action="parent-checkin">发送今日确认给爸妈</button>
          </div>
        </article>
      `;
    }
    if (state.simpleMode) {
      return `
        <article class="stage-card simple-stage">
          <div class="stage-head">
            <div>
              <p class="eyebrow">老人极简模式</p>
              <h2 class="stage-title">今天只看这 4 件事</h2>
              <p class="stage-note">少字、大按钮、一步到位。复杂内容留给子女端确认。</p>
            </div>
            <button class="camera-button" data-action="toggle-simple" aria-label="退出极简">${svg.user}</button>
          </div>
          <div class="simple-grid">
            <button class="simple-card" data-view="medicine"><span class="task-icon blue">药</span><strong>吃药</strong><p>今晚 8 点</p></button>
            <button class="simple-card" data-view="scan"><span class="task-icon mint">拍</span><strong>拍照</strong><p>报告/药盒/票据</p></button>
            <button class="simple-card" data-view="visit"><span class="task-icon amber">诊</span><strong>去医院</strong><p>明早复诊</p></button>
            <button class="simple-card" data-action="call-child"><span class="task-icon coral">女</span><strong>找女儿</strong><p>一键联系</p></button>
          </div>
          <button class="secondary-action" data-action="toggle-simple">返回完整模式</button>
        </article>
      `;
    }
    const copy = roleCopy();
    return `
      <article class="stage-card">
        <div class="stage-head">
          <div>
            <p class="eyebrow">${copy.homeLabel}</p>
            <h2 class="stage-title">拍一下，自动变成办事清单</h2>
            <p class="stage-note">报告、药盒、票据、短信都从拍照进入，再分流到用药、复诊、报销和防诈骗。</p>
          </div>
          <button class="camera-button" data-action="scan-home" aria-label="拍照整理">${svg.camera}</button>
        </div>
        <button class="scan-hero" data-view="scan">
          <span class="task-icon blue">拍</span>
          <div><strong>拍照整理</strong><p>4 步确认：上传、识别、家人确认、生成待办</p></div>
          <em>开始</em>
        </button>
        <div class="risk-row">
          ${riskBadge("red", "红：诈骗先阻断")}
          ${riskBadge("yellow", "黄：复诊待补")}
          ${riskBadge("green", "绿：血压正常")}
        </div>
        <div class="flow-steps" aria-label="办事流程">
          <div class="flow-step"><strong>1 拍照</strong>报告、药盒、票据</div>
          <div class="flow-step"><strong>2 整理</strong>异常、清单、提醒</div>
          <div class="flow-step"><strong>3 同步</strong>子女确认跟进</div>
        </div>
        <div class="utility-grid" aria-label="便民工具">
          <button class="utility-card" data-view="scan"><strong>拍照整理</strong><span>四步确认</span></button>
          <button class="utility-card" data-action="show-medicare"><strong>医保码</strong><span>就医付款</span></button>
          <button class="utility-card" data-action="show-card"><strong>就诊卡</strong><span>常用医院</span></button>
          <button class="utility-card" data-view="notifications"><strong>通知</strong><span>待处理</span></button>
          <button class="utility-card" data-view="profile"><strong>档案</strong><span>病史药史</span></button>
          <button class="utility-card" data-action="toggle-simple"><strong>极简</strong><span>大按钮</span></button>
        </div>
        <div class="task-list">
          <button class="task-row" data-detail="med">
            <span class="task-icon blue">药</span>
            <div><strong>20:00 降压药</strong><p>苯磺酸氨氯地平 1 片，饭后确认</p></div>
            <span class="status-pill">${state.meds.evening ? "完成" : "待办"}</span>
          </button>
          <button class="task-row" data-detail="claim">
            <span class="task-icon amber">单</span>
            <div><strong>报销材料缺 2 项</strong><p>费用明细、医保结算单还没归档</p></div>
            <span class="status-pill">补齐</span>
          </button>
          <button class="task-row" data-detail="visit">
            <span class="task-icon mint">诊</span>
            <div><strong>明早内分泌复诊</strong><p>已准备报告、用药记录和 3 个问医生问题</p></div>
            <span class="status-pill">准备</span>
          </button>
          <button class="task-row" data-detail="fraud">
            <span class="task-icon coral">险</span>
            <div><strong>陌生短信待判断</strong><p>含“医保账户停用”字样，建议先核验</p></div>
            <span class="status-pill">高危</span>
          </button>
        </div>
      </article>
    `;
  },
  visit: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">挂号与复诊准备</p>
          <h2 class="stage-title">就医前把资料、问题、路线准备好</h2>
          <p class="stage-note">不代替医生判断科室，只给保守建议和办事清单，可跳转医院公众号。</p>
        </div>
        <button class="camera-button" data-action="visit-pack" aria-label="生成就医包">${svg.file}</button>
      </div>
      <div class="flow-steps" aria-label="就医准备流程">
        <div class="flow-step"><strong>挂号</strong>内分泌科复诊</div>
        <div class="flow-step"><strong>带齐</strong>报告、处方、医保</div>
        <div class="flow-step"><strong>陪同</strong>女儿已提醒</div>
      </div>
      <div class="risk-row">
        ${riskBadge(readyCount() === 4 ? "green" : "yellow", readyCount() === 4 ? "绿：材料已齐" : "黄：材料未齐")}
        ${riskBadge("green", "提前 40 分钟出门")}
      </div>
      <div class="task-list">
        <button class="task-row" data-detail="visit">
          <span class="task-icon coral">院</span>
          <div><strong>明日 09:20 复诊</strong><p>常去医院：市人民医院，建议提前 40 分钟出门</p></div>
          <span class="status-pill">已约</span>
        </button>
        <div class="check-grid" aria-label="复诊材料清单">
          <button class="check-item ${checkedClass("id")}" data-check="id"><span></span>身份证</button>
          <button class="check-item ${checkedClass("medicare")}" data-check="medicare"><span></span>医保码</button>
          <button class="check-item ${checkedClass("reports")}" data-check="reports"><span></span>检查报告</button>
          <button class="check-item ${checkedClass("prescription")}" data-check="prescription"><span></span>上次处方</button>
        </div>
        <div class="result-item"><strong>问医生清单</strong><p>血糖控制、是否复查糖化、药量是否需要医生确认。</p></div>
        <button class="primary-action" data-action="call-child">通知女儿陪同</button>
      </div>
    </article>
  `,
  scan: () => {
    const steps = [
      ["拍照上传", "把报告、药盒或票据放平拍清楚"],
      ["AI 识别", "提取关键字段和可能的缺项"],
      ["家人确认", "允许老人或子女修改识别结果"],
      ["生成待办", "变成用药、复诊、报销或风险提醒"],
    ];
    return `
      <article class="stage-card">
        <div class="stage-head">
          <div>
            <p class="eyebrow">拍照识别四步流程</p>
            <h2 class="stage-title">${steps[state.scanStep][0]}</h2>
            <p class="stage-note">${steps[state.scanStep][1]}。每一步都可返回修改，避免 AI 直接替人下结论。</p>
          </div>
          <button class="camera-button" data-action="next-scan" aria-label="下一步">${svg.camera}</button>
        </div>
        <div class="scan-flow">
          ${steps.map((step, index) => `
            <button class="scan-step ${index === state.scanStep ? "active" : ""} ${index < state.scanStep ? "done" : ""}" data-scan-step="${index}">
              <span>${index + 1}</span><strong>${step[0]}</strong>
            </button>
          `).join("")}
        </div>
        <div class="scan-preview">
          <div class="paper-preview" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div class="result-list">
            <div class="result-item"><strong>${state.scanStep < 2 ? "识别示例" : "确认结果"}</strong><p>${scanStepText()}</p></div>
            <button class="primary-action" data-action="next-scan">${state.scanStep === 3 ? "生成家庭待办" : "继续下一步"}</button>
          </div>
        </div>
      </article>
    `;
  },
  report: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">拍照读报告</p>
          <h2 class="stage-title">异常项、通俗解释、问医生清单</h2>
          <p class="stage-note">只做健康信息整理，不替代医生诊断，不自动给治疗方案。</p>
        </div>
        <button class="camera-button" data-action="scan-report" aria-label="拍报告">${svg.camera}</button>
      </div>
      <div class="risk-row">
        ${riskBadge("yellow", "黄：建议复诊确认")}
        ${riskBadge("green", "不自动诊断")}
      </div>
      <div class="report-card">
        <div class="paper-preview" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="result-list">
          <div class="result-item"><strong>空腹血糖偏高</strong><p>建议带报告复诊确认，先不要自行调整药量。</p></div>
          <div class="result-item"><strong>已生成 3 个问题</strong><p>是否要复查糖化血红蛋白？饮食和运动如何调整？</p></div>
          <button class="primary-action" data-detail="report">查看整理结果</button>
        </div>
      </div>
    </article>
  `,
  medicine: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">用药提醒</p>
          <h2 class="stage-title">拍药盒建提醒，漏服自动通知家人</h2>
          <p class="stage-note">支持“已服、未确认、不确定”，避免老人被迫做复杂选择。</p>
        </div>
        <button class="camera-button" data-action="scan-medicine" aria-label="拍药盒">${svg.camera}</button>
      </div>
      <div class="risk-row">
        ${riskBadge(state.meds.evening ? "green" : "yellow", state.meds.evening ? "绿：今日已确认" : "黄：晚药待确认")}
        ${riskBadge("green", "不建议自行改药")}
      </div>
      <div class="med-list">
        <div class="med-row">
          <span class="task-icon mint">早</span>
          <div><strong>二甲双胍缓释片</strong><p>早餐后 1 片，已同步女儿</p></div>
          <button class="med-toggle ${state.meds.morning ? "done" : ""}" data-med="morning" aria-label="早药确认"><span></span></button>
        </div>
        <div class="med-row">
          <span class="task-icon blue">晚</span>
          <div><strong>氨氯地平片</strong><p>20:00 服用，超过 30 分钟提醒子女</p></div>
          <button class="med-toggle ${state.meds.evening ? "done" : ""}" data-med="evening" aria-label="晚药确认"><span></span></button>
        </div>
        <button class="secondary-action" data-detail="medicine">查看药品核对卡</button>
      </div>
    </article>
  `,
  claim: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">医保与报销</p>
          <h2 class="stage-title">票据、清单、证明一次归档</h2>
          <p class="stage-note">不替代官方医保入口，只把材料、缺项和办理步骤整理清楚。</p>
        </div>
        <button class="camera-button" data-action="scan-claim" aria-label="拍票据">${svg.file}</button>
      </div>
      <div class="claim-progress"><span></span></div>
      <div class="claim-list">
        <div class="claim-item"><span class="task-icon mint">✓</span><div><strong>门诊发票</strong><p>3 张已归档，可导出材料包</p></div><span class="status-pill">完成</span></div>
        <div class="claim-item"><span class="task-icon blue">✓</span><div><strong>诊断证明</strong><p>已识别医院、公章和日期</p></div><span class="status-pill">完成</span></div>
        <div class="claim-item"><span class="task-icon amber">缺</span><div><strong>费用明细清单</strong><p>建议去医院公众号或窗口补开</p></div><span class="status-pill">待补</span></div>
      </div>
    </article>
  `,
  notifications: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">子女通知中心</p>
          <h2 class="stage-title">所有风险和待办，都要能处理</h2>
          <p class="stage-note">通知不是消息堆积，而是每条都有下一步动作和处理状态。</p>
        </div>
        <button class="camera-button" data-action="parent-checkin" aria-label="发送确认">${svg.bell}</button>
      </div>
      <div class="notify-list">
        <div class="notify-item ${noticeClass("fraud")}"><button data-detail="fraud"><span>高</span><div><strong>疑似医保诈骗短信</strong><p>建议立即提醒父母不要点链接</p></div><em>${state.notices.fraud}</em></button><button class="mini-action" data-notice="fraud">处理</button></div>
        <div class="notify-item ${noticeClass("med")}"><button data-detail="med"><span>药</span><div><strong>今晚降压药未确认</strong><p>20:30 后仍未确认将再次提醒</p></div><em>${state.notices.med}</em></button><button class="mini-action" data-notice="med">提醒</button></div>
        <div class="notify-item ${noticeClass("visit")}"><button data-detail="visit"><span>诊</span><div><strong>复诊材料缺检查报告</strong><p>可提醒老人拍照上传</p></div><em>${state.notices.visit}</em></button><button class="mini-action" data-notice="visit">跟进</button></div>
        <div class="notify-item ${noticeClass("claim")}"><button data-detail="claim"><span>单</span><div><strong>门诊发票已归档</strong><p>3 张票据已进入报销材料包</p></div><em>${state.notices.claim}</em></button><button class="mini-action" data-notice="claim">归档</button></div>
      </div>
    </article>
  `,
  fraud: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">防诈骗提醒</p>
          <h2 class="stage-title">陌生短信、电话话术先核验</h2>
          <p class="stage-note">高风险时默认先阻断操作，再通知子女或引导官方渠道核实。</p>
        </div>
        <button class="camera-button" data-action="scan-fraud" aria-label="拍短信">${svg.shield}</button>
      </div>
      <div class="risk-row">
        ${riskBadge("red", "红：先别点链接")}
        ${riskBadge("yellow", "通知子女核验")}
      </div>
      <div class="risk-panel">
        <div class="risk-meter"><div><strong>92</strong><span>高风险，先别点链接</span></div></div>
        <button class="primary-action" data-action="notify-child">一键通知子女</button>
        <div class="result-item"><strong>识别到常见诈骗特征</strong><p>“医保停用”“限时验证”“点击链接”同时出现，建议联系官方渠道。</p></div>
      </div>
    </article>
  `,
  family: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">家庭协同</p>
          <h2 class="stage-title">子女看到结论，老人只看待办</h2>
          <p class="stage-note">减少微信里反复追问，把报告、药、票据、风险合成家庭摘要。</p>
        </div>
        <button class="camera-button" data-action="weekly-report" aria-label="生成周报">${svg.chart}</button>
      </div>
      <div class="family-list">
        <div class="family-row"><div class="member-stack"><span>妈</span><span>女</span><span>医</span></div><div><strong>女儿 王宁</strong><p>接收漏服药、高风险短信、复诊提醒</p></div><span class="status-pill">在线</span></div>
        <div class="family-row"><span class="task-icon mint">爸</span><div><strong>爸爸档案</strong><p>高血压、冠心病，近期无异常待办</p></div><span class="status-pill">正常</span></div>
        <div class="family-row"><span class="task-icon coral">妈</span><div><strong>妈妈档案</strong><p>糖尿病复诊材料还缺 1 项</p></div><span class="status-pill">跟进</span></div>
      </div>
    </article>
  `,
  profile: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">家庭成员档案</p>
          <h2 class="stage-title">病史、用药、医院、联系人放在一处</h2>
          <p class="stage-note">这是报告识别、用药提醒、复诊准备和子女通知的基础资料。</p>
        </div>
        <button class="camera-button" data-action="toggle-large" aria-label="大字模式">${svg.user}</button>
      </div>
      <div class="profile-grid">
        <div class="profile-card"><strong>妈妈 68 岁</strong><p>糖尿病 6 年，高血压 10 年</p></div>
        <div class="profile-card"><strong>过敏史</strong><p>青霉素过敏，已标记高亮</p></div>
        <div class="profile-card"><strong>长期用药</strong><p>二甲双胍、氨氯地平</p></div>
        <div class="profile-card"><strong>常用医院</strong><p>市人民医院，社区卫生服务中心</p></div>
        <div class="profile-card"><strong>紧急联系人</strong><p>女儿王宁，第一联系人</p></div>
        <div class="profile-card"><strong>最近报告</strong><p>血糖检查单，体检报告</p></div>
      </div>
      <button class="primary-action" data-view="membership">查看家庭会员权益</button>
      <button class="secondary-action" data-view="compliance">查看合规与隐私说明</button>
    </article>
  `,
  membership: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">家庭会员</p>
          <h2 class="stage-title">围绕家庭办事闭环付费</h2>
          <p class="stage-note">适合 MVP 测试的会员权益，不碰诊断、处方和医疗广告。</p>
        </div>
        <button class="camera-button" data-view="compliance" aria-label="合规说明">${svg.crown}</button>
      </div>
      <div class="plan-card">
        <strong>家庭版 19.9 元/月</strong>
        <p>支持 2 位老人档案、无限报告整理、用药提醒、报销材料包、子女通知中心。</p>
      </div>
      <div class="claim-list">
        <div class="claim-item"><span class="task-icon mint">1</span><div><strong>免费版</strong><p>1 位老人、基础提醒、每月 5 次拍照整理</p></div><span class="status-pill">试用</span></div>
        <div class="claim-item"><span class="task-icon blue">2</span><div><strong>家庭版</strong><p>多人档案、通知中心、材料包导出、复诊准备</p></div><span class="status-pill">推荐</span></div>
        <div class="claim-item"><span class="task-icon amber">3</span><div><strong>机构版</strong><p>药店、体检中心、社区服务站合作激活</p></div><span class="status-pill">试点</span></div>
      </div>
    </article>
  `,
  compliance: () => `
    <article class="stage-card">
      <div class="stage-head">
        <div>
          <p class="eyebrow">合规与隐私</p>
          <h2 class="stage-title">健康办事助手，不做 AI 医生</h2>
          <p class="stage-note">上架和获客都要把边界讲清楚，用户才敢把家庭资料交给你。</p>
        </div>
        <button class="camera-button" data-view="profile" aria-label="返回档案">${svg.lock}</button>
      </div>
      <div class="compliance-list">
        <div class="result-item"><strong>不诊断、不处方</strong><p>报告解读只做异常项整理、通俗解释和问医生清单。</p></div>
        <div class="result-item"><strong>家庭授权</strong><p>子女查看父母资料前，需要老人或家庭管理员明确授权。</p></div>
        <div class="result-item"><strong>敏感信息保护</strong><p>医疗健康信息、身份证、医保材料按敏感个人信息处理。</p></div>
        <div class="result-item"><strong>官方入口优先</strong><p>医保、挂号、反诈核验引导到官方平台或医院公众号。</p></div>
      </div>
    </article>
  `,
};

const details = {
  profile: {
    title: "老人便利设置",
    lines: [
      ["常用联系人", "女儿王宁为第一联系人，紧急提醒会优先发送给她。"],
      ["常用医院", "市人民医院、社区卫生服务中心，挂号和复诊清单默认引用。"],
      ["大字模式", "适合视力较弱的老人，开启后关键说明和按钮更大。"],
    ],
    actions: [
      ["toggle-large", "切换大字模式"],
      ["call-child", "联系女儿"],
    ],
  },
  med: {
    title: "今晚用药待确认",
    lines: [
      ["药品", "苯磺酸氨氯地平片，20:00 饭后 1 片。"],
      ["提醒规则", "超过 30 分钟未确认，会提醒女儿查看。"],
      ["安全边界", "如有头晕、胸闷或不确定是否重复服药，请联系医生或家人，不自行加减药。"],
    ],
  },
  claim: {
    title: "报销材料缺项",
    lines: [
      ["已归档", "门诊发票 3 张、诊断证明 1 张。"],
      ["还缺", "费用明细清单、医保结算单。"],
      ["下一步", "可去医院公众号下载，或到窗口补开后拍照上传。"],
    ],
  },
  fraud: {
    title: "疑似医保诈骗短信",
    lines: [
      ["风险点", "出现医保停用、限时验证、点击链接三类高危词。"],
      ["建议", "先别点链接，也不要输入身份证、银行卡或验证码。"],
      ["下一步", "通过国家医保服务平台或官方电话自行核验。"],
    ],
  },
  medicare: {
    title: "医保码与就医付款",
    lines: [
      ["当前状态", "医保电子凭证已绑定，老人端仅显示大按钮入口。"],
      ["使用场景", "挂号、缴费、取药时出示，避免老人现场翻找多个 App。"],
      ["安全提醒", "不会在本原型内保存完整身份证号和支付密码。"],
    ],
    actions: [
      ["show-card", "打开就诊卡"],
      ["call-child", "联系女儿"],
    ],
  },
  hospitalCard: {
    title: "常用医院就诊卡",
    lines: [
      ["医院", "市人民医院、社区卫生服务中心。"],
      ["下次就诊", "明日 09:20 内分泌科复诊。"],
      ["可做事项", "跳转医院公众号挂号、查看缴费提醒、整理报告材料。"],
    ],
    actions: [
      ["visit-pack", "生成复诊材料包"],
      ["call-child", "通知女儿"],
    ],
  },
  report: {
    title: "报告整理结果",
    lines: [
      ["异常项", "空腹血糖偏高，建议复诊确认。"],
      ["问医生", "是否需要复查糖化血红蛋白？近期饮食运动如何调整？"],
      ["提醒", "这不是诊断结论，不能替代医生判断。"],
    ],
  },
  medicine: {
    title: "药品核对卡",
    lines: [
      ["长期药", "二甲双胍缓释片、氨氯地平片。"],
      ["老人端", "只显示吃药时间和确认按钮。"],
      ["子女端", "显示漏服记录、处方照片和提醒规则。"],
    ],
  },
  visit: {
    title: "复诊准备包",
    lines: [
      ["明日安排", "09:20 内分泌科复诊，建议提前 40 分钟出门。"],
      ["需要携带", "身份证、医保电子凭证、近 3 次血糖记录、上次处方、体检报告。"],
      ["问医生", "血糖偏高是否需要复查糖化血红蛋白？当前药量是否需要调整？"],
    ],
    actions: [
      ["visit-pack", "生成就医材料包"],
      ["call-child", "通知女儿陪同"],
    ],
  },
};

function render() {
  stage.innerHTML = views[state.view]();
  quickCards.forEach((card) => card.classList.toggle("active", card.dataset.view === state.view));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === state.view));
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.role === state.role));
  appScreen.classList.toggle("large-type", state.largeText);
  voiceText.textContent = roleCopy().voice;
  syncCounters();
}

function setView(view) {
  state.view = view;
  render();
}

function viewName(view) {
  return {
    home: "待办",
    scan: "拍照整理",
    visit: "就医",
    report: "读报告",
    medicine: "用药",
    claim: "报销",
    fraud: "防诈骗",
    family: "家庭",
    notifications: "通知中心",
    profile: "家庭档案",
    membership: "会员",
    compliance: "合规说明",
  }[view] || "对应功能";
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.querySelector(".app-screen").appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function openSheet(detailKey) {
  const detail = details[detailKey];
  if (!detail) return;
  const actions = detail.actions || [["notify-child", state.role === "child" ? "发送给父母确认" : "发给子女确认"]];
  sheetContent.innerHTML = `
    <h3>${detail.title}</h3>
    <div class="sheet-body">
      ${detail.lines.map(([label, body]) => `
        <div class="sheet-line"><strong>${label}</strong><p>${body}</p></div>
      `).join("")}
      ${actions.map(([action, label], index) => `
        <button class="${index === 0 ? "primary-action" : "secondary-action"}" data-action="${action}">${label}</button>
      `).join("")}
    </div>
  `;
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
}

function handleAction(action) {
  if (action === "next-scan") {
    if (state.view !== "scan") state.view = "scan";
    state.scanStep = state.scanStep === 3 ? 0 : state.scanStep + 1;
    render();
    showToast(state.scanStep === 0 ? "已生成家庭待办" : `已进入第 ${state.scanStep + 1} 步`);
    return;
  }
  if (action === "toggle-simple") {
    state.simpleMode = !state.simpleMode;
    state.view = "home";
    render();
    showToast(state.simpleMode ? "已开启老人极简模式" : "已返回完整模式");
    return;
  }
  if (action === "scan-home") {
    state.view = "scan";
    state.scanStep = 0;
    render();
    showToast("已进入拍照识别四步流程");
    return;
  }
  if (action === "show-medicare") {
    openSheet("medicare");
    return;
  }
  if (action === "show-card") {
    openSheet("hospitalCard");
    return;
  }
  const messages = {
    "scan-home": "已打开拍照整理：报告、药盒、票据都可识别",
    "scan-report": "已模拟识别一张血糖检查单",
    "scan-medicine": "已从药盒识别出 2 种长期药",
    "scan-claim": "已加入新的发票照片，并检查缺项",
    "scan-fraud": "已分析短信风险，建议先别点链接",
    "notify-child": state.role === "child" ? "已发送给父母确认" : "已向女儿发送风险提醒",
    "weekly-report": "已生成家庭健康周报摘要",
    "visit-pack": "已生成复诊材料包和问医生清单",
    "call-child": "已通知女儿：建议明日陪同复诊",
    "parent-checkin": "已发送给爸妈：吃药、复诊材料和短信风险确认",
  };
  if (action === "toggle-large") {
    state.largeText = !state.largeText;
    render();
    showToast(state.largeText ? "已开启大字模式" : "已关闭大字模式");
    return;
  }
  showToast(messages[action] || "已完成");
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  const modeButton = event.target.closest("[data-role]");
  const actionButton = event.target.closest("[data-action]");
  const detailButton = event.target.closest("[data-detail]");
  const medToggle = event.target.closest("[data-med]");
  const checkButton = event.target.closest("[data-check]");
  const noticeButton = event.target.closest("[data-notice]");

  if (viewButton) {
    setView(viewButton.dataset.view);
  }

  if (modeButton) {
    state.role = modeButton.dataset.role;
    showToast(state.role === "child" ? "已切换到子女端视角" : "已切换到老人端视角");
    render();
  }

  if (detailButton) {
    openSheet(detailButton.dataset.detail);
  }

  if (medToggle) {
    const key = medToggle.dataset.med;
    state.meds[key] = !state.meds[key];
    showToast(state.meds[key] ? "已记录服药，并同步家人" : "已标记为未确认");
    render();
  }

  if (checkButton) {
    const key = checkButton.dataset.check;
    state.checks[key] = !state.checks[key];
    showToast(state.checks[key] ? "已加入复诊材料包" : "已标记为待补材料");
    render();
  }

  if (noticeButton) {
    const key = noticeButton.dataset.notice;
    const next = {
      fraud: "已处理",
      med: "已提醒",
      visit: "已跟进",
      claim: "已归档",
    }[key];
    state.notices[key] = next;
    showToast(`通知已更新：${next}`);
    render();
  }

  if (actionButton) {
    handleAction(actionButton.dataset.action);
  }
});

voiceButton.addEventListener("click", () => {
  const elderPhrases = [
    ["帮我看看这张化验单", "report"],
    ["这个医保短信是不是诈骗", "fraud"],
    ["提醒我晚上八点吃药", "medicine"],
    ["下周复诊要带哪些材料", "visit"],
    ["明天去医院几点出门", "visit"],
  ];
  const childPhrases = [
    ["汇总爸妈今天的待办", "home"],
    ["看看妈妈有没有漏服药", "medicine"],
    ["把报销缺的材料列出来", "claim"],
    ["高风险短信发给我确认", "fraud"],
    ["生成明天复诊材料包", "visit"],
  ];
  const phrases = state.role === "child" ? childPhrases : elderPhrases;
  const [text, view] = phrases[Math.floor(Math.random() * phrases.length)];
  voiceText.textContent = text;
  setView(view);
  showToast(`已识别语音，跳转到${viewName(view)}`);
});

profileButton.addEventListener("click", () => {
  openSheet("profile");
});

sosButton.addEventListener("click", () => {
  showToast(roleCopy().notify);
});

sheetClose.addEventListener("click", closeSheet);
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});

render();
