/**
 * マネーフォワードME CSVパーサー
 * Shift-JIS → UTF-8変換 + プライバシー処理
 */

// Shift-JISをUTF-8に変換
export async function decodeShiftJIS(buffer) {
  const decoder = new TextDecoder('shift-jis');
  return decoder.decode(buffer);
}

// CSVテキストをパース
export function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const transaction = {
      計算対象: cols[0]?.replace(/"/g, '').trim(),
      日付: cols[1]?.replace(/"/g, '').trim(),
      内容: cols[2]?.replace(/"/g, '').trim(),
      金額: parseInt(cols[3]?.replace(/"/g, '').trim()) || 0,
      保有金融機関: cols[4]?.replace(/"/g, '').trim(),
      大項目: cols[5]?.replace(/"/g, '').trim(),
      中項目: cols[6]?.replace(/"/g, '').trim(),
      メモ: cols[7]?.replace(/"/g, '').trim(),
      振替: cols[8]?.replace(/"/g, '').trim(),
      ID: cols[9]?.replace(/"/g, '').trim(),
    };

    transaction.内容 = applyPrivacyMask(transaction);
    transactions.push(transaction);
  }

  return transactions;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function applyPrivacyMask(transaction) {
  const { 内容, 振替, 大項目 } = transaction;
  if (振替 === '1') return '振替';
  if (大項目 === '給与' || (大項目 === '収入' && 内容?.includes('給与'))) return '給与';
  return 内容;
}

export function filterDuplicates(newTransactions, existingIds) {
  return newTransactions.filter(t => !existingIds.includes(t.ID));
}