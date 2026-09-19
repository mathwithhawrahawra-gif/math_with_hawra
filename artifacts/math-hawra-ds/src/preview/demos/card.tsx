import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export function CardDemo() {
  return (
    <Card className="max-w-md overflow-hidden">
      <div className="h-2 bg-gradient-to-l from-primary to-secondary" />
      <CardHeader>
        <CardTitle>نشاط الكسور</CardTitle>
        <CardDescription>ملخص أداء الطالبات في النشاط.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-2xl font-black text-primary">24</p>
            <p className="text-sm text-muted-foreground">إجابة</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-2xl font-black text-accent">89%</p>
            <p className="text-sm text-muted-foreground">متوسط الدرجات</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline">عرض الإجابات</Button>
      </CardFooter>
    </Card>
  );
}
