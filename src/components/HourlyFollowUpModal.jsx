import AttendancePhoto from './AttendancePhoto';
import StatusBadge from './StatusBadge';
import {
  formatClockRange,
  formatWhen,
  getLogoutAddress,
  summarizeFollowUps,
} from '../utils/attendanceDisplay';
import './HourlyFollowUpModal.css';

function Metric({ label, value }) {
  return (
    <div className="follow-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function HourlyFollowUpModal({ record, onClose }) {
  if (!record) return null;

  const slots = [...(record.hourlyFollowUps || [])].sort(
    (a, b) => new Date(a.windowStart || a.submittedAt || 0) - new Date(b.windowStart || b.submittedAt || 0),
  );
  const totals = summarizeFollowUps(slots);
  const logoutAddress = getLogoutAddress(record);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="follow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="follow-modal__header">
          <div>
            <p className="follow-modal__eyebrow">Hourly follow-up</p>
            <h3 id="follow-title">{record.userName || 'Employee'}</h3>
            <p className="follow-modal__sub">
              {record.designation || 'Staff'} · {record.date}
              {record.teamLeaderName ? ` · ${record.teamLeaderName}` : ''}
            </p>
          </div>
          <div className="follow-modal__header-side">
            <StatusBadge status={record.status} />
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="follow-modal__body">
          <div className="follow-sessions">
            <article className="follow-session">
              <AttendancePhoto src={record.image} alt={`${record.userName || 'Employee'} check-in`} />
              <div>
                <span className="follow-session__label">Check-in</span>
                <strong>{formatWhen(record.markedAt)}</strong>
                <p>{record.currentLocation?.address?.trim() || 'Address not captured'}</p>
              </div>
            </article>
            <article className={`follow-session ${record.logoutAt ? '' : 'follow-session--pending'}`}>
              <AttendancePhoto src={record.logoutImage} alt={`${record.userName || 'Employee'} logout`} />
              <div>
                <span className="follow-session__label">Logout</span>
                <strong>{record.logoutAt ? formatWhen(record.logoutAt) : 'Still in office'}</strong>
                <p>{logoutAddress || (record.logoutAt ? 'Address not captured' : 'Logout has not been marked')}</p>
              </div>
            </article>
          </div>

          <div className="follow-totals">
            <Metric label="Hour slots" value={totals.slots} />
            <Metric label="Follow-ups" value={totals.followups} />
            <Metric label="Prospects" value={totals.prospects} />
            <Metric label="Pipeline" value={totals.pipeline} />
          </div>

          {slots.length === 0 ? (
            <p className="follow-empty">No hourly follow-up has been submitted for this day.</p>
          ) : (
            <ol className="follow-timeline">
              {slots.map((slot) => (
                <li key={slot._id || slot.slotKey} className="follow-slot">
                  <div className="follow-slot__top">
                    <div>
                      <p className="follow-slot__time">{formatClockRange(slot.windowStart, slot.windowEnd)}</p>
                      <p className="follow-slot__submitted">Submitted {formatWhen(slot.submittedAt)}</p>
                    </div>
                    {slot.afterOffice && <span className="follow-slot__flag">After office</span>}
                  </div>
                  <div className="follow-slot__metrics">
                    <Metric label="Follow-ups" value={Number(slot.followups) || 0} />
                    <Metric label="Prospects" value={Number(slot.prospects) || 0} />
                    <Metric label="Pipeline" value={Number(slot.pipeline) || 0} />
                  </div>
                  {slot.details?.trim() && <p className="follow-slot__details">{slot.details.trim()}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
