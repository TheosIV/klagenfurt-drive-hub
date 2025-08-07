import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeMonthSummary, getStore, MonthSummary } from "@/lib/tracker";

const formatCurrency = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);

const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
];

const Yearly = () => {
  useEffect(() => {
    document.title = "Yearly Analysis | Driver Tracker";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Yearly income, expenses, tax and savings overview for your driver work.");
    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel','canonical');
    linkCanonical.setAttribute('href', window.location.origin + '/yearly');
    document.head.appendChild(linkCanonical);
  }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());

  const rows: { month: number; s: MonthSummary }[] = useMemo(() => {
    const data = [] as { month: number; s: MonthSummary }[];
    const store = getStore();
    for (let m = 0; m < 12; m++) {
      data.push({ month: m, s: computeMonthSummary(year, m, store) });
    }
    return data;
  }, [year]);

  const totals = rows.reduce((acc, r) => {
    acc.gross += r.s.gross; acc.weekly += r.s.weeklyExpensesTotal; acc.monthly += r.s.monthlyExpensesTotal;
    acc.tax += r.s.tax; acc.savings += r.s.savingsAfterTax; return acc;
  }, { gross: 0, weekly: 0, monthly: 0, tax: 0, savings: 0 });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto space-y-6">
        <h1 className="sr-only">Yearly Analysis</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setYear(y => y - 1)} aria-label="Previous year">Prev</Button>
          <div className="font-medium">{year}</div>
          <Button variant="secondary" onClick={() => setYear(y => y + 1)} aria-label="Next year">Next</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Weekly Expenses</TableHead>
              <TableHead className="text-right">Monthly Expenses</TableHead>
              <TableHead className="text-right">Net Before Tax</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Savings After Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.month}>
                <TableCell>{monthNames[r.month]}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.gross)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.weeklyExpensesTotal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.monthlyExpensesTotal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.netBeforeTax)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.tax)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.s.savingsAfterTax)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.gross)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.weekly)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.monthly)}</TableCell>
              <TableCell className="text-right font-medium">{/* derived per month; omit */}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.tax)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.savings)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </main>
    </div>
  );
};

export default Yearly;
