import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  balance: number;
  documents?: string[];
  accessibleFunds: string[];
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  minInvestment: number;
  apy: number;
  totalAssets: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell';
  amount: number;
  asset: string;
  date: string;
  status: 'completed' | 'pending';
}

interface AuthContextType {
  user: User | null;
  users: User[];
  funds: Fund[];
  transactions: Transaction[];
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateKyc: (userId: string, status: User['kycStatus']) => void;
  addFund: (fund: Fund) => void;
  assignFund: (userId: string, fundId: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_FUNDS: Fund[] = [
  { id: '1', name: 'Alpha Quant Fund', description: 'Stratégie long/short sur Bitcoin et Ethereum.', minInvestment: 1000, apy: 24.5, totalAssets: 12500000 },
  { id: '2', name: 'Beta Momentum Fund', description: 'Suivi de tendance sur le top 20 des actifs numériques.', minInvestment: 5000, apy: 18.2, totalAssets: 8400000 },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [funds, setFunds] = useState<Fund[]>(DEFAULT_FUNDS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('aleph_users');
    const savedFunds = localStorage.getItem('aleph_funds');
    const savedTxs = localStorage.getItem('aleph_txs');
    const currentUser = localStorage.getItem('aleph_current_user');

    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      
      // Seed admin if not exists
      if (!parsedUsers.find((u: User) => u.email === 'admin@alephqis.com')) {
        const admin: User = {
          id: 'admin-1',
          email: 'admin@alephqis.com',
          name: 'Admin Aleph',
          role: 'admin',
          kycStatus: 'verified',
          balance: 0,
          accessibleFunds: [],
        };
        const newUsers = [...parsedUsers, admin];
        setUsers(newUsers);
        localStorage.setItem('aleph_users', JSON.stringify(newUsers));
      }
    } else {
      const admin: User = {
        id: 'admin-1',
        email: 'admin@alephqis.com',
        name: 'Admin Aleph',
        role: 'admin',
        kycStatus: 'verified',
        balance: 0,
        accessibleFunds: [],
      };
      setUsers([admin]);
      localStorage.setItem('aleph_users', JSON.stringify([admin]));
    }

    if (savedFunds) setFunds(JSON.parse(savedFunds));
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (currentUser) setUser(JSON.parse(currentUser));
  }, []);

  // Persistence helpers
  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('aleph_users', JSON.stringify(newUsers));
  };

  const saveFunds = (newFunds: Fund[]) => {
    setFunds(newFunds);
    localStorage.setItem('aleph_funds', JSON.stringify(newFunds));
  };

  const saveTxs = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem('aleph_txs', JSON.stringify(newTxs));
  };

  const login = async (email: string) => {
    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('aleph_current_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const signup = async (email: string, name: string) => {
    if (users.find(u => u.email === email)) return false;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'user',
      kycStatus: 'not_submitted',
      balance: 0,
      accessibleFunds: [],
    };
    
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    setUser(newUser);
    localStorage.setItem('aleph_current_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aleph_current_user');
  };

  const updateKyc = (userId: string, status: User['kycStatus']) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, kycStatus: status } : u);
    saveUsers(newUsers);
    if (user?.id === userId) {
      const updated = { ...user, kycStatus: status };
      setUser(updated);
      localStorage.setItem('aleph_current_user', JSON.stringify(updated));
    }
  };

  const addFund = (fund: Fund) => {
    const newFunds = [...funds, fund];
    saveFunds(newFunds);
  };

  const assignFund = (userId: string, fundId: string) => {
    const newUsers = users.map(u => {
      if (u.id === userId) {
        const accessibleFunds = u.accessibleFunds.includes(fundId) 
          ? u.accessibleFunds 
          : [...u.accessibleFunds, fundId];
        return { ...u, accessibleFunds };
      }
      return u;
    });
    saveUsers(newUsers);
    if (user?.id === userId) {
      const updated = { ...user, accessibleFunds: [...user.accessibleFunds, fundId] };
      setUser(updated);
      localStorage.setItem('aleph_current_user', JSON.stringify(updated));
    }
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const newTx: Transaction = {
      ...txData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      status: 'completed'
    };
    const newTxs = [newTx, ...transactions];
    saveTxs(newTxs);
    
    // Update balance
    if (txData.type === 'deposit') {
      const newUsers = users.map(u => u.id === txData.userId ? { ...u, balance: u.balance + txData.amount } : u);
      saveUsers(newUsers);
      if (user?.id === txData.userId) {
        const updated = { ...user, balance: user.balance + txData.amount };
        setUser(updated);
        localStorage.setItem('aleph_current_user', JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, users, funds, transactions, 
      login, signup, logout, updateKyc, 
      addFund, assignFund, addTransaction 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
