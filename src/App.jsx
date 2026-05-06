import { isInMonth } from './utils/dateUtils';
import { useState, useEffect } from 'react';
import CsvImport from './components/CsvImport';
import TransactionList from './components/TransactionList';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import {
  initGoogleAuth, signIn, signOut,
  getTransactions, initializeSpreadsheet, isSignedIn,
} from './utils/googleSheets';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState(() => { try { const s = localStorage.getItem("kakeibo_budgets"); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  const [categories, setCategories] = useState(() => { try { const s = localStorage.getItem("kakeibo_categories"); return s ? JSON.parse(s) : []; } catch { return []; } });

  useEffect(() => {
    initGoogleAuth(async () => {
      await initializeSpreadsheet();
      await loadTransactions();
    });
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  };

  const saveBudgets = (b) => { setBudgets(b); try { localStorage.setItem("kakeibo_budgets", JSON.stringify(b)); } catch {} };
  const saveCategories = (cats) => { setCategories(cats); try { localStorage.setItem("kakeibo_categories", JSON.stringify(cats)); } catch {} };
  const handleImportComplete = () => {
    loadTransactions();
    setActiveTab('list');
  };

  const btnStyle = (active) => ({
    padding: '12px 16px', border: 'none', background: 'none', fontSize: '12px',
    cursor: 'pointer', borderBottom: active ? '2px solid #1e3a5f' : '2px solid transparent',
    color: active ? '#1e3a5f' : '#64748b', fontWeight: active ? '600' : 'normal',
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Hiragino Sans, Yu Gothic UI, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#1e3a5f', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>💰</span>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>家計管理</h1>
        </div>
      </header>

      <nav style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', overflowX: 'auto' }}>
        <button style={btnStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>📊 ダッシュボード</button>
        <button style={btnStyle(activeTab === 'import')} onClick={() => setActiveTab('import')}>📥 インポート</button>
        <button style={btnStyle(activeTab === 'list')} onClick={() => { setActiveTab('list'); loadTransactions(); }}>📋 取引一覧</button>
        <button style={btnStyle(activeTab === 'budget')} onClick={() => setActiveTab('budget')}>🎯 予算管理</button>
        <button style={btnStyle(activeTab === 'category')} onClick={() => setActiveTab('category')}>🏷️ カテゴリ</button>
      </nav>

      <main style={{ padding: '24px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard transactions={transactions} budgets={budgets} categories={categories} loading={loading} />
        )}
        {activeTab === 'import' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>CSVインポート</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
              マネーフォワードMEからエクスポートしたCSVをドラッグ&ドロップしてください。
            </p>
            <CsvImport onImportComplete={handleImportComplete} />
          </div>
        )}
        {activeTab === 'list' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>取引一覧</h2>
              <button onClick={loadTransactions} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔄 更新</button>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>読み込み中...</div> : <TransactionList transactions={transactions} />}
          </div>
        )}
        {activeTab === 'budget' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>予算管理</h2>
            <BudgetManager transactions={transactions} budgets={budgets} setBudgets={saveBudgets} categories={categories} />
          </div>
        )}
        {activeTab === 'category' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>カテゴリ管理</h2>
            <CategoryManager categories={categories} setCategories={saveCategories} />
          </div>
        )}
      </main>
    </div>
  );
}

function BudgetManager({ transactions, budgets, setBudgets, categories }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter(t => isInMonth(t.日付, currentMonth) && parseInt(t.金額) < 0 && String(t.計算対象) === "1" && t.内容 !== "振替");
  const usedCats = [...new Set(monthlyTransactions.map(t => t.大項目).filter(Boolean))];
  const fixedCats = (categories || []).filter(c => c.budget > 0).map(c => c.name);
  const allCats = [...new Set([...fixedCats, ...usedCats])];
  const getCatBudget = (cat) => { const found = (categories || []).find(c => c.name === cat); return found?.budget || budgets[cat] || 0; };
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