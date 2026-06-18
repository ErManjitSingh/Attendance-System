import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAttendanceByMonth,
  getAttendanceByTeamLeader,
  getAttendanceByManager,
  getAttendanceByUserMonth,
  updateAttendance,
} from '../api/attendance';
import { fetchMakers, filterAttendanceRoles, getMakerName, normalizeDesignation } from '../api/makers';
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

];

const STATUSES = ['present', 'absent', 'half-day', 'late'];

const COMPANY_OPTIONS = [
  { id: 'ptw', label: COMPANIES.ptw.label },
  { id: 'demand', label: COMPANIES.demand.label },
];

function pickFirstId(list) {
  return list[0]?._id || '';
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
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(computeSummary());
  const [byDate, setByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

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
      return;
    }
    setSelectedUserId((prev) => (makers.some((m) => m._id === prev) ? prev : pickFirstId(makers)));
    setScopeLeaderId((prev) => (teamLeaders.some((m) => m._id === prev) ? prev : pickFirstId(teamLeaders)));
    setScopeManagerId((prev) => (managers.some((m) => m._id === prev) ? prev : pickFirstId(managers)));
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

  const calendarDays = viewMode === 'user' ? getMonthCalendarDays(selectedMonth) : [];
  const selectedMaker = makers.find((m) => m._id === selectedUserId);

  return (
    <div className="attendance-page">
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
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="data-table__empty">
                        No attendance records for {company.shortLabel}.
                      </td>
                    </tr>
                  ) : (
                    records.map((row) => (
                      <tr key={row._id}>
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
