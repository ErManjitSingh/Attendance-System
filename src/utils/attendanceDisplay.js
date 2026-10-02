const WHEN_OPTS = {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

const CLOCK_OPTS = {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', WHEN_OPTS);
}

export function formatClock(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', CLOCK_OPTS);
}

export function formatClockRange(start, end) {
  const from = start ? formatClock(start) : '';
  const to = end ? formatClock(end) : '';
  if (from && to && from !== '—' && to !== '—') return `${from} – ${to}`;
  return from || to || '—';
}

export function getLogoutAddress(record) {
  return record?.logoutLocation?.address?.trim() || '';
}

export function summarizeFollowUps(list = []) {
  return (list || []).reduce(
    (acc, item) => {
      acc.slots += 1;
      acc.followups += Number(item.followups) || 0;
      acc.prospects += Number(item.prospects) || 0;
      acc.pipeline += Number(item.pipeline) || 0;
      return acc;
    },
    { slots: 0, followups: 0, prospects: 0, pipeline: 0 },
  );
}
