import { useState, useEffect } from 'react';
import CsvImport from './components/CsvImport';
import TransactionList from './components/TransactionList';
import {
  initGoogleAuth, signIn, signOut,
  getTransactions, initializeSpreadsheet, isSignedIn,
} from './utils/googleSheets';

export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('import');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      initGoogleAuth(async () => {
        setSignedIn(true);
        await initializeSpreadsheet();
        await loadTransactions();
      });
    }, 500);
    return () => clearTimeout(timer);
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

  const handleSignOut = () => { signOut(); setSignedIn(false); setTransactions([]); };
  const handleImportComplete = () => { loadTransactions(); setActiveTab('list'); };

  const btnStyle = (active) => ({
    padding: '12px 20px', border: 'none', background: 'none', fontSize: '13px',
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
        {signedIn
          ? <button onClick={handleSignOut} style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>サインアウト</button>
          : <button onClick={signIn} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Googleでサインイン</button>
        }
      </header>

      {!signedIn && (
        <div style={{ background: '#fef3c7', padding: '12px 24px', fontSize: '13px', color: '#92400e', textAlign: 'center' }}>
          📊 Googleアカウントでサインインしてデータを管理してください
        </div>
      )}

      <nav style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        <button style={btnStyle(activeTab === 'import')} onClick={() => setActiveTab('import')}>📥 CSVインポート</button>
        <button style={btnStyle(activeTab === 'list')} onClick={() => { setActiveTab('list'); if (signedIn) loadTransactions(); }}>📋 取引一覧</button>
      </nav>

      <main style={{ padding: '24px' }}>
        {activeTab === 'import' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>CSVインポート</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
              マネーフォワードMEからエクスポートしたCSVファイルをドラッグ&ドロップしてください。重複データは自動的にスキップされます。
            </p>
            <CsvImport onImportComplete={handleImportComplete} />
          </div>
        )}
        {activeTab === 'list' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>取引一覧</h2>
              {signedIn && <button onClick={loadTransactions} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔄 更新</button>}
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>読み込み中...</div> : <TransactionList transactions={transactions} />}
          </div>
        )}
      </main>
    </div>
  );
}