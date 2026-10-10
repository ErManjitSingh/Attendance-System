import { getMakerName } from '../api/makers';
import { COMPANIES } from '../config/branding';
import { getCompanyKey } from './company';
import { getDaysInMonth, toDateString } from './date';

const COUNTED = new Set(['present', 'late', 'half-day', 'absent']);

function listElapsedMonSat(month, today) {
  if (!month || month > today.slice(0, 7)) return [];
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = month === today.slice(0, 7) ? Number(today.slice(8, 10)) : getDaysInMonth(month);
  const dates = [];
  for (let day = 1; day <= lastDay; day += 1) {
    if (new Date(year, monthNumber - 1, day).getDay() === 0) continue;
    dates.push(`${month}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}

function istMinutes(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

export function formatAverageCheckIn(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  const rounded = Math.round(minutes);
  const hour24 = Math.floor(rounded / 60) % 24;
  const minute = rounded % 60;
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function recordsByDate(records) {
  const byDate = new Map();
  records.forEach((record) => {
    if (record?.date && !byDate.has(record.date)) byDate.set(record.date, record);
  });
  return [...byDate.values()];
}

export function buildMonthlyUserRows(makers, month, records, today = toDateString()) {
  const elapsed = new Set(listElapsedMonSat(month, today));
  const byUser = new Map();
  records.forEach((record) => {
    const id = String(record.userId);
    if (!byUser.has(id)) byUser.set(id, []);
    byUser.get(id).push(record);
  });

  return makers.map((maker) => {
    const days = recordsByDate(byUser.get(String(maker._id)) || []);
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let absent = 0;
    let markedWorkingDays = 0;
    const checkIns = [];

    days.forEach((record) => {
      if (record.status === 'present') present += 1;
      else if (record.status === 'late') late += 1;
      else if (record.status === 'half-day') halfDay += 1;
      else if (record.status === 'absent') absent += 1;

      if (elapsed.has(record.date) && COUNTED.has(record.status)) markedWorkingDays += 1;
      if (record.markedAt && record.status !== 'absent') {
        const minutes = istMinutes(record.markedAt);
        if (minutes != null) checkIns.push(minutes);
      }
    });

    const companyKey = getCompanyKey(maker.companyName) || 'other';
    const averageCheckInMinutes = checkIns.length
      ? checkIns.reduce((sum, value) => sum + value, 0) / checkIns.length
      : null;

    return {
      userId: String(maker._id),
      userName: getMakerName(maker),
      designation: maker.designation || '—',
      companyKey,
      companyLabel: COMPANIES[companyKey]?.label || maker.companyName || 'Other',
      workingDays: present + late,
      leave: Math.max(0, elapsed.size - markedWorkingDays),
      halfDay,
      absent,
      present,
      late,
      averageCheckIn: formatAverageCheckIn(averageCheckInMinutes),
      averageCheckInMinutes,
    };
  });
}

function compareCheckIn(a, b, direction) {
  if (a.averageCheckInMinutes == null && b.averageCheckInMinutes == null) {
    return a.userName.localeCompare(b.userName, 'en', { sensitivity: 'base' });
  }
  if (a.averageCheckInMinutes == null) return 1;
  if (b.averageCheckInMinutes == null) return -1;
  return direction * (a.averageCheckInMinutes - b.averageCheckInMinutes);
}

export function sortMonthlyRows(rows, sortBy) {
  const sorted = [...rows];
  if (sortBy === 'come-first') sorted.sort((a, b) => compareCheckIn(a, b, 1));
  else if (sortBy === 'come-late') sorted.sort((a, b) => compareCheckIn(a, b, -1));
  else sorted.sort((a, b) => a.userName.localeCompare(b.userName, 'en', { sensitivity: 'base' }));
  return sorted;
}
