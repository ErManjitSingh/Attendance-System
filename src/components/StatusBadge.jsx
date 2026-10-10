const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  'half-day': 'Half Day',
  late: 'Late',
  'not-marked': 'Not marked',
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || '—';
  const tone = STATUS_LABELS[status] ? status : 'unknown';
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
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
