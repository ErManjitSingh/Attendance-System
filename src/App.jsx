import { useState } from 'react';
import { isAuthenticated } from './config/auth';
import { Layout } from './components/Layout';
import AttendancePage from './pages/AttendancePage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [activeTab, setActiveTab] = useState('attendance');

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => setAuthed(false)}>
      {activeTab === 'attendance' && <AttendancePage />}
      {activeTab === 'users' && <UsersPage />}
    </Layout>
  );
}

export default App;
