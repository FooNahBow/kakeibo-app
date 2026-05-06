import { useState, useEffect } from 'react';
const LINK_KEY = "kakeibo_tx_links";
export default function TransactionList({ transactions, savingsPlans = [] }) {
  const [txLinks, setTxLinks] = useState(() => { try { return JSON.parse(localStorage.getItem(LINK_KEY) || '{}'); } catch { return {}; } });
  function setLink(txId, planId) {
    const next = { ...txLinks, [txId]: planId };
    setTxLinks(next);
    localStorage.setItem(LINK_KEY, JSON.stringify(next));
  }
  const [filters, setFilters] = useState(['']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchMode, setSearchMode] = useState('AND');
  const normalize = (s) => (s || '').normalize('NFKC').toLowerCase();
  const addFilter = () => setFilters(f => [...f, '']);
  const removeFilter = (i) => setFilters(f => f.length === 1 ? [''] : f.filter((_,j) => j !== i));
  const updateFilter = (i, v) => setFilters(f => f.map((x,j) => j===i ? v : x));
  const [categoryFilter, setCategoryFilter] = useState('');
  const categories = [...new Set(transactions.map(t => t.大項目).filter(Boolean))];
  const filtered = transactions.filter(t => {
    const keywords = filters.filter(Boolean);
    const matchKeyword = (k) => normalize(t.内容).includes(normalize(k)) || normalize(t.保有金融機関).includes(normalize(k));
    const matchText = keywords.length === 0 || (searchMode === 'AND'
      ? keywords.every(matchKeyword)
      : keywords.some(matchKeyword)
    );
    const matchCategory = !categoryFilter || t.大項目 === categoryFilter;
    const txDate = t.日付 ? t.日付.slice(0,10) : '';
    const matchFrom = !dateFrom || txDate >= dateFrom;
    const matchTo = !dateTo || txDate <= dateTo;
    return matchText && matchCategory && matchFrom && matchTo;
  });
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return y+"/"+m+"/"+day;
  };
  const formatAmount = (amount) => {
    const num = parseInt(amount) || 0;
    const formatted = Math.abs(num).toLocaleString();
    return num < 0
      ? { text: `-¥${formatted}`, color: '#dc2626' }
      : { text: `+¥${formatted}`, color: '#2563eb' };
  };
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '8px' }}>
        {filters.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                <button onClick={() => setSearchMode('AND')} style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: searchMode==='AND'?'#1e3a5f':'#fff', color: searchMode==='AND'?'#fff':'#64748b' }}>AND</button>
                <button onClick={() => setSearchMode('OR')} style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: searchMode==='OR'?'#1e3a5f':'#fff', color: searchMode==='OR'?'#fff':'#64748b' }}>OR</button>
              </div>
            )}
            <input type="text" placeholder="キーワード検索..."
              value={f} onChange={e => updateFilter(i, e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
              <option value="">すべてのカテゴリ</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {filters.length > 1 && (
              <button onClick={() => removeFilter(i)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: '#fff', color: '#94a3b8' }}>✕</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>期間：</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>〜</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
        {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', background: '#fff' }}>クリア</button>}
        <button onClick={addFilter} style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#1e3a5f', fontWeight: 600, whiteSpace: 'nowrap' }}>＋ 検索条件を追加</button>
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{filtered.length}件</div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <p>取引データがありません</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>CSVをインポートしてください</p>
        </div>
      ) : (
        <div>
          {filtered.map((t, i) => {
            const amount = formatAmount(t.金額);
            return (
              <div key={t.ID || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(t.日付)}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{t.内容}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.保有金融機関}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: amount.color }}>{amount.text}</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {t.内容 !== '振替' && t.大項目 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>{t.大項目}</span>}
                    {t.内容 !== '振替' && t.中項目 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a' }}>{t.中項目}</span>}
                    {savingsPlans.length > 0 && (
                      <select
                        value={txLinks[t.ID || i] || ''}
                        onChange={e => setLink(t.ID || i, e.target.value)}
                        style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}
                      >
                        <option value="">積立未設定</option>
                        {savingsPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
