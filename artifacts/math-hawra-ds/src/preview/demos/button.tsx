import { Check, Loader2, Mail, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Row } from '../parts';

export function ButtonDemo() {
  return (
    <div className="space-y-6 rounded-2xl border bg-card/80 p-6 text-card-foreground shadow-lg">
      <Row label="إجراءات المعلمة">
        <Button><Sparkles /> إنشاء نشاط</Button>
        <Button variant="outline">تعديل النشاط</Button>
        <Button variant="ghost">إلغاء</Button>
        <Button variant="destructive">حذف</Button>
      </Row>
      <Row label="إجراءات الطالبة">
        <Button variant="secondary" size="lg"><Check /> حفظ الإجابة</Button>
        <Button variant="secondary">التالي</Button>
        <Button size="icon" aria-label="إرسال">
          <Mail />
        </Button>
      </Row>
      <Row label="الحالات">
        <Button disabled>غير متاح</Button>
        <Button disabled>
          <Loader2 className="animate-spin" /> جارٍ الحفظ
        </Button>
      </Row>
    </div>
  );
}
