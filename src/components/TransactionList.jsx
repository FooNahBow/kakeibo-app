import { useState } from 'react';
export default function TransactionList({ transactions }) {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const categories = [...new Set(transactions.map(t => t.大項目).filter(Boolean))];
  const filtered = transactions.filter(t => {
    const matchText = !filter || t.内容?.includes(filter) || t.保有金融機関?.includes(filter);
    const matchCategory = !categoryFilter || t.大項目 === categoryFilter;
    return matchText && matchCategory;
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="内容・金融機関で検索..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
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
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {t.内容 !== '振替' && t.大項目 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>{t.大項目}</span>}
                    {t.内容 !== '振替' && t.中項目 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a' }}>{t.中項目}</span>}
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
