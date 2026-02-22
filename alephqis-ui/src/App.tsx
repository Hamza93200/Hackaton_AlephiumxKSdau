import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MyAccountPage } from './pages/MyAccountPage';
import { ContactPage } from './pages/ContactPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { Toaster } from 'sonner@2.0.3';
import { authApi } from './utils/api';
import './styles/globals.css';

type Page = 'home' | 'login' | 'register' | 'dashboard' | 'admin-dashboard' | 'my-account' | 'contact' | 'client-details';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authApi.verifySession(token);
          if (response.success) {
            setIsAuthenticated(true);
            setIsAdmin(response.profile.isAdmin || response.profile.role === 'admin');
            setUserEmail(response.profile.email);
            // If we are on login/register, go to dashboard
            if (currentPage === 'login' || currentPage === 'register') {
              setCurrentPage(response.profile.isAdmin ? 'admin-dashboard' : 'dashboard');
            }
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userId');
        }
      }
      setIsInitializing(false);
    };

    checkSession();
  }, [currentPage]);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    // Determine if admin based on email or local storage data
    const users = JSON.parse(localStorage.getItem('aleph_users_data') || '[]');
    const user = users.find((u: any) => u.email === email);
    const adminStatus = user?.isAdmin || email === 'admin@alephqis.com';
    setIsAdmin(adminStatus);
    setCurrentPage(adminStatus ? 'admin-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserEmail('');
    setCurrentPage('home');
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading Aleph QIS...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Toaster position="top-center" richColors />
      
      {currentPage === 'home' && (
        <HomePage 
          onNavigateContact={() => setCurrentPage('contact')}
          onNavigateLogin={() => setCurrentPage('login')}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          userEmail={userEmail}
          onNavigateDashboard={() => setCurrentPage('dashboard')}
          onNavigateAdminDashboard={() => setCurrentPage('admin-dashboard')}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage 
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateRegister={() => setCurrentPage('register')}
          onLogin={handleLogin}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage 
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'dashboard' && (
        <DashboardPage 
          onLogout={handleLogout}
          onNavigateMyAccount={() => setCurrentPage('my-account')}
          onNavigateHome={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'admin-dashboard' && (
        <AdminDashboardPage 
          onLogout={handleLogout}
          onNavigateHome={() => setCurrentPage('home')}
          onViewClient={(clientId) => {
            setSelectedClientId(clientId);
            setCurrentPage('client-details');
          }}
        />
      )}

      {currentPage === 'client-details' && (
        <ClientDetailPage
          clientId={selectedClientId}
          onBack={() => setCurrentPage('admin-dashboard')}
          onNavigateHome={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'my-account' && (
        <MyAccountPage 
          onBack={() => setCurrentPage('dashboard')}
          onNavigateHome={() => setCurrentPage('home')}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'contact' && (
        <ContactPage 
          onNavigateHome={() => setCurrentPage('home')}
        />
      )}
    </div>
  );
}

export default App;