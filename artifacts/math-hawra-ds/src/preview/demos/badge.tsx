import { CheckCircle2, CircleAlert, Clock3 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Row } from '../parts';

export function BadgeDemo() {
  return (
    <div className="rounded-2xl border bg-card/80 p-6 shadow-lg">
      <Row label="حالات النشاط">
        <Badge className="bg-green-500 text-white"><CheckCircle2 className="ml-1 h-3.5 w-3.5" /> مكتمل</Badge>
        <Badge variant="secondary"><Clock3 className="ml-1 h-3.5 w-3.5" /> قيد المراجعة</Badge>
        <Badge variant="destructive"><CircleAlert className="ml-1 h-3.5 w-3.5" /> يحتاج انتباه</Badge>
        <Badge variant="outline">مسودة</Badge>
      </Row>
    </div>
  );
}
