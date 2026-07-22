import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAttendanceByMonth,
  getAttendanceByTeamLeader,
  getAttendanceByManager,
  getAttendanceByUserMonth,
  getTodayAttendance,
  markAttendance,
  updateAttendance,
} from '../api/attendance';
import { fetchMakers, filterAttendanceRoles, getMakerName, normalizeDesignation } from '../api/makers';
import AttendancePhoto from '../components/AttendancePhoto';
import EditAttendanceModal from '../components/EditAttendanceModal';
import StatusBadge, { SummaryCards, computeSummary } from '../components/StatusBadge';
import { COMPANIES } from '../config/branding';
import { filterByCompany, filterRecordsByCompany } from '../utils/company';
import {
  formatDisplayDate,
  formatMonthLabel,
  getMonthCalendarDays,
  toDateString,
  toMonthString,
} from '../utils/date';
import './AttendancePage.css';

const VIEW_MODES = [
  { id: 'today', label: 'Today' },
  { id: 'date', label: 'By Date' },
  { id: 'month', label: 'By Month' },
  { id: 'user', label: 'By User' },
];

const SCOPES = [
  { id: 'all', label: 'All Users' },
  { id: 'team-leader', label: 'Team Leader' },
  { id: 'manager', label: 'Manager' },
];

const STATUSES = ['present', 'absent', 'half-day', 'late'];

const SORT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'name', label: 'Sort by Name (A–Z)' },
  { id: 'come-first', label: 'Come First (Earliest First)' },
  { id: 'come-late', label: 'Come Late (Latest First)' },
];

const COMPANY_OPTIONS = [
  { id: 'ptw', label: COMPANIES.ptw.label },
  { id: 'demand', label: COMPANIES.demand.label },
];

function pickFirstId(list) {
  return list[0]?._id || '';
}

function getMarkedAtTime(record) {
  if (!record?.markedAt) return Number.POSITIVE_INFINITY;
  return new Date(record.markedAt).getTime();
}

function sortRecords(list, sortBy) {
  const sorted = [...list];
  if (sortBy === 'name') {
    sorted.sort((a, b) =>
      String(a.userName || '').localeCompare(String(b.userName || ''), 'en', { sensitivity: 'base' }),
    );
  } else if (sortBy === 'come-first') {
    sorted.sort((a, b) => getMarkedAtTime(a) - getMarkedAtTime(b));
  } else if (sortBy === 'come-late') {
    sorted.sort((a, b) => getMarkedAtTime(b) - getMarkedAtTime(a));
  }
  return sorted;
}

export default function AttendancePage() {
  const [companyKey, setCompanyKey] = useState('ptw');
  const [allMakers, setAllMakers] = useState([]);
  const [loadingMakers, setLoadingMakers] = useState(true);
  const [viewMode, setViewMode] = useState('today');
  const [scope, setScope] = useState('all');
  const [selectedDate, setSelectedDate] = useState(toDateString());
  const [selectedMonth, setSelectedMonth] = useState(toMonthString());
  const [selectedUserId, setSelectedUserId] = useState('');
  const [scopeLeaderId, setScopeLeaderId] = useState('');
  const [scopeManagerId, setScopeManagerId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [notMarkedUserId, setNotMarkedUserId] = useState('');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(computeSummary());
  const [byDate, setByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [markUserId, setMarkUserId] = useState('');
  const [markDate, setMarkDate] = useState(toDateString());
  const [markStatus, setMarkStatus] = useState('present');
  const [markNote, setMarkNote] = useState('');
  const [marking, setMarking] = useState(false);
  const [markMessage, setMarkMessage] = useState('');

  const company = COMPANIES[companyKey] || COMPANIES.ptw;

  const makers = useMemo(
    () => filterByCompany(filterAttendanceRoles(allMakers), companyKey),
    [allMakers, companyKey],
  );

  const teamLeaders = useMemo(
    () => makers.filter((m) => normalizeDesignation(m.designation) === 'team leader'),
    [makers],
  );
  const managers = useMemo(
    () => makers.filter((m) => normalizeDesignation(m.designation) === 'manager'),
    [makers],
  );

  useEffect(() => {
    fetchMakers()
      .then((data) => setAllMakers(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMakers(false));
  }, []);

  useEffect(() => {
    if (!makers.length) {
      setSelectedUserId('');
      setNotMarkedUserId('');
      return;
    }
    setSelectedUserId((prev) => (makers.some((m) => m._id === prev) ? prev : pickFirstId(makers)));
    setMarkUserId((prev) => (makers.some((m) => m._id === prev) ? prev : pickFirstId(makers)));
    setScopeLeaderId((prev) => (teamLeaders.some((m) => m._id === prev) ? prev : pickFirstId(teamLeaders)));
    setScopeManagerId((prev) => (managers.some((m) => m._id === prev) ? prev : pickFirstId(managers)));
    setNotMarkedUserId('');
  }, [companyKey, makers, teamLeaders, managers]);

  const applyCompanyFilter = useCallback(
    (list) => filterRecordsByCompany(list, makers),
    [makers],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setByDate({});
    try {
      if (viewMode === 'user' && selectedUserId) {
        const res = await getAttendanceByUserMonth(selectedUserId, selectedMonth);
        const list = res.data || [];
        setRecords(list);
        setSummary(computeSummary(list));
        setByDate(res.byDate || {});
        return;
      }

      if (viewMode === 'today') {
        const month = selectedDate.slice(0, 7);
        let res;
        if (scope === 'team-leader' && scopeLeaderId) {
          res = await getAttendanceByTeamLeader(scopeLeaderId, month);
        } else if (scope === 'manager' && scopeManagerId) {
          res = await getAttendanceByManager(scopeManagerId, month);
        } else {
          res = await getAttendanceByMonth(month);
        }
        let list = applyCompanyFilter(res.data || []);
        list = list.filter((r) => r.date === selectedDate);
        if (statusFilter) list = list.filter((r) => r.status === statusFilter);
        setRecords(list);
        setSummary(computeSummary(list));
        return;
      }

      if (viewMode === 'date') {
        const month = selectedDate.slice(0, 7);
        let res;
        if (scope === 'team-leader' && scopeLeaderId) {
          res = await getAttendanceByTeamLeader(scopeLeaderId, month);
        } else if (scope === 'manager' && scopeManagerId) {
          res = await getAttendanceByManager(scopeManagerId, month);
        } else {
          res = await getAttendanceByMonth(month);
        }
        let list = applyCompanyFilter(res.data || []);
        list = list.filter((r) => r.date === selectedDate);
        if (statusFilter) list = list.filter((r) => r.status === statusFilter);
        setRecords(list);
        setSummary(computeSummary(list));
        return;
      }

      if (viewMode === 'month') {
        let res;
        if (scope === 'team-leader' && scopeLeaderId) {
          res = await getAttendanceByTeamLeader(scopeLeaderId, selectedMonth);
        } else if (scope === 'manager' && scopeManagerId) {
          res = await getAttendanceByManager(scopeManagerId, selectedMonth);
        } else {
          res = await getAttendanceByMonth(selectedMonth, {
            status: statusFilter || undefined,
          });
        }
        let list = applyCompanyFilter(res.data || []);
        if (statusFilter) list = list.filter((r) => r.status === statusFilter);
        setRecords(list);
        setSummary(computeSummary(list));
      }
    } catch (e) {
      setError(e.message);
      setRecords([]);
      setSummary(computeSummary());
    } finally {
      setLoading(false);
    }
  }, [
    viewMode,
    scope,
    selectedDate,
    selectedMonth,
    selectedUserId,
    scopeLeaderId,
    scopeManagerId,
    statusFilter,
    applyCompanyFilter,
  ]);

  useEffect(() => {
    if (!loadingMakers && makers.length) loadData();
    else if (!loadingMakers && !makers.length) {
      setRecords([]);
      setSummary(computeSummary());
    }
  }, [loadData, loadingMakers, makers.length]);

  const handleUpdate = async (id, payload) => {
    await updateAttendance(id, payload);
    await loadData();
  };

  const handleMark = async () => {
    if (!markUserId) return;
    setMarking(true);
    setMarkMessage('');
    try {
      const existing = await getTodayAttendance(markUserId, markDate);
      if (existing?.marked) {
        setMarkMessage('Attendance already marked for this user on the selected date.');
        return;
      }
      const res = await markAttendance({
        userId: markUserId,
        date: markDate,
        status: markStatus,
        note: markNote || undefined,
      });
      setMarkMessage(res.message || 'Attendance marked successfully');
      setMarkNote('');
      await loadData();
    } catch (e) {
      if (e.status === 409) {
        setMarkMessage(e.data?.message || 'Attendance already marked for this date');
      } else {
        setMarkMessage(e.message);
      }
    } finally {
      setMarking(false);
    }
  };

  const calendarDays = viewMode === 'user' ? getMonthCalendarDays(selectedMonth) : [];
  const selectedMaker = makers.find((m) => m._id === selectedUserId);

  const referenceDate = viewMode === 'today' || viewMode === 'date' ? selectedDate : null;

  const notMarkedEmployees = useMemo(() => {
    if (viewMode === 'user') return [];

    if (viewMode === 'today' || viewMode === 'date') {
      const markedIds = new Set(records.map((r) => String(r.userId)));
      return makers
        .filter((m) => !markedIds.has(String(m._id)))
        .sort((a, b) => getMakerName(a).localeCompare(getMakerName(b), 'en', { sensitivity: 'base' }));
    }

    if (viewMode === 'month') {
      const markedIds = new Set(records.map((r) => String(r.userId)));
      return makers
        .filter((m) => !markedIds.has(String(m._id)))
        .sort((a, b) => getMakerName(a).localeCompare(getMakerName(b), 'en', { sensitivity: 'base' }));
    }

    return [];
  }, [viewMode, records, makers]);

  const displayedRecords = useMemo(() => sortRecords(records, sortBy), [records, sortBy]);

  const handleNotMarkedSelect = (userId) => {
    setNotMarkedUserId(userId);
    if (!userId) return;
    setMarkUserId(userId);
    if (referenceDate) setMarkDate(referenceDate);
    setMarkMessage(`Selected ${getMakerName(makers.find((m) => m._id === userId))} — use Mark Attendance above.`);
  };

  return (
    <div className="attendance-page">
      <section className="card mark-card">
        <div className="card__header">
          <div className="card__icon card__icon--mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div>
            <h2 className="card__title">Mark Attendance for User</h2>
            <p className="card__desc">{company.label} — mark attendance on behalf of an employee</p>
          </div>
        </div>
        <div className="mark-form">
          <div className="field">
            <label htmlFor="mark-company">Company</label>
            <select id="mark-company" value={companyKey} onChange={(e) => setCompanyKey(e.target.value)}>
              {COMPANY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mark-user">Employee</label>
            <select
              id="mark-user"
              value={markUserId}
              onChange={(e) => setMarkUserId(e.target.value)}
              disabled={!makers.length}
            >
              {makers.map((m) => (
                <option key={m._id} value={m._id}>
                  {getMakerName(m)} · {m.designation}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mark-date">Date</label>
            <input id="mark-date" type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mark-status">Status</label>
            <select id="mark-status" value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field field--grow">
            <label htmlFor="mark-note">Note (optional)</label>
            <input
              id="mark-note"
              type="text"
              value={markNote}
              onChange={(e) => setMarkNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={handleMark} disabled={marking || !makers.length}>
            {marking ? 'Marking...' : 'Mark Attendance'}
          </button>
        </div>
        {markMessage && (
          <p className={`mark-message ${markMessage.toLowerCase().includes('success') ? 'mark-message--ok' : ''}`}>
            {markMessage}
          </p>
        )}
      </section>

      <section className="card">
        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">View</span>
            <div className="pill-group">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`pill ${viewMode === v.id ? 'pill--active' : ''}`}
                  onClick={() => {
                    setViewMode(v.id);
                    setNotMarkedUserId('');
                    if (v.id === 'today') setSelectedDate(toDateString());
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {viewMode !== 'user' && (
            <div className="filter-group">
              <span className="filter-label">Scope</span>
              <div className="pill-group">
                {SCOPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`pill ${scope === s.id ? 'pill--active' : ''}`}
                    onClick={() => setScope(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filters__row">
            <div className="field">
              <label htmlFor="company-select">Company</label>
              <select id="company-select" value={companyKey} onChange={(e) => setCompanyKey(e.target.value)}>
                {COMPANY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {viewMode === 'user' && (
              <div className="field">
                <label htmlFor="user-select">User</label>
                <select id="user-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} disabled={!makers.length}>
                  {makers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {getMakerName(m)} — {m.designation}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(viewMode === 'today' || viewMode === 'date') && (
              <div className="field">
                <label htmlFor="date-select">Date</label>
                <input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            {(viewMode === 'month' || viewMode === 'user') && (
              <div className="field">
                <label htmlFor="month-select">Month</label>
                <input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {scope === 'team-leader' && viewMode !== 'user' && (
              <div className="field">
                <label htmlFor="tl-select">Team Leader</label>
                <select id="tl-select" value={scopeLeaderId} onChange={(e) => setScopeLeaderId(e.target.value)}>
                  {teamLeaders.map((m) => (
                    <option key={m._id} value={m._id}>
                      {getMakerName(m)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'manager' && viewMode !== 'user' && (
              <div className="field">
                <label htmlFor="mgr-select">Manager</label>
                <select id="mgr-select" value={scopeManagerId} onChange={(e) => setScopeManagerId(e.target.value)}>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {getMakerName(m)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode !== 'user' && (
              <div className="field">
                <label htmlFor="status-filter">Status</label>
                <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field">
              <label htmlFor="sort-filter">Sort By</label>
              <select id="sort-filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {viewMode !== 'user' && (
              <div className="field field--grow">
                <label htmlFor="not-marked-filter">
                  Not Marked Employees ({notMarkedEmployees.length})
                </label>
                <select
                  id="not-marked-filter"
                  value={notMarkedUserId}
                  onChange={(e) => handleNotMarkedSelect(e.target.value)}
                  disabled={!notMarkedEmployees.length}
                >
                  <option value="">
                    {notMarkedEmployees.length
                      ? 'Select employee who did not mark'
                      : 'Everyone has marked'}
                  </option>
                  {notMarkedEmployees.map((m) => (
                    <option key={m._id} value={m._id}>
                      {getMakerName(m)} — {m.designation}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" className="btn btn--secondary" onClick={loadData} disabled={loading || !makers.length}>
              Refresh
            </button>
          </div>
        </div>

        <div className="results-header">
          <h2 className="card__title card__title--results">
            {viewMode === 'today' && `Today — ${formatDisplayDate(selectedDate)}`}
            {viewMode === 'date' && `Date — ${formatDisplayDate(selectedDate)}`}
            {viewMode === 'month' && `Month — ${formatMonthLabel(selectedMonth)}`}
            {viewMode === 'user' && `${getMakerName(selectedMaker)} — ${formatMonthLabel(selectedMonth)}`}
          </h2>
          <span className="results-badge">{company.shortLabel}</span>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {!makers.length && !loadingMakers && (
          <div className="alert alert--info">No employees found for {company.label}.</div>
        )}
        {viewMode !== 'user' && notMarkedEmployees.length > 0 && (
          <div className="alert alert--info">
            {notMarkedEmployees.length} employee{notMarkedEmployees.length === 1 ? '' : 's'} have not marked attendance
            {(viewMode === 'today' || viewMode === 'date') && ` for ${formatDisplayDate(selectedDate)}`}
            {viewMode === 'month' && ` in ${formatMonthLabel(selectedMonth)}`}.
            Use the <strong>Not Marked Employees</strong> dropdown to select and mark them.
          </div>
        )}
        {loading ? (
          <div className="loading">
            <div className="loading__spinner" />
            <span>Loading attendance...</span>
          </div>
        ) : (
          <>
            <SummaryCards summary={summary} />

            {viewMode === 'user' && (
              <div className="calendar">
                <div className="calendar__weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="calendar__grid">
                  {calendarDays.map((dateStr, i) => (
                    <div key={i} className={`calendar__cell ${dateStr ? '' : 'calendar__cell--empty'}`}>
                      {dateStr && (
                        <>
                          <span className="calendar__day">{parseInt(dateStr.slice(8), 10)}</span>
                          {byDate[dateStr] ? (
                            <StatusBadge status={byDate[dateStr].status} />
                          ) : (
                            <span className="calendar__none">—</span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Team Leader</th>
                    <th>Manager</th>
                    <th>Marked At</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="data-table__empty">
                        No attendance records for {company.shortLabel}.
                      </td>
                    </tr>
                  ) : (
                    displayedRecords.map((row) => (
                      <tr key={row._id}>
                        <td data-label="Photo">
                          <AttendancePhoto src={row.image} alt={`${row.userName || 'Employee'} photo`} />
                        </td>
                        <td data-label="Date">{formatDisplayDate(row.date)}</td>
                        <td data-label="Employee">{row.userName || '—'}</td>
                        <td data-label="Designation">{row.designation || '—'}</td>
                        <td data-label="Status">
                          <StatusBadge status={row.status} />
                        </td>
                        <td data-label="Team Leader">{row.teamLeaderName || '—'}</td>
                        <td data-label="Manager">{row.managerName || '—'}</td>
                        <td data-label="Marked At">
                          {row.markedAt ? new Date(row.markedAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td data-label="Note">{row.note || '—'}</td>
                        <td data-label="Actions">
                          <button
                            type="button"
                            className="btn btn--edit"
                            onClick={() => setEditingRecord(row)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {editingRecord && (
        <EditAttendanceModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
