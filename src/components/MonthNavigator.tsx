import { Button } from "@/components/ui/button";

export type MonthNavigatorProps = {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export const MonthNavigator = ({ year, month, onChange }: MonthNavigatorProps) => {
  const prev = () => {
    const newMonth = month - 1;
    if (newMonth < 0) onChange(year - 1, 11);
    else onChange(year, newMonth);
  };
  const next = () => {
    const newMonth = month + 1;
    if (newMonth > 11) onChange(year + 1, 0);
    else onChange(year, newMonth);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" onClick={prev} aria-label="Previous month">Prev</Button>
      <div className="text-sm md:text-base font-medium" aria-live="polite">
        {monthNames[month]} {year}
      </div>
      <Button variant="secondary" onClick={next} aria-label="Next month">Next</Button>
    </div>
  );
};

export default MonthNavigator;
