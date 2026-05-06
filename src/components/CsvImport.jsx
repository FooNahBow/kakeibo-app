import { useState, useCallback } from 'react';
import { decodeShiftJIS, parseCSV, filterDuplicates } from '../utils/csvParser';
import { getExistingIds, appendTransactions, isSignedIn } from '../utils/googleSheets';

export default function CsvImport({ onImportComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setStatus('error');
      setMessage('CSVファイルを選択してください');
      return;
    }
    if (!isSignedIn()) {
      setStatus('error');
      setMessage('先にGoogleアカウントでサインインしてください');
      return;
    }
    setStatus('loading');
    setMessage('CSVを読み込み中...');
    try {
      const buffer = await file.arrayBuffer();
      const text = await decodeShiftJIS(buffer);
      const transactions = parseCSV(text);
      setMessage(`${transactions.length}件のデータを検出。重複チェック中...`);
      const existingIds = await getExistingIds();
      const newTransactions = filterDuplicates(transactions, existingIds);
      if (newTransactions.length === 0) {
        setStatus('success');
        setMessage('新しいデータはありませんでした（すべて重複）');
        return;
      }
      setMessage(`${newTransactions.length}件をスプレッドシートに保存中...`);
      await appendTransactions(newTransactions);
      setStatus('success');
      setMessage(`✅ ${newTransactions.length}件のデータをインポートしました`);
      onImportComplete?.();
    } catch (error) {
      setStatus('error');
      setMessage(`エラーが発生しました: ${error.message}`);
    }
  }, [onImportComplete]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => handleFile(e.target.files[0]);

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={() => document.getElementById('csv-file-input').click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#2563eb' : '#4a7fa5'}`,
          borderRadius: '12px',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#dbeafe' : '#f8fafc',
        }}
      >
        <input id="csv-file-input" type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} />
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📥</div>
        <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 6px' }}>CSVファイルをドラッグ&ドロップ</p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>またはクリックしてファイルを選択</p>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>マネーフォワードMEのCSVに対応</p>
      </div>
      {status && status !== 'loading' && (
        <div style={{
          marginTop: '12px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
          background: status === 'success' ? '#f0fdf4' : '#fef2f2',
          color: status === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}