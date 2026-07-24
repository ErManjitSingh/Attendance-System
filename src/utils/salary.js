import { getMakerName, normalizeSalaryHistory } from '../api/makers';
import { getDaysInMonth } from './date';

const PAID_STATUSES = new Set(['present', 'late', 'half-day']);

export function isSunday(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

/** Mon–Sat days in a YYYY-MM month (Sunday excluded by default). */
export function countMonSatDays(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const daysInMonth = getDaysInMonth(monthStr);
  let count = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const day = new Date(y, m - 1, d).getDay();
    if (day !== 0) count += 1;
  }
  return count;
}

export function getSalaryEntryForMonth(user, month) {
  const history = normalizeSalaryHistory(user?.salaryHistory);
  return history.find((entry) => entry.month === month) || null;
}

export function formatINR(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Monthly salary:
 * paidDays = present + late + (halfDay × 0.5)
 * totalWorkingDays = Mon–Sat days + Sundays with present/late/half-day
 * net = (basic / totalWorkingDays × paidDays) + overtime − epf
 */
export function calculateMonthlySalary(user, month, attendanceRecords = []) {
  const entry = getSalaryEntryForMonth(user, month);
  const basicSalary = entry?.basicSalary ?? 0;
  const overtime = entry?.overtime ?? 0;
  const epf = entry?.epf ?? 0;
  const hasSalaryEntry = Boolean(entry);

  const userId = String(user?._id || '');
  const userRecords = attendanceRecords.filter((r) => String(r.userId) === userId);

  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let late = 0;
  const sundayDates = new Set();

  for (const record of userRecords) {
    const status = record?.status;
    if (status === 'present') present += 1;
    else if (status === 'absent') absent += 1;
    else if (status === 'half-day') halfDay += 1;
    else if (status === 'late') late += 1;

    if (isSunday(record?.date) && PAID_STATUSES.has(status)) {
      sundayDates.add(record.date);
    }
  }

  const paidDays = present + late + halfDay * 0.5;
  const monSatDays = countMonSatDays(month);
  const sundayWorkedDays = sundayDates.size;
  const totalWorkingDays = monSatDays + sundayWorkedDays;
  const perDaySalary = totalWorkingDays > 0 ? basicSalary / totalWorkingDays : 0;
  const earnedBasic = perDaySalary * paidDays;
  const gross = earnedBasic + overtime;
  const netSalary = gross - epf;

  return {
    userId,
    userName: getMakerName(user),
    designation: user?.designation || '—',
    month,
    hasSalaryEntry,
    basicSalary,
    overtime,
    epf,
    present,
    absent,
    halfDay,
    late,
    markedDays: userRecords.length,
    paidDays,
    monSatDays,
    sundayWorkedDays,
    totalWorkingDays,
    perDaySalary,
    earnedBasic,
    gross,
    netSalary,
  };
}

export function buildMonthSalaryRows(makers, month, attendanceRecords) {
  return makers
    .map((maker) => calculateMonthlySalary(maker, month, attendanceRecords))
    .sort((a, b) => a.userName.localeCompare(b.userName, 'en', { sensitivity: 'base' }));
}
