import { useState } from 'react';
import { logout } from '../config/auth';
import { PTW_LOGO, COMPANIES } from '../config/branding';
import './Layout.css';

const NAV_ITEMS = [{ id: 'attendance', label: 'Attendance', icon: 'calendar' }];
const ptw = COMPANIES.ptw;

function NavIcon({ name }) {
  if (name === 'calendar') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  return null;
}

function Sidebar({ activeTab, onTabChange, isOpen, onClose, onLogout }) {
  return (
    <>
      {isOpen && <button type="button" className="sidebar-overlay" onClick={onClose} aria-label="Close menu" />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src={PTW_LOGO} alt={ptw.label} className="sidebar__brand-logo" />
          <div className="sidebar__brand-text">
            <p className="sidebar__title">{ptw.label}</p>
            <p className="sidebar__subtitle">{ptw.tagline}</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__link ${activeTab === item.id ? 'sidebar__link--active' : ''}`}
              onClick={() => {
                onTabChange(item.id);
                onClose?.();
              }}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p>Attendance Management</p>
          <span>© PTW Holidays</span>
          <button type="button" className="sidebar__logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export function Layout({ children, activeTab, onTabChange, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  return (
    <div className="layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="layout__main">
        <header className="layout__header">
          <button
            type="button"
            className="layout__menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="layout__header-content">
            <div>
              <p className="layout__breadcrumb">Dashboard</p>
              <h1 className="layout__page-title">Attendance</h1>
            </div>
            <div className="layout__header-meta">
              <span className="layout__date">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
}
