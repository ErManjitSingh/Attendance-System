const STATUS_STYLES = {
  present: { bg: '#dcfce7', color: '#166534', label: 'Present' },
  absent: { bg: '#fee2e2', color: '#991b1b', label: 'Absent' },
  'half-day': { bg: '#fef3c7', color: '#92400e', label: 'Half Day' },
  late: { bg: '#dbeafe', color: '#1e40af', label: 'Late' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: '#f3f4f6', color: '#374151', label: status || '—' };
  return (
    <span
      className="status-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

export function computeSummary(records = []) {
  return {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    halfDay: records.filter((r) => r.status === 'half-day').length,
    late: records.filter((r) => r.status === 'late').length,
  };
}

export function SummaryCards({ summary }) {
  const items = [
    { key: 'total', label: 'Total Marked', color: '#6366f1' },
    { key: 'present', label: 'Present', color: '#22c55e' },
    { key: 'absent', label: 'Absent', color: '#ef4444' },
    { key: 'halfDay', label: 'Half Day', color: '#f59e0b' },
    { key: 'late', label: 'Late', color: '#3b82f6' },
  ];

  return (
    <div className="summary-cards">
      {items.map((item) => (
        <div key={item.key} className="summary-card">
          <span className="summary-card__value" style={{ color: item.color }}>
            {summary?.[item.key] ?? 0}
          </span>
          <span className="summary-card__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
