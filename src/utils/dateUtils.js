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

export function getAvailableMonths(transactions) {
  const months = new Set();
  transactions.forEach(t => {
    if (!t.日付) return;
    const d = new Date(t.日付);
    if (isNaN(d)) return;
    const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    months.add(ym);
  });
  return [...months].sort().reverse();
}