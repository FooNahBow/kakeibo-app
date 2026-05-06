const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1Vz1FAa8zH2zNKnsYQjYUkvr0NjAwg0FpV_oWcWPYvtAdMpCgmHi-0JFYyVYMRKzoDA/exec'; // このURLはそのまま残す

export async function getExistingIds() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getIds`);
    const data = await response.json();
    return data.ids || [];
  } catch {
    return [];
  }
}

export async function appendTransactions(transactions) {
  if (!transactions.length) return { added: 0 };
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'append', transactions }),
  });
  const data = await response.json();
  return { added: data.added || 0 };
}

export async function getTransactions() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getAll`);
    const data = await response.json();
    return data.transactions || [];
  } catch {
    return [];
  }
}

export function initGoogleAuth(onSignIn) {
  onSignIn();
}

export function signIn() {}
export function signOut() {}
export const isSignedIn = () => true;