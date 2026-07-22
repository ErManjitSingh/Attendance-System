import { ENDPOINTS } from '../config/api';
import { apiFetch } from './client';

export async function fetchMakers() {
  const data = await apiFetch(ENDPOINTS.makers);
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function updateMaker(id, payload) {
  return apiFetch(ENDPOINTS.updateMaker(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteMaker(id) {
  return apiFetch(ENDPOINTS.deleteMaker(id), { method: 'DELETE' });
}

export async function updateMakerStatus(id, status) {
  return apiFetch(ENDPOINTS.updateMakerStatus(id), {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function getMakerName(maker) {
  if (!maker) return 'Unknown';
  return [maker.firstName, maker.lastName].filter(Boolean).join(' ').trim() || maker.email || 'Unknown';
}

export function normalizeDesignation(designation = '') {
  return String(designation).trim().toLowerCase();
}

export function isUserActiveFlag(user) {
  return user?.active !== false;
}

export function filterAttendanceRoles(makers) {
  const roles = new Set(['executive', 'team leader', 'manager']);
  return makers.filter((m) => m.active !== false && roles.has(normalizeDesignation(m.designation)));
}

export function emptySalaryEntry() {
  return { month: '', basicSalary: 0, overtime: 0, epf: 0 };
}

export function normalizeSalaryHistory(list) {
  if (!Array.isArray(list)) return [];
  return list.map((entry) => ({
    month: entry?.month || '',
    basicSalary: Number(entry?.basicSalary) || 0,
    overtime: Number(entry?.overtime) || 0,
    epf: Number(entry?.epf) || 0,
  }));
}
