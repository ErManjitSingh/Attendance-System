import { ENDPOINTS } from '../config/api';
import { apiFetch } from './client';

const base = ENDPOINTS.attendance;

export function getTodayAttendance(userId, date) {
  const q = date ? `?date=${date}` : '';
  return apiFetch(`${base}/today/${userId}${q}`);
}

export function getAttendanceByUser(userId, { month, date } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (date) params.set('date', date);
  const q = params.toString() ? `?${params}` : '';
  return apiFetch(`${base}/user/${userId}${q}`);
}

export function getAttendanceByUserMonth(userId, month) {
  return apiFetch(`${base}/user/${userId}/month/${month}`);
}

export function getAttendanceByMonth(month, filters = {}) {
  const params = new URLSearchParams();
  if (filters.teamLeaderId) params.set('teamLeaderId', filters.teamLeaderId);
  if (filters.managerId) params.set('managerId', filters.managerId);
  if (filters.status) params.set('status', filters.status);
  const q = params.toString() ? `?${params}` : '';
  return apiFetch(`${base}/month/${month}${q}`);
}

export function getAttendanceByTeamLeader(teamLeaderId, month) {
  return apiFetch(`${base}/team-leader/${teamLeaderId}/month/${month}`);
}

export function getAttendanceByManager(managerId, month) {
  return apiFetch(`${base}/manager/${managerId}/month/${month}`);
}

export function markAttendance({ userId, date, status = 'present', note }) {
  return apiFetch(`${base}/mark`, {
    method: 'POST',
    body: JSON.stringify({ userId, date, status, note }),
  });
}

export function updateAttendance(id, { status, note }) {
  return apiFetch(`${base}/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

export function deleteAttendance(id) {
  return apiFetch(`${base}/delete/${id}`, { method: 'DELETE' });
}
