import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';

const CORE_SWATCHES = [
  { name: 'Primary · وردي Hawra', className: 'bg-primary' },
  { name: 'Secondary · أصفر شمس', className: 'bg-secondary' },
  { name: 'Accent · بنفسجي مرح', className: 'bg-accent' },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Background · خلفية', className: 'border bg-background' },
  { name: 'Foreground · نص', className: 'bg-foreground' },
  { name: 'Muted · هادئ', className: 'bg-muted' },
  { name: 'Destructive · خطأ', className: 'bg-destructive' },
  { name: 'Border · حدود', className: 'bg-border' },
] as const;

const TYPE_SCALE = [
  { label: 'عنوان رئيسي', className: 'text-4xl font-black' },
  { label: 'عنوان', className: 'text-2xl font-bold' },
  { label: 'نص أساسي', className: 'text-base' },
  { label: 'تسمية', className: 'text-sm font-bold' },
  { label: 'وصف', className: 'text-sm text-muted-foreground' },
] as const;

const SPACING_SCALE = [
  { label: '4', className: 'w-4' },
  { label: '8', className: 'w-8' },
  { label: '12', className: 'w-12' },
  { label: '16', className: 'w-16' },
  { label: '24', className: 'w-24' },
] as const;

function Swatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-lg ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-white/80 to-secondary/25 p-6 text-card-foreground shadow-lg dark:from-primary/20 dark:via-card dark:to-secondary/15">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <img src="/math-hawra-ds/logo.png" alt="شعار Math With Hawra" className="h-20 w-20 rounded-2xl object-contain shadow-md" />
          <div>
            <p className="text-sm font-bold text-primary">نظام تصميم مستخرج من المنتج</p>
            <h2 className="mt-1 text-3xl font-black">نتعلم الرياضيات بفرح</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">هوية دافئة، واضحة، ومناسبة للمعلمة والطالبة — مع مكونات قابلة لإعادة الاستخدام.</p>
          </div>
          <Sparkles className="absolute -left-2 -top-2 h-20 w-20 text-secondary/60" aria-hidden="true" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-lg backdrop-blur-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          الألوان الأساسية
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-lg backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            الخط والنبرة
          </h2>
          <div className="mt-4 space-y-3">
            {TYPE_SCALE.map((entry) => (
              <p key={entry.label} className={entry.className}>
                {entry.label}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-lg backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            مثال مركب
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>نشاط جديد</CardTitle>
              <CardDescription>
                مكونات مبنية من الرموز المستخرجة من التطبيق.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">اسم النشاط</Label>
                <Input id="overview-name" placeholder="اكتبي اسم النشاط" />
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked id="overview-notify" />
                <Label htmlFor="overview-notify">إظهار النتيجة للطالبة</Label>
                <Badge className="mr-auto">مفعّل</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>حفظ النشاط</Button>
              <Button variant="outline">إلغاء</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-lg backdrop-blur-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          حالات واضحة
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-green-500 text-white"><CheckCircle2 className="ml-1 h-3.5 w-3.5" />مكتمل</Badge>
          <Badge variant="secondary">قيد المراجعة</Badge>
          <Badge variant="destructive"><CircleAlert className="ml-1 h-3.5 w-3.5" />يحتاج انتباه</Badge>
        </div>
      </section>
    </div>
  );
}

export function BrandPage() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-secondary/25 p-6 shadow-lg">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
          <img src="/math-hawra-ds/logo.png" alt="شعار Math With Hawra" className="h-28 w-28 rounded-3xl object-contain shadow-lg" />
          <div>
            <p className="text-sm font-bold text-primary">Math With Hawra</p>
            <h2 className="mt-1 text-3xl font-black">الرياضيات تصبح أسهل مع الفرح</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">لغة بصرية طفولية دون أن تكون صاخبة: وردي للثقة، أصفر للطاقة، ومساحات زجاجية تجعل المحتوى هو البطل.</p>
          </div>
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['وردي Hawra', 'الإجراء الرئيسي، العناوين، وروح العلامة.', 'bg-primary'],
          ['أصفر شمس', 'رحلة الطالبة، التقدم، والتشجيع.', 'bg-secondary'],
          ['زجاج دافئ', 'تجميع المحتوى مع شفافية وعمق خفيف.', 'bg-card/80'],
        ].map(([title, description, swatch]) => (
          <Card key={title} className="overflow-hidden">
            <div className={`h-3 ${swatch} ${swatch === 'bg-card/80' ? 'border-b' : ''}`} />
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <section className="rounded-2xl border bg-card/80 p-6 shadow-lg">
        <h2 className="font-bold">قواعد الاستخدام</h2>
        <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• حافظي على RTL في المحتوى والتنقل.</li>
          <li>• استخدمي الألوان مع نص أو أيقونة، وليس اللون وحده.</li>
          <li>• اجعلي الأزرار مستديرة وواضحة وقابلة للمس.</li>
          <li>• اتركي مساحة بيضاء كافية حول السؤال والإجابة.</li>
        </ul>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Brand colors</h2>
          <p className="text-sm text-muted-foreground">
            The core roles used for emphasis, supporting actions, and accents.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Semantic and surface colors</h2>
          <p className="text-sm text-muted-foreground">
            Roles for text, backgrounds, borders, muted content, and danger.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SUPPORTING_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Font family
        </h2>
        <p className="mt-4 text-4xl font-bold">The quick brown fox</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The token font family is applied across this entire preview.
        </p>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Type scale
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[88px_1fr]">
            <span className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Build products people understand.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Spacing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The spacing scale, derived from the base spacing token.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-8 text-xs text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Corner treatments derive from the base radius token.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small', className: 'rounded-sm' },
            { label: 'Medium', className: 'rounded-md' },
            { label: 'Large', className: 'rounded-lg' },
            { label: 'Extra large', className: 'rounded-xl' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-24 items-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="text-xs font-medium">{radius.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
