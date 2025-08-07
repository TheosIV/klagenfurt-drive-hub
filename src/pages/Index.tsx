import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import MonthNavigator from "@/components/MonthNavigator";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DailyWeekEditor from "@/components/DailyWeekEditor";
import { computeMonthSummary, computeWeekFromDays, getMonthData, MonthData, setMonthlyExpenses, setWeekData, getWeeksForMonth, getCurrentWeekIndex } from "@/lib/tracker";
import { TrendingUp, Receipt, PiggyBank } from "lucide-react";

const formatCurrency = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);


const Index = () => {
  // SEO
  useEffect(() => {
    document.title = "Driver Income & Expense Tracker | Klagenfurt";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Track Lieferando driver daily & weekly performance, expenses, and monthly savings with auto week/month handling.");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Driver Tracker Klagenfurt Dashboard");
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", "Daily logs roll up to weekly totals; monthly net income with 6% expense and 20% tax on excess over 1050.");
    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel','canonical');
    linkCanonical.setAttribute('href', window.location.origin + '/');
    document.head.appendChild(linkCanonical);
  }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());
  const [week, setWeek] = useState<number>(getCurrentWeekIndex(now.getFullYear(), now.getMonth()));
  const [tick, setTick] = useState(0); // force refresh when day data changes

  useEffect(() => {
    setWeek(getCurrentWeekIndex(year, month));
  }, [year, month]);

  const monthData: MonthData = useMemo(() => getMonthData(year, month), [year, month, tick]);
  const aggWeek = useMemo(() => computeWeekFromDays(year, month, week), [year, month, week, tick]);
  const summary = useMemo(() => computeMonthSummary(year, month), [year, month, tick]);

  const updateMonthExp = (field: keyof typeof monthData.monthlyExpenses, value: string) => {
    const v = parseFloat(value || '0');
    setMonthlyExpenses(year, month, { [field]: isNaN(v) ? 0 : v });
    setTick(t => t + 1);
  };

  const avgRevenuePerHour = (aggWeek.performance.revenue + aggWeek.performance.tips) / (aggWeek.performance.hoursWorked || 1);
  const avgOrdersPerHour = (aggWeek.performance.ordersDelivered || 0) / (aggWeek.performance.hoursWorked || 1);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto space-y-6">
        <h1 className="sr-only">Driver Income & Expense Tracker Dashboard</h1>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Timeframe</span>
              <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Week</Label>
              <Select value={String(week)} onValueChange={(v) => setWeek(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select week" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(w => <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || '0') || now.getFullYear())} />
            </div>
            <div className="space-y-2">
              <Label>Month (0-11)</Label>
              <Input type="number" min={0} max={11} value={month} onChange={(e) => setMonth(Math.min(11, Math.max(0, parseInt(e.target.value||'0'))))} />
            </div>
          </CardContent>
        </Card>

        <DailyWeekEditor year={year} month={month} week={week} onDataChange={() => setTick(t => t + 1)} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Weekly Performance (Auto from daily)</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hours Worked</Label>
                <Input type="number" value={aggWeek.performance.hoursWorked} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Revenue (€)</Label>
                <Input type="number" value={aggWeek.performance.revenue} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Tips (€)</Label>
                <Input type="number" value={aggWeek.performance.tips} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Orders Delivered</Label>
                <Input type="number" value={aggWeek.performance.ordersDelivered} readOnly disabled />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Weekly Comment</Label>
                <Input type="text" value={monthData.weeks[week]?.performance.comment || ''}
                  onChange={(e) => { setWeekData(year, month, week, { performance: { ...monthData.weeks[week].performance, comment: e.target.value } }); setTick(t => t + 1);} } />
              </div>
              <Separator className="md:col-span-2" />
              <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                <StatCard title="Avg Revenue / Hour" value={formatCurrency(avgRevenuePerHour)} />
                <StatCard title="Avg Orders / Hour" value={(avgOrdersPerHour || 0).toFixed(2)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Weekly Expenses (Auto from daily)</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {([
                ['food','Food'], ['nonFood','Non-food'], ['transport','Transport'], ['diningOut','Dining Out'], ['entertainment','Entertainment'], ['others','Others']
              ] as const).map(([key,label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label} (€)</Label>
                  <Input type="number" value={aggWeek.expenses[key] as number} readOnly disabled />
                </div>
              ))}
              <Separator className="md:col-span-2" />
              <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                <StatCard title="This Week Total" value={formatCurrency(Object.values(aggWeek.expenses).reduce((a,b)=>a+(b||0),0))} />
                <StatCard title="Month Weekly Sum" value={formatCurrency(summary.weeklyExpensesTotal)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Monthly Fixed Expenses</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {([
              ['rent','Rent'], ['phone','Phone'], ['svs','SVS'], ['others','Others']
            ] as const).map(([key,label]) => (
              <div key={key} className="space-y-2">
                <Label>{label} (€)</Label>
                <Input type="number" min={0} step="0.01" value={monthData.monthlyExpenses[key] as number}
                  onChange={(e) => updateMonthExp(key, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Gross (revenue + tips)" value={formatCurrency(summary.gross)} />
          <StatCard title="Business Expense (6%)" value={formatCurrency(summary.businessExpense6)} />
          <StatCard title="Net Before Tax" value={formatCurrency(summary.netBeforeTax)} />
          <StatCard title="Tax (20% over 1050)" value={formatCurrency(summary.tax)} />
          <StatCard title="All Monthly Expenses (incl. SVS)" value={formatCurrency(summary.monthlyExpensesTotal + summary.weeklyExpensesTotal)} />
          <StatCard title="Savings After Tax" value={formatCurrency(summary.savingsAfterTax)} />
        </div>
      </main>
    </div>
  );
};

export default Index;
