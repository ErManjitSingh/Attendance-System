import { useState } from 'react';
import AttendancePhoto from './AttendancePhoto';
import StatusBadge from './StatusBadge';
import './EditAttendanceModal.css';

const STATUSES = ['present', 'absent', 'half-day', 'late'];

export default function EditAttendanceModal({ record, onClose, onSave }) {
  const [status, setStatus] = useState(record?.status || 'present');
  const [note, setNote] = useState(record?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(record._id, { status, note: note.trim() || null });
      onClose();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="edit-title">
        <div className="modal__header">
          <h3 id="edit-title">Update Attendance</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal__body">
          <p className="modal__meta">
            <strong>{record.userName}</strong> · {record.date}
          </p>
          <p className="modal__current">
            Current: <StatusBadge status={record.status} />
          </p>
          {record.image && (
            <div className="modal__photo">
              <p className="modal__photo-label">Live Photo</p>
              <AttendancePhoto src={record.image} alt={`${record.userName} attendance`} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="modal__form">
            <div className="field">
              <label htmlFor="edit-status">Status</label>
              <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-note">Note</label>
              <input
                id="edit-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
              />
            </div>
            {error && <p className="modal__error">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
