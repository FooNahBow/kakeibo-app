const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SHEET = '%E5%8F%96%E5%BC%95%E3%82%B7%E3%83%BC%E3%83%88';

let tokenClient = null;
let accessToken = null;

export function initGoogleAuth(onSignIn) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    callback: (response) => {
      if (response.error) return;
      accessToken = response.access_token;
      onSignIn(response);
    },
  });
}

export function signIn() {
  if (tokenClient) tokenClient.requestAccessToken();
}

export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
}

export async function getExistingIds() {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!J2:J`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    return (data.values || []).flat();
  } catch {
    return [];
  }
}

export async function appendTransactions(transactions) {
  if (!transactions.length) return { added: 0 };
  const values = transactions.map(t => [
    t.計算対象, t.日付, t.内容, t.金額, t.保有金融機関,
    t.大項目, t.中項目, t.メモ, t.振替, t.ID,
  ]);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A1/append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  return { added: transactions.length, data: await response.json() };
}

export async function getTransactions() {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A:J`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    const rows = data.values || [];
    if (rows.length < 2) return [];
    return rows.slice(1).map(row => ({
      計算対象: row[0] || '', 日付: row[1] || '', 内容: row[2] || '',
      金額: parseInt(row[3]) || 0, 保有金融機関: row[4] || '',
      大項目: row[5] || '', 中項目: row[6] || '', メモ: row[7] || '',
      振替: row[8] || '', ID: row[9] || '',
    }));
  } catch {
    return [];
  }
}

export async function initializeSpreadsheet() {
  try {
    const headers = [['計算対象', '日付', '内容', '金額', '保有金融機関', '大項目', '中項目', 'メモ', '振替', 'ID']];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A1:J1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: headers }),
      }
    );
  } catch {
    // 初期化エラーは無視
  }
}

export const isSignedIn = () => !!accessToken;