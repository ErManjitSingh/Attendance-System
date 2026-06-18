export const AUTH_CREDENTIALS = {
  contactNo: '9816661968',
  password: '123456',
};

export const AUTH_STORAGE_KEY = 'ptw_attendance_auth';

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

export function login(contactNo, password) {
  const phone = String(contactNo).trim();
  const pass = String(password).trim();
  if (phone === AUTH_CREDENTIALS.contactNo && pass === AUTH_CREDENTIALS.password) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
