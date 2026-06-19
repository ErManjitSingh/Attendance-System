import { useState } from 'react';
import './AttendancePhoto.css';

export default function AttendancePhoto({ src, alt = 'Attendance photo' }) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return <span className="attendance-photo__none">—</span>;
  }

  return (
    <>
      <button type="button" className="attendance-photo__thumb" onClick={() => setOpen(true)} aria-label="View photo">
        <img src={src} alt={alt} loading="lazy" />
      </button>
      {open && (
        <div className="photo-modal" onClick={() => setOpen(false)} role="presentation">
          <div className="photo-modal__content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="photo-modal__close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
            <img src={src} alt={alt} className="photo-modal__img" />
          </div>
        </div>
      )}
    </>
  );
}
