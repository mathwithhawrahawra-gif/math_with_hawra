import { Input } from '../../components/ui/input';
import { Stack } from '../parts';

export function InputDemo() {
  return (
    <div className="max-w-md space-y-6 rounded-2xl border bg-card/80 p-6 shadow-lg">
      <Stack label="حقول التطبيق">
        <Input placeholder="اكتبي اسم الطالبة" />
        <Input type="email" placeholder="البريد الإلكتروني" />
        <Input type="file" />
      </Stack>
      <Stack label="رمز النشاط">
        <Input className="text-center font-black tracking-[0.35em]" value="HWR123" readOnly dir="ltr" />
      </Stack>
      <Stack label="الحالات">
        <Input defaultValue="إجابة محفوظة" readOnly />
        <Input placeholder="غير متاح" disabled />
        <Input placeholder="تحققي من الإجابة" aria-invalid="true" />
      </Stack>
    </div>
  );
}
