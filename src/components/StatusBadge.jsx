const STATUS_STYLES = {
  present: { bg: '#e8f5e9', color: '#1b5e20', label: 'Present' },
  absent: { bg: '#fde8e8', color: '#b71c1c', label: 'Absent' },
  'half-day': { bg: '#fff8e1', color: '#e65100', label: 'Half Day' },
  late: { bg: '#e3f2fd', color: '#0d47a1', label: 'Late' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: '#f0f4f8', color: '#4a5d73', label: status || '—' };
  return (
    <span className="status-badge" style={{ background: style.bg, color: style.color }}>
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
    { key: 'total', label: 'Total Marked' },
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'halfDay', label: 'Half Day' },
    { key: 'late', label: 'Late' },
  ];

  return (
    <div className="summary-cards">
      {items.map((item) => (
        <div key={item.key} className="summary-card" data-key={item.key}>
          <span className="summary-card__value">{summary?.[item.key] ?? 0}</span>
          <span className="summary-card__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
