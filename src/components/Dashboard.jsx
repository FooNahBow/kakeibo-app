import { isInMonth, getAvailableMonths } from '../utils/dateUtils';
import { useState } from 'react';

export default function Dashboard({ transactions, budgets, categories, loading }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = getAvailableMonths(transactions);

  const monthlyTransactions = transactions.filter(t => isInMonth(t.日付, selectedMonth));
  const calcTransactions = monthlyTransactions.filter(t => String(t.計算対象) === "1" && t.内容 !== "振替");
  const income = calcTransactions.filter(t => t.金額 > 0).reduce((sum, t) => sum + (parseInt(t.金額) || 0), 0);
  const expense = Math.abs(calcTransactions.filter(t => t.金額 < 0).reduce((sum, t) => sum + (parseInt(t.金額) || 0), 0));
  const balance = income - expense;

  const categoryTotals = {};
  calcTransactions.filter(t => t.金額 < 0).forEach(t => {
    const cat = t.大項目 || 'その他';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(parseInt(t.金額) || 0);
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const getCategoryBudget = (name) => { const cat = (categories || []).find(c => c.name === name); return cat?.budget || budgets[name] || 0; };
  const maxAmount = sortedCategories[0]?.[1] || 1;

  const getBarColor = (pct) => {
    if (pct >= 100) return '#dc2626';
    if (pct >= 80) {
      const r = (pct - 80) / 20;
      const h = Math.round(30 - r * 30);
      return 'hsl(' + h + ', 90%, 45%)';
    }
    const r = pct / 80;
    const h = Math.round(200 - r * 170);
    return 'hsl(' + h + ', 80%, 45%)';
  };
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#0891b2', '#be185d', '#d97706'];

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>読み込み中...</div>;

  return (
    <div>
      {/* 月選択 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>ダッシュボード</h2>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
        >
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: '収入', value: income, color: '#2563eb' },
          { label: '支出', value: expense, color: '#dc2626' },
          { label: '収支', value: balance, color: balance >= 0 ? '#16a34a' : '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px' }}>{label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color, margin: 0 }}>
              {value >= 0 ? '' : '-'}¥{Math.abs(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* カテゴリ別支出グラフ */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>カテゴリ別支出</h3>
        {sortedCategories.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>データがありません</p>
        ) : (
          sortedCategories.map(([cat, amount], i) => {
            const budget = getCategoryBudget(cat);
            const pct = budget > 0 ? Math.min((amount / budget) * 100, 100) : (amount / maxAmount) * 100;
            const budgetPct = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0;
            const isOver = budget > 0 && amount > budget;
            return (
              <div key={cat} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#1e293b' }}>{cat}</span>
                  <div>
                    <span style={{ fontWeight: '600', color: isOver ? '#dc2626' : '#1e293b' }}>¥{amount.toLocaleString()}</span>
                    {budget > 0 && <span style={{ color: '#94a3b8', marginLeft: '4px' }}>/ ¥{budget.toLocaleString()}</span>}
                    {isOver && <span style={{ color: '#dc2626', marginLeft: '4px', fontSize: '11px' }}>超過</span>}
                  </div>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                  <div style={{ width: `${pct}%`, height: '8px', borderRadius: '4px', background: getBarColor(budget > 0 ? (amount / budget) * 100 : 0) }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 予算サマリー */}
      {Object.keys(budgets).length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>予算達成状況</h3>
          {Object.entries(budgets).map(([cat, budget]) => {
            const spent = categoryTotals[cat] || 0;
            const pct = Math.min((spent / budget) * 100, 100);
            const color = getBarColor(pct);
            return (
              <div key={cat} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>{cat}</span>
                  <span style={{ color }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px' }}>
                  <div style={{ width: `${pct}%`, height: '6px', borderRadius: '4px', background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}