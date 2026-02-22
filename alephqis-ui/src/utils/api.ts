// Mock data keys for localStorage
const STORAGE_KEYS = {
  USERS: 'aleph_users_data',
  FUNDS: 'aleph_funds_data',
  TRANSACTIONS: 'aleph_transactions_data',
  CONTACTS: 'aleph_contacts_data'
};

// Initial data if nothing in storage
const INITIAL_FUNDS = [
  {
    id: 'fund-1',
    name: 'Alpha Quant Fund',
    symbol: 'ALFA',
    description: 'High-frequency systematic trading strategy focused on major digital assets with volatility-adjusted sizing.',
    currentPrice: 1245.50,
    initialPrice: 1000,
    change24h: 2.4,
    strategy: 'Quantitative Momentum'
  },
  {
    id: 'fund-2',
    name: 'Beta Neutral Arbitrage',
    symbol: 'BETA',
    description: 'Market-neutral strategy capturing cross-exchange inefficiencies and funding rate differentials.',
    currentPrice: 1082.30,
    initialPrice: 1000,
    change24h: 0.85,
    strategy: 'Delta Neutral Arbitrage'
  },
  {
    id: 'fund-3',
    name: 'Gamma Yield Harvester',
    symbol: 'GAMMA',
    description: 'Automated liquidity provision and yield farming across audited DeFi protocols with active risk hedging.',
    currentPrice: 1156.20,
    initialPrice: 1000,
    change24h: -0.42,
    strategy: 'Systematic Yield'
  }
];

const INITIAL_USERS = [
  {
    id: 'admin-1',
    email: 'admin@alephqis.com',
    firstName: 'Admin',
    lastName: 'Aleph',
    role: 'admin',
    isAdmin: true,
    status: 'verified',
    kyc: 'verified',
    cashBalance: 0,
    investments: [],
    availableFunds: ['fund-1', 'fund-2', 'fund-3'],
    transactions: [],
    portfolioHistory: []
  }
];

// Helper to get/set from localStorage
const getFromStorage = (key: string, defaultValue: any) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock helper to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authApi = {
  register: async (userData: any) => {
    await delay(800);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    
    if (users.find((u: any) => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      role: 'user',
      isAdmin: false,
      status: 'pending',
      kyc: 'pending',
      cashBalance: 0,
      investments: [],
      availableFunds: [], // Needs admin approval
      transactions: [],
      portfolioHistory: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);

    return {
      success: true,
      accessToken: 'mock-token-' + newUser.id,
      userId: newUser.id,
      profile: newUser
    };
  },

  login: async (credentials: { email: string; password?: string }) => {
    await delay(600);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((u: any) => u.email === credentials.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    return {
      success: true,
      accessToken: 'mock-token-' + user.id,
      userId: user.id,
      isAdmin: user.isAdmin,
      profile: user
    };
  },

  verifySession: async (token: string) => {
    await delay(300);
    const userId = token.replace('mock-token-', '');
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((u: any) => u.id === userId);

    if (!user) {
      throw new Error('Session invalid');
    }

    return {
      success: true,
      profile: user
    };
  },
};

// Client API
export const clientApi = {
  getProfile: async (token: string) => {
    await delay(400);
    const userId = token.replace('mock-token-', '');
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((u: any) => u.id === userId);

    if (!user) throw new Error('User not found');
    
    return { success: true, profile: user };
  },

  uploadDocument: async (token: string, file: File, documentType: string) => {
    await delay(1000);
    // In local mode, we just simulate the upload
    return { success: true, documentId: 'doc-' + Math.random().toString(36).substr(2, 5) };
  },

  trade: async (token: string, fundId: string, action: 'buy' | 'sell', shares: number) => {
    await delay(1200);
    const userId = token.replace('mock-token-', '');
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const funds = getFromStorage(STORAGE_KEYS.FUNDS, INITIAL_FUNDS);
    
    const userIndex = users.findIndex((u: any) => u.id === userId);
    const fund = funds.find((f: any) => f.id === fundId);
    
    if (userIndex === -1 || !fund) throw new Error('User or Fund not found');
    const user = users[userIndex];
    
    const price = fund.currentPrice;
    const totalCost = price * shares;

    if (action === 'buy') {
      if (user.cashBalance < totalCost) throw new Error('Insufficient cash balance');
      
      user.cashBalance -= totalCost;
      const investmentIndex = user.investments.findIndex((inv: any) => inv.fundId === fundId);
      
      if (investmentIndex > -1) {
        const inv = user.investments[investmentIndex];
        const newShares = inv.shares + shares;
        const newAvgPrice = (inv.shares * inv.averagePrice + totalCost) / newShares;
        user.investments[investmentIndex] = {
          ...inv,
          shares: newShares,
          averagePrice: newAvgPrice,
          currentValue: newShares * price
        };
      } else {
        user.investments.push({
          fundId,
          fundName: fund.name,
          fundSymbol: fund.symbol,
          shares,
          averagePrice: price,
          currentValue: totalCost
        });
      }
    } else {
      const investmentIndex = user.investments.findIndex((inv: any) => inv.fundId === fundId);
      if (investmentIndex === -1 || user.investments[investmentIndex].shares < shares) {
        throw new Error('Insufficient shares to sell');
      }
      
      const inv = user.investments[investmentIndex];
      user.cashBalance += totalCost;
      inv.shares -= shares;
      inv.currentValue = inv.shares * price;
      
      if (inv.shares <= 0) {
        user.investments.splice(investmentIndex, 1);
      }
    }

    user.transactions.unshift({
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      fundId,
      fundName: fund.name,
      type: action === 'buy' ? 'Purchase' : 'Sale',
      shares,
      price,
      amount: totalCost,
      status: 'Completed',
      createdAt: new Date().toISOString()
    });

    saveToStorage(STORAGE_KEYS.USERS, users);
    return { success: true };
  },
};

// Admin API
export const adminApi = {
  getAllClients: async () => {
    await delay(500);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    return { success: true, clients: users.filter((u: any) => !u.isAdmin) };
  },

  getClient: async (clientId: string) => {
    await delay(300);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((u: any) => u.id === clientId);
    return { success: true, client: user };
  },

  updateClientStatus: async (clientId: string, status: string, kyc: string) => {
    await delay(500);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const userIndex = users.findIndex((u: any) => u.id === clientId);
    if (userIndex > -1) {
      users[userIndex].status = status;
      users[userIndex].kyc = kyc;
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
    return { success: true };
  },

  grantFundAccess: async (clientId: string, fundId: string) => {
    await delay(500);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const userIndex = users.findIndex((u: any) => u.id === clientId);
    if (userIndex > -1) {
      const availableFunds = users[userIndex].availableFunds || [];
      if (!availableFunds.includes(fundId)) {
        availableFunds.push(fundId);
      }
      users[userIndex].availableFunds = availableFunds;
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
    return { success: true };
  },

  createFund: async (fundData: any) => {
    await delay(800);
    const funds = getFromStorage(STORAGE_KEYS.FUNDS, INITIAL_FUNDS);
    const newFund = {
      ...fundData,
      id: 'fund-' + Math.random().toString(36).substr(2, 5),
      currentPrice: fundData.initialPrice || 1000,
      change24h: 0
    };
    funds.push(newFund);
    saveToStorage(STORAGE_KEYS.FUNDS, funds);
    return { success: true, fund: newFund };
  },

  depositFunds: async (clientId: string, amount: number, note?: string) => {
    await delay(600);
    const users = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    const userIndex = users.findIndex((u: any) => u.id === clientId);
    if (userIndex > -1) {
      users[userIndex].cashBalance = (users[userIndex].cashBalance || 0) + amount;
      users[userIndex].transactions.unshift({
        id: 'tx-' + Math.random().toString(36).substr(2, 9),
        type: 'Deposit',
        amount,
        status: 'Completed',
        note,
        createdAt: new Date().toISOString()
      });
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
    return { success: true };
  },
};

// Fund API
export const fundApi = {
  getAllFunds: async () => {
    await delay(400);
    const funds = getFromStorage(STORAGE_KEYS.FUNDS, INITIAL_FUNDS);
    return { success: true, funds };
  },

  updatePrice: async (token: string, fundId: string, newPrice: number) => {
    await delay(500);
    const funds = getFromStorage(STORAGE_KEYS.FUNDS, INITIAL_FUNDS);
    const fundIndex = funds.findIndex((f: any) => f.id === fundId);
    if (fundIndex > -1) {
      const oldPrice = funds[fundIndex].currentPrice;
      funds[fundIndex].currentPrice = newPrice;
      funds[fundIndex].change24h = ((newPrice - oldPrice) / oldPrice) * 100;
      saveToStorage(STORAGE_KEYS.FUNDS, funds);
    }
    return { success: true };
  },
};

// Contact API
export const contactApi = {
  submit: async (contactData: any) => {
    await delay(1000);
    const contacts = getFromStorage(STORAGE_KEYS.CONTACTS, []);
    contacts.push({ ...contactData, id: Date.now(), createdAt: new Date().toISOString() });
    saveToStorage(STORAGE_KEYS.CONTACTS, contacts);
    return { success: true };
  },
};
