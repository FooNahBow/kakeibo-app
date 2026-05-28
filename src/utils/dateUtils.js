import { isHoliday } from 'japanese-holidays';

function adjustToWeekday(date) {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6 || isHoliday(d)) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function getMonthEnd(year, month) {
  const lastDay = new Date(year, month, 0);
  return adjustToWeekday(lastDay);
}

export function getMonthRange(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = getMonthEnd(y, m - 1);
  const nextEnd = getMonthEnd(y, m);
  const end = new Date(nextEnd);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

export function isInMonth(dateStr, yearMonth) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const { start, end } = getMonthRange(yearMonth);
  return d >= start && d <= end;
}

export function getMonthForDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  // 日付が属する月を営業日ベースで判定（最大24ヶ月分探索）
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const month = now.getMonth() + 1 - i;
    const year = now.getFullYear() + Math.floor((now.getMonth() - i) / 12);
    const ym = `${year}-${String(((month - 1 + 12) % 12) + 1).padStart(2, '0')}`;
    const { start, end } = getMonthRange(ym);
    if (d >= start && d <= end) return ym;
  }
  return null;
}

export function getAvailableMonths(transactions) {
  const months = new Set();
  transactions.forEach(t => {
    if (!t.日付) return;
    const ym = getMonthForDate(t.日付);
    if (ym) months.add(ym);
  });
  return [...months].sort().reverse();
}
