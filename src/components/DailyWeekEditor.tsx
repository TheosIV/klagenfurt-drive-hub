import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { getMonthData, getWeekDayRange, setDayData, getDayName, getWeeksForMonth } from "@/lib/tracker";

export default function DailyWeekEditor({
  year,
  month,
  week,
  onDataChange,
}: {
  year: number;
  month: number; // 0-11
  week: number; // 1..5
  onDataChange?: () => void;
}) {
  const range = getWeekDayRange(year, month, week);
  const monthData = getMonthData(year, month);
  const weeks = getWeeksForMonth(year, month);
  const weekLabel = weeks.find(w => w.index === week)?.label || `Week ${week}`;
  const monthShort = new Date(year, month, 1).toLocaleString(undefined, { month: 'short' }).toLowerCase();
  const days = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i);
  const today = new Date();
  const defaultIndex = (today.getFullYear() === year && today.getMonth() === month && today.getDate() >= range.start && today.getDate() <= range.end) ? (today.getDate() - range.start) : 0;
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(defaultIndex);
    }
  }, [carouselApi, defaultIndex]);
  const updatePerf = (day: number, field: "hoursWorked"|"revenue"|"tips"|"ordersDelivered", value: string) => {
    const v = parseFloat(value || '0');
    setDayData(year, month, day, {
      performance: { ...monthData.days?.[day]?.performance, [field]: isNaN(v) ? 0 : v }
    });
    onDataChange?.();
  };
  const updateExp = (day: number, field: "food"|"nonFood"|"transport"|"diningOut"|"entertainment"|"others", value: string) => {
    const v = parseFloat(value || '0');
    setDayData(year, month, day, {
      expenses: { ...monthData.days?.[day]?.expenses, [field]: isNaN(v) ? 0 : v }
    });
    onDataChange?.();
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Daily Logs ({weekLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Carousel setApi={(api) => setCarouselApi(api)} opts={{ loop: false }}>
            <CarouselContent>
              {days.map((day) => {
                const d = monthData.days?.[day];
                return (
                  <CarouselItem key={day}>
                    <div className="rounded-lg border p-4 space-y-3 hover-scale">
                      <div className="font-medium flex items-center gap-2">
                        <span className="text-muted-foreground">{getDayName(year, month, day)}</span>
                        <span>{day} {monthShort}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Hours</Label>
                          <Input type="number" min={0} step="0.25" value={d?.performance?.hoursWorked ?? 0}
                            onChange={(e) => updatePerf(day, 'hoursWorked', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Orders</Label>
                          <Input type="number" min={0} step="1" value={d?.performance?.ordersDelivered ?? 0}
                            onChange={(e) => updatePerf(day, 'ordersDelivered', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Revenue (€)</Label>
                          <Input type="number" min={0} step="0.01" value={d?.performance?.revenue ?? 0}
                            onChange={(e) => updatePerf(day, 'revenue', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Tips (€)</Label>
                          <Input type="number" min={0} step="0.01" value={d?.performance?.tips ?? 0}
                            onChange={(e) => updatePerf(day, 'tips', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ['food','Food'], ['nonFood','Non-food'], ['transport','Transport'], ['diningOut','Dining Out'], ['entertainment','Entertainment'], ['others','Others']
                        ] as const).map(([key,label]) => (
                          <div key={key} className="space-y-1">
                            <Label>{label} (€)</Label>
                            <Input type="number" min={0} step="0.01" value={(d?.expenses?.[key] as number) ?? 0}
                              onChange={(e) => updateExp(day, key, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </CardContent>
    </Card>
  );
}
