export const teaVarieties = [];

export const customers = [];

export const recipes = [];

export const monthlyData = {
  currentMonth: 'April 2026',
  stats: {
    totalInvested: 0,
    netEarned: 0,
    profit: 0,
    loss: 0
  },
  dailySales: Array.from({ length: 30 }, (_, i) => ({ day: (i + 1).toString().padStart(2, '0'), revenue: 0 })),
  topSold: [],
  leastSold: []
};

export const balanceSheets = [
  { month: 'Jan 2026', opening: 0, invested: 0, sales: 0, expenses: 0, profit: 0, closing: 0, status: 'profit' },
  { month: 'Feb 2026', opening: 0, invested: 0, sales: 0, expenses: 0, profit: 0, closing: 0, status: 'profit' },
  { month: 'Mar 2026', opening: 0, invested: 0, sales: 0, expenses: 0, profit: 0, closing: 0, status: 'profit' },
];
