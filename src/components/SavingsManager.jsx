import { useState, useEffect } from "react";

const STORAGE_KEY = "kakeibo_savings";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getMonthRange(start, end) {
  const months = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  let y = sy, m = sm;
  let count = 0;
  while ((y < ey || (y === ey && m <= em)) && count < 120) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
    count++;
  }
  return months;
}

function calcMonthlyAmounts(totalAmount, months) {
  const n = months.length;
  if (n === 0) return {};
  const base = Math.floor(totalAmount / n);
  const remainder = totalAmount - base * n;
  const result = {};
  months.forEach((m, i) => { result[m] = base + (i === n - 1 ? remainder : 0); });
  return result;
}

function fmtMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function fmtYen(n) {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

function thisMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function MonthSelect({ value, onChange }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const maxYear = currentYear + 10;
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const [y, m] = (value || thisMonth()).split("-").map(Number);
  const availableMonths = allMonths.filter(mo => y < maxYear || mo <= currentMonth);
  const selectStyle = {
    border: "1px solid #dee2e6", borderRadius: 6, padding: "7px 8px",
    fontSize: 13, background: "#f8f9fa", color: "#212529",
    outline: "none", fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select style={{ ...selectStyle, flex: 1 }} value={y}
        onChange={e => onChange(`${e.target.value}-${String(m).padStart(2, "0")}`)}>
        {years.map(yr => <option key={yr} value={yr}>{yr}年</option>)}
      </select>
      <select style={{ ...selectStyle, width: 80 }} value={m}
        onChange={e => onChange(`${y}-${String(e.target.value).padStart(2, "0")}`)}>
        {availableMonths.map(mo => <option key={mo} value={mo}>{mo}月</option>)}
      </select>
    </div>
  );
}

export default function SavingsManager({ categories = [] }) {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const emptyForm = { name: "", category: "", totalAmount: "", startMonth: thisMonth(), endMonth: thisMonth(), note: "" };
  const [form, setForm] = useState(emptyForm);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPlans(JSON.parse(raw));
    } catch {}
  }, []);

  function savePlans(next) {
    setPlans(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function handleFormChange(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    updatePreview(next);
  }

  function updatePreview(f) {}

  function handleSubmit() {
    const amt = parseInt(form.totalAmount);
    if (!form.name || !amt || !form.startMonth || !form.endMonth) return;
    if (form.startMonth > form.endMonth) return;
    const months = getMonthRange(form.startMonth, form.endMonth);
    const monthly = calcMonthlyAmounts(amt, months);
    if (editingId) {
      savePlans(plans.map(p => p.id === editingId ? { ...p, name: form.name, category: form.category, totalAmount: amt, startMonth: form.startMonth, endMonth: form.endMonth, note: form.note, months, monthly } : p));
      // setEditingId(null); 編集画面を維持
    } else {
      savePlans([...plans, { id: generateId(), ...form, totalAmount: amt, months, monthly, createdAt: new Date().toISOString() }]);
    }
    if (!editingId) {
      setForm(emptyForm);
      setShowForm(false);
    }
  }

  function startEdit(plan) {
    setForm({ name: plan.name, category: plan.category, totalAmount: String(plan.totalAmount), startMonth: plan.startMonth, endMonth: plan.endMonth, note: plan.note || "" });
    setEditingId(plan.id);
    setShowForm(true);
  }

  function deletePlan(id) {
    if (!window.confirm("このプランを削除しますか？")) return;
    savePlans(plans.filter(p => p.id !== id));
  }

  const now = thisMonth();
  const filtered = plans.filter(p => {
    if (filterStatus === "active") return p.endMonth >= now;
    if (filterStatus === "done") return p.endMonth < now;
    return true;
  });

  const catOptions = [...(categories.map(c => c.name)), "その他"].filter((v, i, a) => a.indexOf(v) === i);

  const card = { background: "#fff", border: "1px solid #e9ecef", borderRadius: 10, padding: "16px 18px", marginBottom: 12 };
  const inputStyle = { width: "100%", border: "1px solid #dee2e6", borderRadius: 6, padding: "7px 10px", fontSize: 13, background: "#f8f9fa", color: "#212529", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 };
  const btnPrimary = { padding: "7px 16px", borderRadius: 6, border: "none", background: "#1e3a5f", color: "#fff", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 };
  const btnSecondary = { padding: "6px 14px", borderRadius: 6, border: "1px solid #dee2e6", background: "#fff", color: "#495057", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 500 };
  const btnFilter = { padding: "5px 12px", borderRadius: 20, border: "1px solid #dee2e6", background: "#fff", color: "#868e96", fontSize: 11, fontFamily: "inherit", cursor: "pointer" };
  const btnFilterActive = { ...btnFilter, background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f", fontWeight: 600 };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>積立・分割計上管理</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>大きな支出を積立期間で月割りしてダッシュボードに反映します</div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }} style={btnPrimary}>
          ＋ 新規プラン
        </button>
      </div>

      {showForm && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13 }}>{editingId ? "プランを編集" : "新規積立プランを登録"}</div>
          <div style={grid2}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>プラン名 *</div><input style={inputStyle} value={form.name} placeholder="例：旅行代・固定資産税" onChange={e => handleFormChange("name", e.target.value)} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>カテゴリ</div><select style={inputStyle} value={form.category} onChange={e => handleFormChange("category", e.target.value)}><option value="">カテゴリを選択</option>{catOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div style={grid2}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>総額（円） *</div><input style={inputStyle} type="number" value={form.totalAmount} placeholder="例：300000" onChange={e => handleFormChange("totalAmount", e.target.value)} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>メモ</div><input style={inputStyle} value={form.note} placeholder="任意" onChange={e => handleFormChange("note", e.target.value)} /></div>
          </div>
          <div style={grid2}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>積立開始月 *</div><MonthSelect value={form.startMonth} onChange={v => handleFormChange("startMonth", v)} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", marginBottom: 4 }}>積立終了月 *</div><MonthSelect value={form.endMonth} onChange={v => handleFormChange("endMonth", v)} /></div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button style={btnSecondary} onClick={() => { setShowForm(false); setEditingId(null); }}>キャンセル</button>
            <button style={btnPrimary} onClick={handleSubmit}>{editingId ? "更新する" : "登録する"}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["all", "すべて"], ["active", "積立中"], ["done", "完了"]].map(([v, label]) => (
          <button key={v} onClick={() => setFilterStatus(v)} style={filterStatus === v ? btnFilterActive : btnFilter}>{label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#888", alignSelf: "center" }}>{filtered.length}件</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: 13 }}>積立プランがありません</div>
      ) : (
        filtered.map(plan => <PlanCard key={plan.id} plan={plan} now={now} onEdit={() => startEdit(plan)} onDelete={() => deletePlan(plan.id)} />)
      )}
    </div>
  );
}

function PlanCard({ plan, now, onEdit, onDelete }) {
  const [showTx, setShowTx] = useState(false);
  const txLinks = (() => { try { return JSON.parse(localStorage.getItem('kakeibo_tx_links') || '{}'); } catch { return {}; } })();
  const allTx = (() => { try { return JSON.parse(localStorage.getItem('kakeibo_transactions') || '[]'); } catch { return []; } })();
  const linkedTx = allTx.filter(t => txLinks[t.ID] === plan.id);
  const linkedTotal = linkedTx.reduce((s, t) => s + Math.abs(parseInt(t.金額) || 0), 0);
  const isDone = plan.endMonth < now;
  const isActive = !isDone && plan.startMonth <= now;
  const accumulated = linkedTotal;
  const progress = plan.totalAmount > 0 ? Math.round(accumulated / plan.totalAmount * 100) : 0;
  const statusColor = isDone ? "#0ca678" : isActive ? "#1e3a5f" : "#868e96";
  const statusLabel = isDone ? "完了" : isActive ? "積立中" : "予定";
  const btnSecondary = { padding: "6px 14px", borderRadius: 6, border: "1px solid #dee2e6", background: "#fff", color: "#495057", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 500 };

  return (
    <div style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: 10, padding: "16px 18px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: statusColor + "18", color: statusColor }}>{statusLabel}</span>
            {plan.category && <span style={{ fontSize: 10, color: "#888", background: "#f1f3f5", padding: "2px 8px", borderRadius: 999 }}>{plan.category}</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{plan.name}</div>
          {plan.note && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{plan.note}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{fmtYen(plan.totalAmount)}</div>
          <div style={{ fontSize: 10, color: "#888" }}>{fmtMonth(plan.startMonth)} 〜 {fmtMonth(plan.endMonth)}　{plan.months.length}ヶ月　／　毎月¥{Math.round(plan.totalAmount / plan.months.length).toLocaleString()}</div>
        </div>
      </div>
      {!isDone && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 4 }}>
            <span>貯まった額 {fmtYen(accumulated)}</span>
            <span>残り {fmtYen(plan.totalAmount - accumulated)}　{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#e9ecef", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: progress >= 100 ? "#0ca678" : "#1e3a5f", borderRadius: 999, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setShowTx(!showTx)} style={{ fontSize: 11, color: "#1e3a5f", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {showTx ? "▲ 紐づいた取引を閉じる" : `▼ 紐づいた取引（${linkedTx.length}件・${("¥" + linkedTotal.toLocaleString())}）`}
        </button>
        {showTx && (
          <div style={{ marginTop: 8 }}>
            {linkedTx.length === 0 ? (
              <div style={{ fontSize: 11, color: "#aaa" }}>取引一覧から紐づけてください</div>
            ) : linkedTx.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: "1px solid #f1f3f5" }}>
                <span style={{ color: "#555" }}>{t.日付 ? new Date(t.日付).toLocaleDateString('ja-JP') : ''}　{t.内容}</span>
                <span style={{ fontWeight: 700, color: "#1e3a5f" }}>¥{Math.abs(parseInt(t.金額) || 0).toLocaleString()}</span>
              </div>
            ))}
            {linkedTx.length > 0 && (
              <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700, marginTop: 4, color: "#1e3a5f" }}>
                合計：¥{linkedTotal.toLocaleString()}　／　目標：¥{plan.totalAmount.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f3f5" }}>
        <button style={btnSecondary} onClick={onEdit}>編集</button>
        <button style={{ ...btnSecondary, color: "#c92a2a", borderColor: "#ffc9c9" }} onClick={onDelete}>削除</button>
      </div>
    </div>
  );
}

export function getSavingsForMonth(yearMonth) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalAmount: 0, plans: [] };
    const plans = JSON.parse(raw);
    const matched = [];
    for (const plan of plans) {
      const amt = plan.monthly?.[yearMonth];
      if (amt) matched.push({ name: plan.name, category: plan.category, amount: amt });
    }
    return { totalAmount: matched.reduce((s, p) => s + p.amount, 0), plans: matched };
  } catch { return { totalAmount: 0, plans: [] }; }
}
