export type WeeklyPerformance = {
  hoursWorked: number;
  revenue: number; // base revenue (excl. tips)
  tips: number;
  ordersDelivered: number;
  comment?: string;
};

export type WeeklyExpenses = {
  food: number;
  nonFood: number;
  transport: number;
  diningOut: number;
  entertainment: number;
  others: number;
};

export type MonthlyExpenses = {
  rent: number;
  phone: number;
  svs: number;
  others: number;
};

export type WeekData = {
  performance: WeeklyPerformance;
  expenses: WeeklyExpenses;
};

export type MonthData = {
  weeks: Record<number, WeekData>; // 1..5
  monthlyExpenses: MonthlyExpenses;
};

export type DataStore = Record<number, Record<number, MonthData>>; // year -> month(0-11)

const STORAGE_KEY = "driver-tracker-data-v1";

export function getStore(): DataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as DataStore;
    return JSON.parse(raw) as DataStore;
  } catch {
    return {} as DataStore;
  }
}

export function saveStore(store: DataStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function ensureMonth(store: DataStore, year: number, month: number): DataStore {
  if (!store[year]) store[year] = {} as Record<number, MonthData>;
  if (!store[year][month]) {
    const emptyWeek = (): WeekData => ({
      performance: { hoursWorked: 0, revenue: 0, tips: 0, ordersDelivered: 0, comment: "" },
      expenses: { food: 0, nonFood: 0, transport: 0, diningOut: 0, entertainment: 0, others: 0 },
    });
    store[year][month] = {
      weeks: { 1: emptyWeek(), 2: emptyWeek(), 3: emptyWeek(), 4: emptyWeek(), 5: emptyWeek() },
      monthlyExpenses: { rent: 0, phone: 0, svs: 0, others: 0 },
    };
  }
  return store;
}

export function getMonthData(year: number, month: number): MonthData {
  const store = ensureMonth(getStore(), year, month);
  saveStore(store);
  return store[year][month];
}

export function setWeekData(year: number, month: number, week: number, data: Partial<WeekData>) {
  const store = ensureMonth(getStore(), year, month);
  store[year][month].weeks[week] = {
    ...store[year][month].weeks[week],
    ...data,
    performance: { ...store[year][month].weeks[week].performance, ...(data.performance || {}) },
    expenses: { ...store[year][month].weeks[week].expenses, ...(data.expenses || {}) },
  };
  saveStore(store);
}

export function setMonthlyExpenses(year: number, month: number, expenses: Partial<MonthlyExpenses>) {
  const store = ensureMonth(getStore(), year, month);
  store[year][month].monthlyExpenses = { ...store[year][month].monthlyExpenses, ...expenses };
  saveStore(store);
}

export type MonthSummary = {
  totalHours: number;
  totalOrders: number;
  revenue: number;
  tips: number;
  gross: number;
  weeklyExpensesTotal: number;
  monthlyExpensesTotal: number;
  businessExpense6: number;
  svs: number;
  netBeforeTax: number;
  taxableAmount: number;
  tax: number;
  allExpensesExclSVS: number;
  savingsBeforeTax: number;
  savingsAfterTax: number;
};

export function computeMonthSummary(year: number, month: number, store?: DataStore): MonthSummary {
  const s = store ? ensureMonth(structuredClone(store), year, month) : ensureMonth(getStore(), year, month);
  const md = s[year][month];
  let totalHours = 0, totalOrders = 0, revenue = 0, tips = 0, weeklyExpensesTotal = 0;
  for (let w = 1; w <= 5; w++) {
    const wd = md.weeks[w];
    if (!wd) continue;
    totalHours += wd.performance.hoursWorked || 0;
    totalOrders += wd.performance.ordersDelivered || 0;
    revenue += wd.performance.revenue || 0;
    tips += wd.performance.tips || 0;
    const e = wd.expenses;
    weeklyExpensesTotal += (e.food||0)+(e.nonFood||0)+(e.transport||0)+(e.diningOut||0)+(e.entertainment||0)+(e.others||0);
  }
  const me = md.monthlyExpenses;
  const monthlyExpensesTotal = (me.rent||0)+(me.phone||0)+(me.svs||0)+(me.others||0);
  const gross = revenue + tips;
  const businessExpense6 = gross * 0.06;
  const svs = me.svs || 0;
  const netBeforeTax = gross - businessExpense6 - svs;
  const taxableAmount = Math.max(0, netBeforeTax - 1050);
  const tax = taxableAmount * 0.20;
  const allExpensesExclSVS = (monthlyExpensesTotal - svs) + weeklyExpensesTotal;
  const savingsBeforeTax = netBeforeTax - allExpensesExclSVS;
  const savingsAfterTax = savingsBeforeTax - tax;

  return { totalHours, totalOrders, revenue, tips, gross, weeklyExpensesTotal, monthlyExpensesTotal, businessExpense6, svs, netBeforeTax, taxableAmount, tax, allExpensesExclSVS, savingsBeforeTax, savingsAfterTax };
}
