import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StatCard = ({ title, value, help }:{ title: string; value: string; help?: string }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {help ? <p className="text-xs text-muted-foreground mt-1">{help}</p> : null}
    </CardContent>
  </Card>
);

export default StatCard;
