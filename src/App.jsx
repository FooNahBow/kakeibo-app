import { isInMonth } from './utils/dateUtils';
import { useState, useEffect } from 'react';
import CsvImport from './components/CsvImport';
import TransactionList from './components/TransactionList';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import SavingsManager, { getSavingsForMonth } from './components/SavingsManager';
import {
  initGoogleAuth, signIn, signOut,
  getTransactions, initializeSpreadsheet, isSignedIn,
} from './utils/googleSheets';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [savingsPlans, setSavingsPlans] = useState(() => { try { return JSON.parse(localStorage.getItem('kakeibo_savings') || '[]'); } catch { return []; } });
  const [categories, setCategories] = useState(() => { try { const s = localStorage.getItem("kakeibo_categories"); return s ? JSON.parse(s) : []; } catch { return []; } });

  useEffect(() => {
    initGoogleAuth(async () => {
      setSignedIn(true);
      await initializeSpreadsheet();
      await loadTransactions();
    });
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
      try { localStorage.setItem('kakeibo_transactions', JSON.stringify(data)); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const saveBudgets = (cats) => { saveCategories(cats); };
  const saveCategories = (cats) => { setCategories(cats); try { localStorage.setItem("kakeibo_categories", JSON.stringify(cats)); } catch {} };
  const handleImportComplete = () => {
    loadTransactions();
    setActiveTab('list');
  };

  const btnStyle = (active) => ({
    padding: '10px 16px', border: 'none', fontSize: '12px',
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    borderBottom: active ? '3px solid #1e3a5f' : '3px solid transparent',
    color: active ? '#1e3a5f' : '#64748b',
    fontWeight: active ? '700' : 'normal',
    background: active ? '#f0f4f8' : 'none',
    borderRadius: '6px 6px 0 0',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f0f4f8', overflow: 'hidden', fontFamily: 'BIZ UDPGothic, Yu Gothic UI, Hiragino Kaku Gothic ProN, sans-serif', WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#1e3a5f', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>💰</span>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>家計管理</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {signedIn ? (
            <>
              <label
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.background='rgba(255,255,255,0.25)'; }}
                onDragLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; }}
                onDrop={async e => {
                  e.preventDefault();
                  e.currentTarget.style.background='rgba(255,255,255,0.1)';
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  const { decodeShiftJIS, parseCSV, filterDuplicates } = await import('./utils/csvParser');
                  const { getExistingIds, appendTransactions } = await import('./utils/googleSheets');
                  const buffer = await file.arrayBuffer();
                  const text = await decodeShiftJIS(buffer);
                  const transactions = parseCSV(text);
                  const existingIds = await getExistingIds();
                  const newTx = filterDuplicates(transactions, existingIds);
                  if (newTx.length > 0) { await appendTransactions(newTx); loadTransactions(); }
                  alert(newTx.length > 0 ? `${newTx.length}件インポートしました` : '新しいデータはありませんでした');
                }}
                style={{ padding: '10px 32px', fontSize: 13, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, display:'flex', alignItems:'center', gap:8, transition:'background 0.15s', minWidth: 200, justifyContent:'center' }}>
                📥 CSVをドラッグ&ドロップ / クリックして選択
                <input type="file" accept=".csv" style={{ display:'none' }} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const { decodeShiftJIS, parseCSV, filterDuplicates } = await import('./utils/csvParser');
                  const { getExistingIds, appendTransactions } = await import('./utils/googleSheets');
                  const buffer = await file.arrayBuffer();
                  const text = await decodeShiftJIS(buffer);
                  const transactions = parseCSV(text);
                  const existingIds = await getExistingIds();
                  const newTx = filterDuplicates(transactions, existingIds);
                  if (newTx.length > 0) { await appendTransactions(newTx); loadTransactions(); }
                  alert(newTx.length > 0 ? `${newTx.length}件インポートしました` : '新しいデータはありませんでした');
                  e.target.value = '';
                }} />
              </label>
              <span style={{ fontSize: 11, color: '#93c5fd' }}>✓ Google連携済み</span>
              <button onClick={() => { signOut(); setSignedIn(false); }}
                style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>
                サインアウト
              </button>
            </>
          ) : (
            <button onClick={() => signIn().then(() => { setSignedIn(true); initializeSpreadsheet(); loadTransactions(); })}
              style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Googleでサインイン
            </button>
          )}
        </div>
      </header>

      <nav style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', overflowX: 'auto', flexWrap: 'nowrap', minHeight: 44, borderRadius: '0 0 12px 12px' }}>
        <button style={btnStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>📊 ダッシュボード</button>
        <button style={btnStyle(activeTab === 'savings')} onClick={() => setActiveTab('savings')}>💰 積立管理</button>
        <button style={btnStyle(activeTab === 'category')} onClick={() => setActiveTab('category')}>🏷️ カテゴリ</button>
        <button style={btnStyle(activeTab === 'list')} onClick={() => { setActiveTab('list'); loadTransactions(); }}>📋 取引一覧</button>
      </nav>

      <main style={{ padding: '24px', minHeight: 'calc(100vh - 112px)' }}>
        {activeTab === 'dashboard' && (
          <div>

            <Dashboard transactions={transactions} budgets={{}} categories={categories} loading={loading} />
          </div>
        )}

        {activeTab === 'list' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>取引一覧</h2>
              <button onClick={loadTransactions} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔄 更新</button>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>読み込み中...</div> : <TransactionList transactions={transactions} savingsPlans={savingsPlans} />}
          </div>
        )}

        {activeTab === 'savings' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <SavingsManager categories={categories} />
          </div>
        )}
        {activeTab === 'category' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>カテゴリ管理</h2>
            <CategoryManager categories={categories} setCategories={saveCategories} transactions={transactions} />
          </div>
        )}
      </main>
    </div>
  );
}

function BudgetManager({ transactions, categories, setCategories }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter(t => isInMonth(t.日付, currentMonth) && parseInt(t.金額) < 0 && String(t.計算対象) === "1" && t.内容 !== "振替");
  const usedCats = [...new Set(monthlyTransactions.map(t => t.大項目).filter(Boolean))];
  const fixedCats = (categories || []).filter(c => c.budget > 0).map(c => c.name);
  const allCats = [...new Set([...fixedCats, ...usedCats])];
  const getCatBudget = (cat) => { const found = (categories || []).find(c => c.name === cat); return found?.budget || 0; };
  const getSpent = (category) => Math.abs(monthlyTransactions.filter(t => t.大項目 === category).reduce((sum, t) => sum + (parseInt(t.金額) || 0), 0));
  const getSubSpent = (category, subName) => Math.abs(monthlyTransactions.filter(t => t.大項目 === category && t.中項目 === subName).reduce((sum, t) => sum + (parseInt(t.金額) || 0), 0));
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
  const [expanded, setExpanded] = useState({});

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{currentMonth}の予算設定</p>
      {allCats.map(cat => {
        const spent = getSpent(cat);
        const budget = getCatBudget(cat);
        const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        const color = getBarColor(pct);
        const catObj = (categories || []).find(c => c.name === cat);
        const subs = (catObj?.subcategories || []).filter(s => (s.budget || 0) > 0 || getSubSpent(cat, s.name || s) > 0);
        const isExpanded = expanded[cat];
        return (
          <div key={cat} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', cursor: subs.length > 0 ? 'pointer' : 'default' }}
              onClick={() => subs.length > 0 && setExpanded(e => ({ ...e, [cat]: !e[cat] }))}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {subs.length > 0 && <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</span>}
                {cat}
              </span>
              <span style={{ color: pct >= 100 ? '#dc2626' : '#64748b' }}>¥{spent.toLocaleString()} / ¥{budget.toLocaleString()}</span>
            </div>
            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', marginBottom: '4px' }}>
              <div style={{ width: `${pct}%`, height: '8px', borderRadius: '4px', background: color, transition: 'width 0.3s' }} />
            </div>
            {isExpanded && subs.map(sub => {
              const subName = sub.name || sub;
              const subBudget = sub.budget || 0;
              const subSpent = getSubSpent(cat, subName);
              const subPct = subBudget > 0 ? Math.min((subSpent / subBudget) * 100, 100) : 0;
              const subColor = getBarColor(subPct);
              return (
                <div key={subName} style={{ marginLeft: '16px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px', color: '#475569' }}>
                    <span>{subName}</span>
                    <span style={{ color: subPct >= 100 ? '#dc2626' : '#64748b' }}>¥{subSpent.toLocaleString()} / ¥{subBudget.toLocaleString()}</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '5px' }}>
                    <div style={{ width: `${subPct}%`, height: '5px', borderRadius: '4px', background: subColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {allCats.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>今月の取引データがありません</p>}
    </div>
  );
}