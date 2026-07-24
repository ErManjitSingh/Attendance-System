import { formatMonthLabel } from '../utils/date';
import { formatINR } from '../utils/salary';
import './SalaryDetailModal.css';

function DetailRow({ label, value, highlight, muted }) {
  return (
    <div className={`salary-modal__row ${highlight ? 'salary-modal__row--highlight' : ''} ${muted ? 'salary-modal__row--muted' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function SalaryDetailModal({ detail, onClose }) {
  if (!detail) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="salary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="salary-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="salary-modal__header">
          <div>
            <p className="salary-modal__eyebrow">Monthly Salary</p>
            <h3 id="salary-detail-title">{detail.userName}</h3>
            <p className="salary-modal__sub">
              {detail.designation} · {formatMonthLabel(detail.month)}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="salary-modal__body">
          {!detail.hasSalaryEntry && (
            <div className="salary-modal__alert">
              No salary entry for this month. Set basic / overtime / EPF in Users.
            </div>
          )}

          <div className="salary-modal__net">
            <span>Net Payable</span>
            <strong>{formatINR(detail.netSalary)}</strong>
          </div>

          <section className="salary-modal__section">
            <h4>Attendance</h4>
            <div className="salary-modal__grid">
              <div className="salary-modal__stat" data-tone="present">
                <strong>{detail.present}</strong>
                <span>Present</span>
              </div>
              <div className="salary-modal__stat" data-tone="late">
                <strong>{detail.late}</strong>
                <span>Late</span>
              </div>
              <div className="salary-modal__stat" data-tone="half">
                <strong>{detail.halfDay}</strong>
                <span>Half Day</span>
              </div>
              <div className="salary-modal__stat" data-tone="absent">
                <strong>{detail.absent}</strong>
                <span>Absent</span>
              </div>
            </div>
          </section>

          <section className="salary-modal__section">
            <h4>Working Days</h4>
            <DetailRow label="Mon–Sat days" value={detail.monSatDays} />
            <DetailRow label="Sunday worked" value={detail.sundayWorkedDays} />
            <DetailRow label="Total working days" value={detail.totalWorkingDays} highlight />
            <DetailRow
              label="Paid days (P + L + H×0.5)"
              value={Number(detail.paidDays).toFixed(1)}
              highlight
            />
          </section>

          <section className="salary-modal__section">
            <h4>Salary Breakdown</h4>
            <DetailRow label="Basic salary" value={formatINR(detail.basicSalary)} />
            <DetailRow label="Per day rate" value={formatINR(detail.perDaySalary)} muted />
            <DetailRow label="Earned basic" value={formatINR(detail.earnedBasic)} />
            <DetailRow label="Overtime" value={`+ ${formatINR(detail.overtime)}`} />
            <DetailRow label="Gross" value={formatINR(detail.gross)} highlight />
            <DetailRow label="EPF deduction" value={`− ${formatINR(detail.epf)}`} muted />
            <DetailRow label="Net salary" value={formatINR(detail.netSalary)} highlight />
          </section>

          <p className="salary-modal__formula">
            Net = (Basic ÷ Working Days × Paid Days) + Overtime − EPF
          </p>
        </div>

        <div className="salary-modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
