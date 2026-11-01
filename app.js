/* 记账小账本 —— 纯前端实现，数据存浏览器 localStorage，零后端、零依赖 */

var ICONS = { "餐饮":"🍜","交通":"🚌","购物":"🛍️","居住":"🏠","娱乐":"🎮","医疗":"💊","教育":"📚","人情":"🎁","工资":"💼","奖金":"🏆","理财":"📈","其他":"📌" };
var CAT_EXPENSE = ["餐饮","交通","购物","居住","娱乐","医疗","教育","人情","其他"];
var CAT_INCOME  = ["工资","奖金","理财","其他"];
var COLORS = ['#5b6cff','#16a34a','#f97316','#ef4444','#0ea5e9','#a855f7','#eab308','#14b8a6','#ec4899','#64748b','#8b5cf6','#0891b2'];

var currentType = "expense";
var ALL_ROWS = [];

/* ---------- 账本密钥：作为本地命名空间，支持多账本切换 ---------- */
var LEDGER_KEY = getKey();
function getKey() {
  var k = localStorage.getItem("ledger_key");
  if (!k) { k = genKey(); localStorage.setItem("ledger_key", k); }
  return k;
}
function genKey() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var s = "";
  for (var i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function fmtKey(k) { return k.replace(/(.{4})/g, "$1-"); }
function showKey() { document.getElementById("keyText").textContent = fmtKey(LEDGER_KEY); }
function copyKey() {
  try { navigator.clipboard && navigator.clipboard.writeText(LEDGER_KEY); } catch (e) {}
  var t = document.createElement("textarea");
  t.value = LEDGER_KEY; document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(t);
  alert("密钥已复制：" + fmtKey(LEDGER_KEY) + "\n请妥善保存，用于切换/恢复账本。");
}
function switchKey() {
  var k = prompt("输入账本密钥以切换到另一个账本（当前账本数据不会删除）：", "");
  if (!k) return;
  k = k.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (k.length < 8) { alert("密钥格式不正确，请重新输入。"); return; }
  localStorage.setItem("ledger_key", k);
  LEDGER_KEY = k; showKey(); renderAll(loadLocal());
}

/* ---------- 本地存储 ---------- */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem("ledger_data_" + LEDGER_KEY) || "[]"); }
  catch (e) { return []; }
}
function saveLocal(arr) {
  localStorage.setItem("ledger_data_" + LEDGER_KEY, JSON.stringify(arr));
}
function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + "-" + Math.random().toString(36).slice(2);
}

function fmt(n) {
  return "¥" + Number(n || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function monthKey(d) { return String(d).slice(0, 7); }
function dayKey(d) { return String(d).slice(0, 10); }
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function setType(t) {
  currentType = t;
  document.getElementById("btnExpense").className = t === "expense" ? "on-expense" : "";
  document.getElementById("btnIncome").className  = t === "income"  ? "on-income"  : "";
  fillCategories();
}
function fillCategories() {
  var sel = document.getElementById("category");
  var allowed = currentType === "income" ? CAT_INCOME : CAT_EXPENSE;
  sel.innerHTML = allowed.map(function (t) { return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + "</option>"; }).join("");
}

function init() {
  var today = new Date();
  document.getElementById("date").value = today.toISOString().slice(0, 10);
  document.getElementById("today").textContent = today.toISOString().slice(0, 10);
  var cats = Array.from(new Set(CAT_EXPENSE.concat(CAT_INCOME)));
  document.getElementById("filterCategory").innerHTML =
    '<option value="">全部分类</option>' + cats.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
  fillCategories();
  restoreDraft();
  showKey();
  renderAll(loadLocal());
}

function renderAll(rows) {
  ALL_ROWS = rows || [];
  buildMonthOptions();
  render();
}

function buildMonthOptions() {
  var months = Array.from(new Set(ALL_ROWS.map(function (r) { return monthKey(r.date); }))).sort().reverse();
  var now = monthKey(new Date().toISOString().slice(0, 10));
  if (months.indexOf(now) === -1) months.unshift(now);
  var sel = document.getElementById("filterMonth");
  var cur = sel.value || now;
  sel.innerHTML = months.map(function (m) { return '<option value="' + m + '">' + m + "</option>"; }).join("");
  if (months.indexOf(cur) !== -1) sel.value = cur; else sel.value = months[0];
}

function render() {
  if (!ALL_ROWS.length) {
    document.getElementById("list").innerHTML = '<div class="empty">还没有记录，去上面记一笔吧～</div>';
    renderDashboard([]);
    return;
  }
  var month = document.getElementById("filterMonth").value;
  var catFilter = document.getElementById("filterCategory").value;

  var monthList = ALL_ROWS.filter(function (r) { return monthKey(r.date) === month; });
  var inc = monthList.filter(function (r) { return r.type === "income"; }).reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
  var exp = monthList.filter(function (r) { return r.type === "expense"; }).reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
  document.getElementById("sumIncome").textContent = fmt(inc);
  document.getElementById("sumExpense").textContent = fmt(exp);
  document.getElementById("sumBalance").textContent = fmt(inc - exp);

  var view = monthList.slice().sort(function (a, b) { return dayKey(b.date).localeCompare(dayKey(a.date)); });
  if (catFilter) view = view.filter(function (r) { return r.category === catFilter; });
  document.getElementById("count").textContent = "共 " + view.length + " 笔";

  if (!view.length) {
    document.getElementById("list").innerHTML = '<div class="empty">本月该筛选下还没有记录。</div>';
  } else {
    document.getElementById("list").innerHTML = view.map(function (r) {
      var amount = Number(r.amount || 0);
      var cls = r.type === "income" ? "income" : "expense";
      var sign = r.type === "income" ? "+" : "-";
      var category = r.category || "其他";
      var icon = ICONS[category] || "📌";
      var note = r.note || "";
      var date = dayKey(r.date);
      var rid = r.id;
      return '<div class="item">'
        + '<div class="avatar">' + icon + '</div>'
        + '<div class="meta"><div class="cat">' + escapeHtml(category) + '</div>'
        + (note ? '<div class="note">' + escapeHtml(note) + '</div>' : '') + '</div>'
        + '<div style="text-align:right;">'
        + '<div class="amt ' + cls + '">' + sign + fmt(amount).slice(1) + '</div>'
        + '<div class="date">' + date + '</div></div>'
        + '<button class="del" title="删除" onclick="deleteRecord(\'' + rid + '\')">×</button></div>';
    }).join("");
  }

  renderDashboard(ALL_ROWS);
}

/* ---------- 汇总分析 ---------- */
function renderDashboard(rows) {
  var allInc = rows.filter(function (r) { return r.type === "income"; }).reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
  var allExp = rows.filter(function (r) { return r.type === "expense"; }).reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
  document.getElementById("allIncome").textContent = fmt(allInc);
  document.getElementById("allExpense").textContent = fmt(allExp);
  document.getElementById("allBalance").textContent = fmt(allInc - allExp);

  var byCat = {};
  rows.filter(function (r) { return r.type === "expense"; }).forEach(function (r) {
    var c = r.category || "其他";
    byCat[c] = (byCat[c] || 0) + Number(r.amount || 0);
  });
  var catArr = Object.keys(byCat).map(function (k) { return { name: k, value: byCat[k] }; }).sort(function (a, b) { return b.value - a.value; });
  renderPie(catArr);
  renderRank(catArr);

  var months = [];
  var d = new Date();
  for (var i = 11; i >= 0; i--) {
    var dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(dd.getFullYear() + "-" + String(dd.getMonth() + 1).padStart(2, "0"));
  }
  var incMap = {}, expMap = {};
  rows.forEach(function (r) {
    var m = monthKey(r.date);
    if (r.type === "income") incMap[m] = (incMap[m] || 0) + Number(r.amount || 0);
    else expMap[m] = (expMap[m] || 0) + Number(r.amount || 0);
  });
  renderTrend(months, months.map(function (m) { return incMap[m] || 0; }), months.map(function (m) { return expMap[m] || 0; }));
}

function renderPie(catArr) {
  var wrap = document.getElementById("pieWrap");
  var legend = document.getElementById("pieLegend");
  var total = catArr.reduce(function (s, r) { return s + r.value; }, 0);
  if (total === 0) { wrap.innerHTML = '<div class="empty">暂无支出数据</div>'; legend.innerHTML = ""; return; }
  var cx = 90, cy = 90, r = 72;
  function polar(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, start, end) {
    var s = polar(cx, cy, r, end), e = polar(cx, cy, r, start);
    var large = (end - start) <= 180 ? 0 : 1;
    return ["M", cx, cy, "L", s[0].toFixed(2), s[1].toFixed(2), "A", r, r, 0, large, 0, e[0].toFixed(2), e[1].toFixed(2), "Z"].join(" ");
  }
  var angle = 0, paths = "";
  catArr.forEach(function (item, idx) {
    var sweep = item.value / total * 360;
    if (sweep >= 359.999) {
      paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + COLORS[idx % COLORS.length] + '"/>';
    } else {
      paths += '<path d="' + arc(cx, cy, r, angle, angle + sweep) + '" fill="' + COLORS[idx % COLORS.length] + '"/>';
    }
    angle += sweep;
  });
  paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 30) + '" fill="#fff"/>';
  wrap.innerHTML = '<svg viewBox="0 0 180 180" style="max-width:200px;margin:0 auto;">' + paths
    + '<text x="90" y="84" text-anchor="middle" font-size="11" fill="#8a90a2">总支出</text>'
    + '<text x="90" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="#1f2330">' + fmt(total) + '</text></svg>';
  legend.innerHTML = catArr.map(function (item, idx) {
    var pc = (item.value / total * 100).toFixed(1) + "%";
    return '<div class="li"><span class="dot" style="background:' + COLORS[idx % COLORS.length] + '"></span>'
      + '<span class="nm">' + escapeHtml(item.name) + '</span><span class="pc">' + pc + '</span></div>';
  }).join("");
}

function renderRank(catArr) {
  var wrap = document.getElementById("rankWrap");
  if (catArr.length === 0) { wrap.innerHTML = '<div class="empty">暂无支出数据</div>'; return; }
  var max = catArr[0].value;
  wrap.innerHTML = catArr.map(function (item, idx) {
    var w = max > 0 ? (item.value / max * 100) : 0;
    return '<div class="rank-row"><span class="nm">' + escapeHtml(item.name) + '</span>'
      + '<span class="bar"><span style="width:' + w.toFixed(1) + '%;background:' + COLORS[idx % COLORS.length] + '"></span></span>'
      + '<span class="amt">' + fmt(item.value) + '</span></div>';
  }).join("");
}

function axisLabel(v) {
  if (v >= 10000) return (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1) + "万";
  if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "千";
  return String(Math.round(v));
}
function niceMax(v) {
  if (v <= 0) return 10;
  var p = Math.pow(10, Math.floor(Math.log10(v)));
  var n = v / p, m;
  if (n <= 1) m = 1; else if (n <= 2) m = 2; else if (n <= 5) m = 5; else m = 10;
  return m * p;
}
function renderTrend(months, incArr, expArr) {
  var wrap = document.getElementById("trendWrap");
  var hasData = incArr.concat(expArr).some(function (v) { return v > 0; });
  if (!hasData) { wrap.innerHTML = '<div class="empty">暂无趋势数据</div>'; return; }
  var W = Math.max(360, months.length * 50), H = 240;
  var padL = 46, padR = 12, padT = 14, padB = 30;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  var maxV = Math.max.apply(null, incArr.concat(expArr));
  var top = niceMax(maxV);
  var groupW = plotW / months.length;
  var barW = Math.min(16, groupW / 3);
  var gap = 4;
  var svg = "";
  for (var g = 0; g <= 4; g++) {
    var y = padT + plotH * (1 - g / 4);
    var val = top * g / 4;
    svg += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '" stroke="#eceef3"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="10" fill="#8a90a2">' + axisLabel(val) + '</text>';
  }
  months.forEach(function (m, i) {
    var gx = padL + groupW * i + groupW / 2;
    var xInc = gx - barW - gap / 2, xExp = gx + gap / 2;
    var hInc = top > 0 ? incArr[i] / top * plotH : 0;
    var hExp = top > 0 ? expArr[i] / top * plotH : 0;
    if (hInc > 0) svg += '<rect x="' + xInc.toFixed(1) + '" y="' + (padT + plotH - hInc).toFixed(1) + '" width="' + barW + '" height="' + hInc.toFixed(1) + '" rx="2" fill="#16a34a"/>';
    if (hExp > 0) svg += '<rect x="' + xExp.toFixed(1) + '" y="' + (padT + plotH - hExp).toFixed(1) + '" width="' + barW + '" height="' + hExp.toFixed(1) + '" rx="2" fill="#ef4444"/>';
    svg += '<text x="' + gx.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="9" fill="#8a90a2">' + m.slice(2) + '</text>';
  });
  svg += '<rect x="' + padL + '" y="6" width="10" height="10" rx="2" fill="#16a34a"/><text x="' + (padL + 14) + '" y="15" font-size="10" fill="#8a90a2">收入</text>';
  svg += '<rect x="' + (padL + 54) + '" y="6" width="10" height="10" rx="2" fill="#ef4444"/><text x="' + (padL + 68) + '" y="15" font-size="10" fill="#8a90a2">支出</text>';
  wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' + svg + '</svg>';
}

/* ---------- 新增 / 删除 ---------- */
function addRecord() {
  var amount = parseFloat(document.getElementById("amount").value);
  var date = document.getElementById("date").value;
  var category = document.getElementById("category").value;
  var note = document.getElementById("note").value.trim();
  if (!amount || amount <= 0) { alert("请输入有效金额"); return; }
  if (!date) { alert("请选择日期"); return; }
  var arr = loadLocal();
  arr.push({
    id: genId(),
    type: currentType,
    amount: Math.round(amount * 100) / 100,
    category: category,
    date: date,
    note: note,
    createdAt: Date.now()
  });
  saveLocal(arr);
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  clearDraft();
  renderAll(arr);
}

function deleteRecord(recordId) {
  if (!recordId) return;
  if (!confirm("确定删除这条记录？")) return;
  var arr = loadLocal();
  var idx = arr.findIndex(function (r) { return r.id === recordId; });
  if (idx >= 0) arr.splice(idx, 1);
  saveLocal(arr);
  renderAll(arr);
}

/* ---------- 导出 / 导入备份 ---------- */
function exportData() {
  var data = {
    app: "expense-tracker",
    version: 1,
    key: LEDGER_KEY,
    exportedAt: new Date().toISOString(),
    records: loadLocal()
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "账本备份-" + LEDGER_KEY + "-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}
function importData() {
  var inp = document.createElement("input");
  inp.type = "file"; inp.accept = "application/json";
  inp.onchange = function () {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var recs = Array.isArray(data) ? data : (data.records || []);
        if (!Array.isArray(recs)) throw new Error("bad");
        var k = data.key || LEDGER_KEY;
        recs = recs.map(function (r) {
          return {
            id: r.id || genId(),
            type: r.type === "income" ? "income" : "expense",
            amount: Number(r.amount) || 0,
            category: r.category || "其他",
            date: r.date || new Date().toISOString().slice(0, 10),
            note: r.note || "",
            createdAt: r.createdAt || Date.now()
          };
        });
        localStorage.setItem("ledger_key", k);
        LEDGER_KEY = k; showKey();
        saveLocal(recs);
        renderAll(recs);
        alert("导入成功，共 " + recs.length + " 条记录。");
      } catch (e) {
        alert("导入失败：文件格式不正确。");
      }
    };
    reader.readAsText(f);
  };
  inp.click();
}

/* ---------- 表单草稿（仅本地缓存输入，便于继续填写） ---------- */
var DRAFT = "ledger_draft_v2";
function saveDraft() {
  try {
    localStorage.setItem(DRAFT, JSON.stringify({
      amount: document.getElementById("amount").value,
      note: document.getElementById("note").value,
      date: document.getElementById("date").value
    }));
  } catch (e) {}
}
function restoreDraft() {
  try {
    var d = JSON.parse(localStorage.getItem(DRAFT) || "null");
    if (d) {
      if (d.amount) document.getElementById("amount").value = d.amount;
      if (d.note) document.getElementById("note").value = d.note;
      if (d.date) document.getElementById("date").value = d.date;
    }
  } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} }
document.addEventListener("input", function (e) {
  if (e.target && (e.target.id === "amount" || e.target.id === "note" || e.target.id === "date")) saveDraft();
});

init();
