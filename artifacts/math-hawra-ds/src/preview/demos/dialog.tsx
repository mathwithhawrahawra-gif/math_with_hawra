import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

export function DialogDemo() {
  return (
    <div className="rounded-2xl border bg-card/80 p-6 shadow-lg">
      <Dialog>
        <DialogTrigger asChild>
          <Button>عرض حل الطالبة</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حل سارة · السؤال ٣</DialogTitle>
            <DialogDescription>
              نافذة حل كاملة مع إبقاء الرأس والفوتر ثابتين أثناء التمرير.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-52 space-y-3 overflow-y-auto rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="font-bold">السؤال: أوجدي ناتج ٣/٤ + ١/٤</p>
            <p><span className="font-bold text-primary">إجابة الطالبة:</span> ١</p>
            <p><span className="font-bold text-accent">الإجابة النموذجية:</span> ١</p>
            <p className="text-muted-foreground">يظهر هذا النمط الإجابة والخيارات والدرجة في مساحة قابلة للتمرير على الهاتف.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إغلاق</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>حفظ الدرجة</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
