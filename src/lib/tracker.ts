export type DailyPerformance = {
  hoursWorked: number;
  revenue: number; // base revenue (excl. tips)
  tips: number;
  ordersDelivered: number;
};

export type DailyExpenses = {
  food: number;
  nonFood: number;
  transport: number;
  diningOut: number;
  entertainment: number;
  others: number;
};

export type WeeklyPerformance = DailyPerformance & { comment?: string };
export type WeeklyExpenses = DailyExpenses;

export type MonthlyExpenses = {
  rent: number;
  phone: number;
  svs: number;
  others: number;
};

export type DayData = {
  performance: DailyPerformance;
  expenses: DailyExpenses;
};

export type WeekData = {
  performance: WeeklyPerformance;
  expenses: WeeklyExpenses;
};

export type MonthData = {
  // Derived "weeks" legacy field (kept for compatibility). Will not be directly edited anymore.
  weeks: Record<number, WeekData>; // 1..5
  // Source of truth going forward
  days?: Record<number, DayData>; // 1..31
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

function emptyDay(): DayData {
  return {
    performance: { hoursWorked: 0, revenue: 0, tips: 0, ordersDelivered: 0 },
    expenses: { food: 0, nonFood: 0, transport: 0, diningOut: 0, entertainment: 0, others: 0 },
  };
}

function emptyWeek(): WeekData {
  return {
    performance: { hoursWorked: 0, revenue: 0, tips: 0, ordersDelivered: 0, comment: "" },
    expenses: { food: 0, nonFood: 0, transport: 0, diningOut: 0, entertainment: 0, others: 0 },
  };
}

export function ensureMonth(store: DataStore, year: number, month: number): DataStore {
  if (!store[year]) store[year] = {} as Record<number, MonthData>;
  if (!store[year][month]) {
    store[year][month] = {
      weeks: { 1: emptyWeek(), 2: emptyWeek(), 3: emptyWeek(), 4: emptyWeek(), 5: emptyWeek(), 6: emptyWeek() },
      days: {},
      monthlyExpenses: { rent: 0, phone: 0, svs: 0, others: 0 },
    };
  } else {
    // ensure shape keys exist
    store[year][month].weeks ||= { 1: emptyWeek(), 2: emptyWeek(), 3: emptyWeek(), 4: emptyWeek(), 5: emptyWeek(), 6: emptyWeek() };
    store[year][month].days ||= {};
    store[year][month].monthlyExpenses ||= { rent: 0, phone: 0, svs: 0, others: 0 };
  }
  return store;
}

export function getMonthData(year: number, month: number): MonthData {
  const store = ensureMonth(getStore(), year, month);
  saveStore(store);
  return store[year][month];
}

export function setDayData(year: number, month: number, day: number, data: Partial<DayData>) {
  const store = ensureMonth(getStore(), year, month);
  const monthData = store[year][month];
  if (!monthData.days![day]) monthData.days![day] = emptyDay();
  monthData.days![day] = {
    performance: { ...monthData.days![day].performance, ...(data.performance || {}) },
    expenses: { ...monthData.days![day].expenses, ...(data.expenses || {}) },
  };
  saveStore(store);
}

// Legacy: direct week set (kept for compatibility, but weekly UI will be read-only).
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

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export type WeekRange = { index: number; start: number; end: number; label: string };

function monthShortLower(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, { month: 'short' }).toLowerCase();
}

export function getWeeksForMonth(year: number, month: number): WeekRange[] {
  const dim = getDaysInMonth(year, month);
  const dowFirst = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  const firstMonday = 1 + ((8 - dowFirst) % 7); // day number of first Monday in this month
  const weeks: WeekRange[] = [];
  let idx = 1;
  if (firstMonday > 1) {
    weeks.push({ index: idx++, start: 1, end: firstMonday - 1, label: `1-${firstMonday - 1} ${monthShortLower(year, month)}` });
  }
  for (let start = firstMonday; start <= dim; start += 7) {
    const end = Math.min(start + 6, dim);
    weeks.push({ index: idx++, start, end, label: `${start}-${end} ${monthShortLower(year, month)}` });
  }
  return weeks;
}

export function getWeekDayRange(year: number, month: number, week: number): { start: number; end: number } {
  const weeks = getWeeksForMonth(year, month);
  const w = weeks.find(w => w.index === week) || weeks[0];
  return { start: w.start, end: w.end };
}

export function getCurrentWeekIndex(year: number, month: number, today: Date = new Date()): number {
  const day = (today.getFullYear() === year && today.getMonth() === month) ? today.getDate() : 1;
  const weeks = getWeeksForMonth(year, month);
  const found = weeks.find(w => day >= w.start && day <= w.end);
  return found?.index || 1;
}

export function getDayName(year: number, month: number, day: number): string {
  const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const d = new Date(year, month, day).getDay();
  return names[d];
}

export function computeWeekFromDays(year: number, month: number, week: number, store?: DataStore): WeekData {
  const s = store ? ensureMonth(structuredClone(store), year, month) : ensureMonth(getStore(), year, month);
  const md = s[year][month];
  const { start, end } = getWeekDayRange(year, month, week);
  let perf: DailyPerformance = { hoursWorked: 0, revenue: 0, tips: 0, ordersDelivered: 0 };
  let exp: DailyExpenses = { food: 0, nonFood: 0, transport: 0, diningOut: 0, entertainment: 0, others: 0 };
  for (let d = start; d <= end; d++) {
    const day = md.days?.[d];
    if (!day) continue;
    perf.hoursWorked += day.performance.hoursWorked || 0;
    perf.revenue += day.performance.revenue || 0;
    perf.tips += day.performance.tips || 0;
    perf.ordersDelivered += day.performance.ordersDelivered || 0;
    exp.food += day.expenses.food || 0;
    exp.nonFood += day.expenses.nonFood || 0;
    exp.transport += day.expenses.transport || 0;
    exp.diningOut += day.expenses.diningOut || 0;
    exp.entertainment += day.expenses.entertainment || 0;
    exp.others += day.expenses.others || 0;
  }
  const comment = md.weeks[week]?.performance.comment || ""; // keep weekly comment if present
  return { performance: { ...perf, comment }, expenses: exp };
}

export type MonthSummary = {
  totalHours: number;
  totalOrders: number;
  revenue: number;
  tips: number;
  gross: number;
  weeklyExpensesTotal: number; // from sum of days
  monthlyExpensesTotal: number; // fixed monthly
  businessExpense6: number;
  svs: number;
  netBeforeTax: number;
  taxableAmount: number; // only excess over 1050
  tax: number; // 20% of excess
  allExpensesExclSVS: number;
  savingsBeforeTax: number;
  savingsAfterTax: number;
};

export function computeMonthSummary(year: number, month: number, store?: DataStore): MonthSummary {
  const s = store ? ensureMonth(structuredClone(store), year, month) : ensureMonth(getStore(), year, month);
  const md = s[year][month];
  const dim = getDaysInMonth(year, month);
  let totalHours = 0, totalOrders = 0, revenue = 0, tips = 0, weeklyExpensesTotal = 0;

  // Prefer days as source of truth
  if (md.days && Object.keys(md.days).length > 0) {
    for (let d = 1; d <= dim; d++) {
      const day = md.days[d];
      if (!day) continue;
      totalHours += day.performance.hoursWorked || 0;
      totalOrders += day.performance.ordersDelivered || 0;
      revenue += day.performance.revenue || 0;
      tips += day.performance.tips || 0;
      weeklyExpensesTotal += (day.expenses.food||0)+(day.expenses.nonFood||0)+(day.expenses.transport||0)+(day.expenses.diningOut||0)+(day.expenses.entertainment||0)+(day.expenses.others||0);
    }
  } else {
    // Fallback: sum legacy weeks
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
  }

  const me = md.monthlyExpenses;
  const monthlyExpensesTotal = (me.rent||0)+(me.phone||0)+(me.svs||0)+(me.others||0);
  const gross = revenue + tips;
  const businessExpense6 = gross * 0.06;
  const svs = me.svs || 0;
  const netBeforeTax = gross - businessExpense6 - svs;
  // Only excess over 1050 is taxable
  const taxableAmount = Math.max(0, netBeforeTax - 1050);
  const tax = taxableAmount * 0.20;
  const allExpensesExclSVS = (monthlyExpensesTotal - svs) + weeklyExpensesTotal;
  const savingsBeforeTax = netBeforeTax - allExpensesExclSVS;
  const savingsAfterTax = savingsBeforeTax - tax;

  return { totalHours, totalOrders, revenue, tips, gross, weeklyExpensesTotal, monthlyExpensesTotal, businessExpense6, svs, netBeforeTax, taxableAmount, tax, allExpensesExclSVS, savingsBeforeTax, savingsAfterTax };
}
