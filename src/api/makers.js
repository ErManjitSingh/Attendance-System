import { ENDPOINTS } from '../config/api';
import { apiFetch } from './client';

export async function fetchMakers() {
  const data = await apiFetch(ENDPOINTS.makers);
  return Array.isArray(data) ? data : data?.data ?? [];
}

export function getMakerName(maker) {
  if (!maker) return 'Unknown';
  return [maker.firstName, maker.lastName].filter(Boolean).join(' ').trim() || maker.email || 'Unknown';
}

export function normalizeDesignation(designation = '') {
  return String(designation).trim().toLowerCase();
}

export function filterAttendanceRoles(makers) {
  const roles = new Set(['executive', 'team leader', 'manager']);
  return makers.filter((m) => m.active !== false && roles.has(normalizeDesignation(m.designation)));
}
