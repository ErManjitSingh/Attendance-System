import { useEffect, useMemo, useState } from 'react';
import {
  emptySalaryEntry,
  fetchMakers,
  getMakerName,
  isUserActiveFlag,
  normalizeDesignation,
  normalizeSalaryHistory,
  updateMaker,
} from '../api/makers';
import { COMPANIES } from '../config/branding';
import { filterByCompany } from '../utils/company';
import './UsersPage.css';

const USER_TYPE_OPTIONS = ['For B2B Sale', 'For Internal sale', 'For Website package', 'Manager'];
const COMPANY_TABS = [
  { id: 'ptw', label: COMPANIES.ptw.label },
  { id: 'demand', label: COMPANIES.demand.label },
];
const COMPANY_SELECT_OPTIONS = [
  { value: 'PTW', label: COMPANIES.ptw.label },
  { value: 'Demand Setu', label: COMPANIES.demand.label },
];
const DESIGNATION_OPTIONS = ['executive', 'manager', 'team leader'];

function formatDate(value) {
  if (!value) return 'Not available';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Not available' : d.toLocaleDateString('en-IN');
}

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function Avatar({ user, size = 'sm' }) {
  const name = getMakerName(user);
  if (user?.profileImage) {
    return (
      <div className={`users-avatar users-avatar--${size}`}>
        <img src={user.profileImage} alt={name} />
      </div>
    );
  }
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div className={`users-avatar users-avatar--${size} users-avatar--fallback`} aria-hidden="true">
      {initials || '?'}
    </div>
  );
}

function StatusPill({ status }) {
  const blocked = status === 'Blocked';
  return (
    <span className={`users-pill ${blocked ? 'users-pill--danger' : 'users-pill--success'}`}>
      {status || 'Active'}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [companyKey, setCompanyKey] = useState('ptw');
  const [userTypeFilter, setUserTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const companyUsers = useMemo(() => filterByCompany(users, companyKey), [users, companyKey]);

  const userTypes = useMemo(
    () => ['All', ...new Set(companyUsers.map((user) => user.userType || 'User'))],
    [companyUsers],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchMakers();
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to fetch users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companyUsers.filter((user) => {
      const matchesType =
        userTypeFilter === 'All' || (user.userType || 'User') === userTypeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      const fullName = getMakerName(user).toLowerCase();
      const mobile = String(user.contactNo || '').toLowerCase();
      return fullName.includes(q) || mobile.includes(q);
    });
  }, [companyUsers, userTypeFilter, searchQuery]);

  const flash = (text, isError = false) => {
    if (isError) {
      setError(text);
      setMessage('');
    } else {
      setMessage(text);
      setError('');
    }
  };

  const clearFilters = () => {
    setUserTypeFilter('All');
    setSearchQuery('');
  };

  const getManagersByCompany = (companyName) => {
    if (!companyName || !users.length) return [];
    return users.filter(
      (u) =>
        u.companyName === companyName &&
        normalizeDesignation(u.designation) === 'manager' &&
        u.status !== 'Blocked' &&
        isUserActiveFlag(u),
    );
  };

  const getTeamLeadersByCompany = (companyName) => {
    if (!companyName || !users.length) return [];
    return users.filter(
      (u) =>
        u.companyName === companyName &&
        normalizeDesignation(u.designation) === 'team leader' &&
        u.status !== 'Blocked' &&
        isUserActiveFlag(u),
    );
  };

  const buildEditForm = (user) => ({
    ...user,
    salaryHistory: normalizeSalaryHistory(user?.salaryHistory),
  });

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setEditFormData(buildEditForm(user));
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    const form = buildEditForm(selectedUser);
    if (!form.salaryHistory?.length) {
      form.salaryHistory = [emptySalaryEntry()];
    }
    setEditFormData(form);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(buildEditForm(selectedUser));
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'companyName' || field === 'designation') {
        updated.teamLeaderName = '';
        updated.teamLeaderId = '';
        updated.managerName = '';
        updated.managerId = '';
      }
      return updated;
    });
  };

  const handleTeamLeaderChange = (selectedName) => {
    const selectedTeamLeader = getTeamLeadersByCompany(editFormData.companyName).find(
      (leader) => getMakerName(leader) === selectedName,
    );
    setEditFormData((prev) => ({
      ...prev,
      teamLeaderName: selectedName,
      teamLeaderId: selectedTeamLeader?._id || '',
    }));
  };

  const handleManagerChange = (selectedName) => {
    const selectedManager = getManagersByCompany(editFormData.companyName).find(
      (manager) => getMakerName(manager) === selectedName,
    );
    setEditFormData((prev) => ({
      ...prev,
      managerName: selectedName,
      managerId: selectedManager?._id || '',
    }));
  };

  const handleSalaryChange = (index, field, value) => {
    setEditFormData((prev) => {
      const next = [...(prev.salaryHistory || [])];
      const numeric = field === 'month' ? value : Number(value) || 0;
      next[index] = { ...next[index], [field]: field === 'month' ? value : numeric };
      return { ...prev, salaryHistory: next };
    });
  };

  const handleAddSalaryEntry = () => {
    setEditFormData((prev) => ({
      ...prev,
      salaryHistory: [...(prev.salaryHistory || []), emptySalaryEntry()],
    }));
  };

  const handleRemoveSalaryEntry = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      salaryHistory: (prev.salaryHistory || []).filter((_, i) => i !== index),
    }));
  };

  const mergeUpdatedUser = (previous, updated, fallback = {}) => ({
    ...previous,
    ...updated,
    ...fallback,
  });

  const handleUpdateUser = async () => {
    try {
      setIsUpdating(true);
      const payload = {
        ...editFormData,
        salaryHistory: normalizeSalaryHistory(editFormData.salaryHistory).filter((e) => e.month),
      };
      const updatedUser = await updateMaker(selectedUser._id, payload);
      const merged = mergeUpdatedUser(selectedUser, updatedUser, {
        salaryHistory: payload.salaryHistory,
      });
      setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? merged : u)));
      setSelectedUser(merged);
      setEditFormData(buildEditForm(merged));
      setIsEditing(false);
      flash('User updated successfully');
    } catch (err) {
      flash(err.message || 'Failed to update user', true);
    } finally {
      setIsUpdating(false);
    }
  };

  const validatePassword = () => {
    if (!newPassword) {
      flash('New password is required', true);
      return false;
    }
    if (newPassword.length < 6) {
      flash('Password must be at least 6 characters long', true);
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    try {
      setChangingPassword(true);
      await updateMaker(selectedUser._id, { ...selectedUser, password: newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      flash('Password changed successfully');
    } catch (err) {
      flash(err.message || 'Failed to change password', true);
    } finally {
      setChangingPassword(false);
    }
  };

  const closeProfileModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="card">
          <p className="users-page__state">Loading members...</p>
        </div>
      </div>
    );
  }

  const designationValue = isEditing ? editFormData.designation : selectedUser?.designation;
  const showTeamLeader = normalizeDesignation(designationValue) === 'executive';
  const showManager = ['executive', 'team leader'].includes(normalizeDesignation(designationValue));

  return (
    <div className="users-page">
      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--ok">{message}</div>}

      <section className="card">
        <div className="card__header">
          <div
            className="card__icon"
            style={{ background: 'var(--sky)', color: 'var(--navy)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="card__title">Members</h2>
            <p className="card__desc">View, edit profiles, and salary history</p>
          </div>
        </div>

        <div className="users-toolbar">
          <div className="filter-group">
            <span className="filter-label">Company</span>
            <div className="pill-group">
              {COMPANY_TABS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`pill ${companyKey === c.id ? 'pill--active' : ''}`}
                  onClick={() => {
                    setCompanyKey(c.id);
                    setUserTypeFilter('All');
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="users-filters">
            <div className="field users-search-field">
              <label htmlFor="filter-search">Search</label>
              <div className="users-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="filter-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or mobile..."
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="filter-type">User type</label>
              <select
                id="filter-type"
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                {userTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Users' : type}
                  </option>
                ))}
              </select>
            </div>
            {(userTypeFilter !== 'All' || searchQuery) && (
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                Clear filters
              </button>
            )}
            <p className="users-filters__count">
              Showing {filteredUsers.length} of {companyUsers.length} · {COMPANIES[companyKey]?.shortLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Mobile cards */}
      <div className="users-mobile-list">
        {filteredUsers.map((user) => (
          <article key={user._id} className="users-mobile-card card">
            <div className="users-mobile-card__top">
              <Avatar user={user} />
              <div className="users-mobile-card__info">
                <p className="users-mobile-card__name">{getMakerName(user)}</p>
                <p className="users-mobile-card__meta">{user.email || '—'}</p>
                <p className="users-mobile-card__meta">{user.contactNo || '—'}</p>
                <div className="users-pill-row">
                  <span className="users-pill users-pill--navy">{user.userType || 'User'}</span>
                  <StatusPill status={user.status} />
                </div>
              </div>
            </div>
            <div className="users-mobile-card__actions">
              <button type="button" className="btn--edit" onClick={() => handleViewProfile(user)}>
                View
              </button>
            </div>
          </article>
        ))}
        {filteredUsers.length === 0 && (
          <div className="card users-empty">
            <p>No users found for the selected filter</p>
            <button type="button" className="btn btn--secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <section className="card users-table-card">
        <div className="table-wrap">
          <table className="data-table users-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Member</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Company</th>
                <th>User type</th>
                <th>Status</th>
                <th>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td data-label="Photo">
                    <Avatar user={user} />
                  </td>
                  <td data-label="Member">
                    <strong>{getMakerName(user)}</strong>
                  </td>
                  <td data-label="Mobile">{user.contactNo || '—'}</td>
                  <td data-label="Email">{user.email || '—'}</td>
                  <td data-label="Company">{user.companyName || '—'}</td>
                  <td data-label="User type">
                    <span className="users-pill users-pill--navy">{user.userType || 'User'}</span>
                  </td>
                  <td data-label="Status">
                    <StatusPill status={user.status} />
                  </td>
                  <td data-label="Operations">
                    <div className="users-ops">
                      <button type="button" className="btn--edit" onClick={() => handleViewProfile(user)}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="users-empty">
            <p>No users found for the selected filter</p>
            <button type="button" className="btn btn--secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Profile modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay modal-overlay--fullscreen" onClick={closeProfileModal} role="presentation">
          <div
            className="modal users-profile-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="profile-title"
          >
            <div className="modal__header users-profile-modal__header">
              <h3 id="profile-title">User Profile Details</h3>
              <div className="users-profile-modal__actions">
                {!isEditing ? (
                  <>
                    <button type="button" className="btn btn--primary" onClick={handleEditClick}>
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowPasswordModal(true);
                        setNewPassword('');
                        setShowPassword(false);
                      }}
                    >
                      Change Password
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={isUpdating}
                      onClick={handleUpdateUser}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={isUpdating}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button type="button" className="modal__close" onClick={closeProfileModal} aria-label="Close">
                  ×
                </button>
              </div>
            </div>

            <div className="modal__body users-profile-modal__body">
              <div className="users-profile-hero">
                <Avatar user={selectedUser} size="lg" />
                <div>
                  <h4>{getMakerName(selectedUser)}</h4>
                  <p>{selectedUser.email}</p>
                  <div className="users-pill-row">
                    <span className="users-pill users-pill--navy">{selectedUser.userType || 'User'}</span>
                    <StatusPill status={selectedUser.status} />
                  </div>
                </div>
              </div>

              <div className="users-profile-grid">
                <section>
                  <h5 className="users-section-title">Personal Information</h5>
                  <div className="users-fields">
                    {[
                      { key: 'firstName', label: 'First Name', type: 'text' },
                      { key: 'lastName', label: 'Last Name', type: 'text' },
                      { key: 'email', label: 'Email', type: 'email' },
                      { key: 'contactNo', label: 'Contact Number', type: 'tel' },
                    ].map((field) => (
                      <div key={field.key} className="field">
                        <label htmlFor={`edit-${field.key}`}>{field.label}</label>
                        {isEditing ? (
                          <input
                            id={`edit-${field.key}`}
                            type={field.type}
                            value={editFormData[field.key] || ''}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                          />
                        ) : (
                          <p className="users-readonly">{selectedUser[field.key] || '—'}</p>
                        )}
                      </div>
                    ))}

                    <div className="field">
                      <label htmlFor="edit-gender">Gender</label>
                      {isEditing ? (
                        <select
                          id="edit-gender"
                          value={editFormData.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="users-readonly">{selectedUser.gender || 'Not specified'}</p>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="edit-dob">Date of Birth</label>
                      {isEditing ? (
                        <input
                          id="edit-dob"
                          type="date"
                          value={toDateInputValue(editFormData.dateOfBirth)}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        />
                      ) : (
                        <p className="users-readonly">{formatDate(selectedUser.dateOfBirth)}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h5 className="users-section-title">Professional Information</h5>
                  <div className="users-fields">
                    <div className="field">
                      <label htmlFor="edit-userType">User Type</label>
                      {isEditing ? (
                        <select
                          id="edit-userType"
                          value={editFormData.userType || ''}
                          onChange={(e) => handleInputChange('userType', e.target.value)}
                        >
                          <option value="">Select User Type</option>
                          {USER_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="users-readonly">{selectedUser.userType || 'User'}</p>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="edit-company">Company Name</label>
                      {isEditing ? (
                        <select
                          id="edit-company"
                          value={editFormData.companyName || ''}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                        >
                          <option value="">Select Company</option>
                          {COMPANY_SELECT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="users-readonly">{selectedUser.companyName || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="edit-designation">Designation</label>
                      {isEditing ? (
                        <select
                          id="edit-designation"
                          value={editFormData.designation || ''}
                          onChange={(e) => handleInputChange('designation', e.target.value)}
                        >
                          <option value="">Select Designation</option>
                          {DESIGNATION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="users-readonly">{selectedUser.designation || 'Not provided'}</p>
                      )}
                    </div>

                    {showTeamLeader && (
                      <div className="field">
                        <label htmlFor="edit-team-leader">Team Leader Name</label>
                        {isEditing ? (
                          <select
                            id="edit-team-leader"
                            value={editFormData.teamLeaderName || ''}
                            onChange={(e) => handleTeamLeaderChange(e.target.value)}
                            disabled={!editFormData.companyName}
                          >
                            <option value="">Select Team Leader</option>
                            {getTeamLeadersByCompany(editFormData.companyName).map((leader) => (
                              <option key={leader._id} value={getMakerName(leader)}>
                                {getMakerName(leader)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="users-readonly">{selectedUser.teamLeaderName || 'Not provided'}</p>
                        )}
                      </div>
                    )}

                    {showManager && (
                      <div className="field">
                        <label htmlFor="edit-manager">Manager Name</label>
                        {isEditing ? (
                          <select
                            id="edit-manager"
                            value={editFormData.managerName || ''}
                            onChange={(e) => handleManagerChange(e.target.value)}
                            disabled={!editFormData.companyName}
                          >
                            <option value="">Select Manager</option>
                            {getManagersByCompany(editFormData.companyName).map((manager) => (
                              <option key={manager._id} value={getMakerName(manager)}>
                                {getMakerName(manager)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="users-readonly">{selectedUser.managerName || 'Not provided'}</p>
                        )}
                      </div>
                    )}

                    <div className="field">
                      <label htmlFor="edit-address">Address</label>
                      {isEditing ? (
                        <textarea
                          id="edit-address"
                          rows={3}
                          value={editFormData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      ) : (
                        <p className="users-readonly">{selectedUser.address || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* Salary History */}
              <section className="users-salary">
                <div className="users-salary__header">
                  <div>
                    <h5 className="users-section-title">Salary History</h5>
                    <p className="users-salary__hint">Monthly basic, overtime, and EPF entries</p>
                  </div>
                  {isEditing && (
                    <button type="button" className="btn btn--primary" onClick={handleAddSalaryEntry}>
                      + Add salary entry
                    </button>
                  )}
                </div>

                {(isEditing ? editFormData.salaryHistory : normalizeSalaryHistory(selectedUser.salaryHistory))
                  ?.length ? (
                  <div className="users-salary__list">
                    {(isEditing
                      ? editFormData.salaryHistory
                      : normalizeSalaryHistory(selectedUser.salaryHistory)
                    ).map((entry, index) => (
                      <div key={`${entry.month || 'row'}-${index}`} className="users-salary__card">
                        <div className="users-salary__card-top">
                          <span className="users-salary__index">Entry {index + 1}</span>
                          {isEditing && (
                            <button
                              type="button"
                              className="btn--edit btn--danger-text"
                              onClick={() => handleRemoveSalaryEntry(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="users-salary__row">
                          {isEditing ? (
                            <>
                              <div className="field">
                                <label htmlFor={`salary-month-${index}`}>Month</label>
                                <input
                                  id={`salary-month-${index}`}
                                  type="month"
                                  value={entry.month || ''}
                                  onChange={(e) => handleSalaryChange(index, 'month', e.target.value)}
                                />
                              </div>
                              <div className="field">
                                <label htmlFor={`salary-basic-${index}`}>Basic Salary</label>
                                <input
                                  id={`salary-basic-${index}`}
                                  type="number"
                                  min="0"
                                  value={entry.basicSalary ?? 0}
                                  onChange={(e) => handleSalaryChange(index, 'basicSalary', e.target.value)}
                                />
                              </div>
                              <div className="field">
                                <label htmlFor={`salary-ot-${index}`}>Overtime</label>
                                <input
                                  id={`salary-ot-${index}`}
                                  type="number"
                                  min="0"
                                  value={entry.overtime ?? 0}
                                  onChange={(e) => handleSalaryChange(index, 'overtime', e.target.value)}
                                />
                              </div>
                              <div className="field">
                                <label htmlFor={`salary-epf-${index}`}>EPF</label>
                                <input
                                  id={`salary-epf-${index}`}
                                  type="number"
                                  min="0"
                                  value={entry.epf ?? 0}
                                  onChange={(e) => handleSalaryChange(index, 'epf', e.target.value)}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="field">
                                <label>Month</label>
                                <p className="users-readonly">{entry.month || '—'}</p>
                              </div>
                              <div className="field">
                                <label>Basic Salary</label>
                                <p className="users-readonly">{entry.basicSalary ?? 0}</p>
                              </div>
                              <div className="field">
                                <label>Overtime</label>
                                <p className="users-readonly">{entry.overtime ?? 0}</p>
                              </div>
                              <div className="field">
                                <label>EPF</label>
                                <p className="users-readonly">{entry.epf ?? 0}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="users-salary__empty-box">
                    <p className="users-salary__empty">No salary history recorded</p>
                    <p className="users-salary__hint">Click Edit Profile, then add monthly salary entries.</p>
                  </div>
                )}
              </section>

              <section className="users-system">
                <h5 className="users-section-title">System Information</h5>
                <div className="users-system__grid">
                  <div>
                    <p className="users-salary__label">Status</p>
                    <p className="users-readonly">{selectedUser.status || 'Active'}</p>
                  </div>
                  <div>
                    <p className="users-salary__label">Publish</p>
                    <p className="users-readonly">{selectedUser.publish || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="users-salary__label">Created</p>
                    <p className="users-readonly">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="users-salary__label">Last Updated</p>
                    <p className="users-readonly">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPasswordModal(false);
            setNewPassword('');
          }}
          role="presentation"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="password-title">
            <div className="modal__header">
              <h3 id="password-title">Change Password</h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label htmlFor="new-password">New Password</label>
                <div className="users-password-wrap">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="users-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <p className="users-password-hint">Minimum 6 characters</p>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={changingPassword}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={changingPassword}
                  onClick={handleChangePassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
