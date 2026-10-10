import * as XLSX from 'xlsx';
import { formatClockRange, formatWhen, getLogoutAddress, summarizeFollowUps } from './attendanceDisplay';

const ATTENDANCE_HEADERS = [
  'Company',
  'Date',
  'Employee',
  'Designation',
  'Status',
  'Team Leader',
  'Manager',
  'Check-in',
  'Check-in Address',
  'Logout',
  'Logout Address',
  'Follow-ups',
  'Prospects',
  'Pipeline',
  'Hour slots',
  'Note',
];

const FOLLOW_HEADERS = [
  'Company',
  'Date',
  'Employee',
  'Designation',
  'Hour window',
  'Follow-ups',
  'Prospects',
  'Pipeline',
  'Details',
  'Submitted',
  'After office',
];

function attendanceRow(row) {
  const follow = summarizeFollowUps(row.hourlyFollowUps);
  return {
    Company: row.companyLabel || '',
    Date: row.date || '',
    Employee: row.userName || '',
    Designation: row.designation || '',
    Status: row.missing ? 'not marked' : row.status || '',
    'Team Leader': row.teamLeaderName || '',
    Manager: row.managerName || '',
    'Check-in': row.markedAt ? formatWhen(row.markedAt) : '',
    'Check-in Address': row.currentLocation?.address?.trim() || '',
    Logout: row.logoutAt ? formatWhen(row.logoutAt) : row.missing ? '' : 'Still in',
    'Logout Address': getLogoutAddress(row),
    'Follow-ups': follow.followups,
    Prospects: follow.prospects,
    Pipeline: follow.pipeline,
    'Hour slots': follow.slots,
    Note: row.note || '',
  };
}

function followRowsFor(row) {
  return (row.hourlyFollowUps || []).map((slot) => ({
    Company: row.companyLabel || '',
    Date: row.date || '',
    Employee: row.userName || '',
    Designation: row.designation || '',
    'Hour window': formatClockRange(slot.windowStart, slot.windowEnd),
    'Follow-ups': Number(slot.followups) || 0,
    Prospects: Number(slot.prospects) || 0,
    Pipeline: Number(slot.pipeline) || 0,
    Details: slot.details?.trim() || '',
    Submitted: slot.submittedAt ? formatWhen(slot.submittedAt) : '',
    'After office': slot.afterOffice ? 'Yes' : 'No',
  }));
}

function withWidths(sheet, widths) {
  sheet['!cols'] = widths.map((width) => ({ wch: width }));
  return sheet;
}

export function downloadAttendanceExcel({ records, filename }) {
  const attendance = records.map(attendanceRow);
  const followUps = records.flatMap(followRowsFor);

  const attendanceSheet = withWidths(
    attendance.length ? XLSX.utils.json_to_sheet(attendance) : XLSX.utils.aoa_to_sheet([ATTENDANCE_HEADERS]),
    [18, 12, 22, 16, 14, 20, 20, 20, 42, 20, 42, 12, 12, 12, 12, 28],
  );
  const followSheet = withWidths(
    followUps.length ? XLSX.utils.json_to_sheet(followUps) : XLSX.utils.aoa_to_sheet([FOLLOW_HEADERS]),
    [18, 12, 22, 16, 22, 12, 12, 12, 36, 20, 14],
  );

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, attendanceSheet, 'Attendance');
  XLSX.utils.book_append_sheet(book, followSheet, 'Follow-ups');
  XLSX.writeFile(book, filename);
}

const MONTH_HEADERS = [
  'Company',
  'User',
  'Designation',
  'Working days',
  'Leave',
  'Half day',
  'Absent',
  'Average check-in',
];

export function downloadMonthlyReportExcel({ rows, filename }) {
  const data = rows.map((row) => ({
    Company: row.companyLabel || '',
    User: row.userName || '',
    Designation: row.designation || '',
    'Working days': row.workingDays,
    Leave: row.leave,
    'Half day': row.halfDay,
    Absent: row.absent,
    'Average check-in': row.averageCheckIn === '—' ? '' : row.averageCheckIn,
  }));
  const sheet = withWidths(
    data.length ? XLSX.utils.json_to_sheet(data) : XLSX.utils.aoa_to_sheet([MONTH_HEADERS]),
    [18, 24, 16, 14, 12, 12, 12, 18],
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Monthly report');
  XLSX.writeFile(book, filename);
}
