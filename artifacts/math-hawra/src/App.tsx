import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  useGetMe, useLoginTeacher, useRegisterTeacher, useLogoutTeacher,
  useGetDashboard, useListQuizzes, useCreateQuiz, useUpdateQuiz, useDeleteQuiz, useGetQuiz,
  useGetQuizByCode, useSubmitQuiz, useGetQuizSubmissions, useGradeAnswer, useDeleteQuizSubmissions,
  getGetMeQueryKey, getListQuizzesQueryKey, getGetDashboardQueryKey, getGetQuizSubmissionsQueryKey,
  getGetQuizQueryKey,
} from "@workspace/api-client-react";
import type { Submission } from "@workspace/api-client-react";
import { Badge } from "@workspace/math-hawra-ds/components/ui/badge";
import { Button } from "@workspace/math-hawra-ds/components/ui/button";
import { Card } from "@workspace/math-hawra-ds/components/ui/card";
import { Checkbox } from "@workspace/math-hawra-ds/components/ui/checkbox";
import { ResultsList } from "@workspace/math-hawra-ds/components/results-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/math-hawra-ds/components/ui/dialog";
import { Input } from "@workspace/math-hawra-ds/components/ui/input";
import { Textarea } from "@workspace/math-hawra-ds/components/ui/textarea";
import { Toaster } from "@workspace/math-hawra-ds/components/ui/toaster";
import { useToast as useDesignSystemToast } from "@workspace/math-hawra-ds/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 1;
      },
      retryDelay: 0,
    },
  },
});

function useToast() {
  const { toast } = useDesignSystemToast();
  return React.useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    toast({
      title: message,
      variant: type === "error" ? "destructive" : "default",
      className: type === "warning" ? "border-yellow-400 bg-yellow-50 text-yellow-800" : undefined,
    });
  }, [toast]);
}

function BackgroundStars() {
  const [stars] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 2}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 5}s`,
    }))
  );
  return (
    <>
      {stars.map((s) => (
        <div key={s.id} className="star" style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDuration: s.duration, animationDelay: s.delay }} />
      ))}
    </>
  );
}

function ImageUploader({ value, onChange }: { value?: string | null; onChange: (v: string | null) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="mb-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="w-28 h-28 object-cover rounded-xl border-2 border-pink-200" />
          <Button type="button" variant="destructive" size="icon" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-6 h-6 min-h-0 p-0 text-xs shadow">
            <i className="fas fa-times"></i>
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-pink-300 rounded-xl cursor-pointer hover:bg-pink-50 transition-colors">
          <i className="fas fa-image text-2xl text-pink-300 mb-1"></i>
          <span className="text-xs text-pink-500 font-bold">أضف صورة</span>
          <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}

type NavFn = (view: string, params?: Record<string, unknown>) => void;

function MainApp() {
  const [view, setView] = useState("home");
  const [viewParams, setViewParams] = useState<Record<string, unknown>>({});
  const { data: teacher, isLoading } = useGetMe();
  const showToast = useToast();

  useEffect(() => {
    const sharedCode = new URLSearchParams(window.location.search).get("quiz")?.trim().toUpperCase();
    if (sharedCode && /^[A-Z0-9]{6}$/.test(sharedCode)) {
      setView("student-join");
      setViewParams({ code: sharedCode });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (teacher && (view === "home" || view === "login" || view === "register")) {
      setView("dashboard");
    }
  }, [teacher, view]);

  const navigate: NavFn = (newView, params = {}) => {
    setView(newView);
    setViewParams(params);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-2xl font-bold text-pink-500"><i className="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...</div>
      </div>
    );
  }

  return (
    <>
      <BackgroundStars />
      <div className="relative z-10 p-4 sm:p-8 min-h-screen">
        {view === "home" && <HomeView onNavigate={navigate} />}
        {view === "login" && <LoginView onNavigate={navigate} showToast={showToast} />}
        {view === "register" && <RegisterView onNavigate={navigate} showToast={showToast} />}
        {view === "dashboard" && <DashboardView onNavigate={navigate} />}
        {view === "create-quiz" && <QuizEditorView onNavigate={navigate} showToast={showToast} />}
        {view === "edit-quiz" && <QuizEditorView onNavigate={navigate} showToast={showToast} quizId={viewParams.id as number} />}
        {view === "quizzes" && <QuizzesListView onNavigate={navigate} showToast={showToast} />}
        {view === "results" && <ResultsView onNavigate={navigate} showToast={showToast} />}
        {view === "grade" && <GradeView onNavigate={navigate} showToast={showToast} />}
        {view === "student-join" && <StudentJoinView onNavigate={navigate} showToast={showToast} initialCode={viewParams.code as string | undefined} />}
        {view === "student-quiz" && (
          <StudentQuizView
            onNavigate={navigate}
            showToast={showToast}
            quizCode={viewParams.code as string}
            studentName={viewParams.name as string}
          />
        )}
        {view === "student-result" && <StudentResultView onNavigate={navigate} result={viewParams.result as Record<string, unknown>} />}
      </div>
    </>
  );
}

function HomeView({ onNavigate }: { onNavigate: NavFn }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <img src="/logo.png" alt="Math With Hawra" className="w-40 h-40 object-contain mb-6 rounded-2xl shadow-md" />
      <h1 className="text-4xl font-black text-pink-500 mb-12 drop-shadow-sm">Math With Hawra</h1>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("login")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onNavigate("login"); }}
          className="flex-1 p-12 flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer group"
        >
          <i className="fas fa-chalkboard-user text-6xl text-pink-400 mb-4 group-hover:text-pink-500 transition-colors"></i>
          <h2 className="text-2xl font-bold text-gray-800">أنا المعلمة</h2>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("student-join")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onNavigate("student-join"); }}
          className="flex-1 p-12 flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer group bg-yellow-50/80 border-yellow-200"
        >
          <i className="fas fa-user-graduate text-6xl text-yellow-400 mb-4 group-hover:text-yellow-500 transition-colors"></i>
          <h2 className="text-2xl font-bold text-gray-800">أنا الطالبة</h2>
        </Card>
      </div>
    </div>
  );
}

function LoginView({ onNavigate, showToast }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLoginTeacher();
  const qc = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } }, {
      onSuccess: () => {
        showToast("تم تسجيل الدخول بنجاح");
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        onNavigate("dashboard");
      },
      onError: () => showToast("بيانات الدخول غير صحيحة", "error"),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-pink-500 mb-6">تسجيل الدخول</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-bold mb-2">البريد الإلكتروني</label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="border-pink-200 focus-visible:border-pink-400" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">كلمة المرور</label>
            <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="border-pink-200 focus-visible:border-pink-400" />
          </div>
          <Button type="submit" disabled={login.isPending} className="w-full mt-4" size="lg">
            {login.isPending ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Button type="button" variant="link" size="sm" onClick={() => onNavigate("register")}>ليس لديك حساب؟ إنشاء حساب جديد</Button>
        </div>
        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("home")} className="text-gray-500">العودة للرئيسية</Button>
        </div>
      </Card>
    </div>
  );
}

function RegisterView({ onNavigate, showToast }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const register = useRegisterTeacher();
  const qc = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { showToast("كلمتا المرور غير متطابقتين", "error"); return; }
    register.mutate({ data: { name, email, password } }, {
      onSuccess: () => {
        showToast("تم إنشاء الحساب بنجاح");
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        onNavigate("dashboard");
      },
      onError: () => showToast("حدث خطأ أثناء إنشاء الحساب", "error"),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-pink-500 mb-6">حساب معلمة جديد</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {[
            { label: "الاسم", value: name, set: setName, type: "text" },
            { label: "البريد الإلكتروني", value: email, set: setEmail, type: "email" },
            { label: "كلمة المرور", value: password, set: setPassword, type: "password" },
            { label: "تأكيد كلمة المرور", value: confirm, set: setConfirm, type: "password" },
          ].map(({ label, value, set, type }) => (
            <div key={label}>
              <label className="block text-gray-700 font-bold mb-2">{label}</label>
              <Input type={type} required value={value} onChange={e => set(e.target.value)} className="border-pink-200 focus-visible:border-pink-400" />
            </div>
          ))}
          <Button type="submit" disabled={register.isPending} className="w-full mt-4" size="lg">
            {register.isPending ? "جاري التسجيل..." : "إنشاء حساب"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("login")} className="text-gray-500">العودة لتسجيل الدخول</Button>
        </div>
      </Card>
    </div>
  );
}

function DashboardView({ onNavigate }: { onNavigate: NavFn }) {
  const { data: stats } = useGetDashboard();
  const logout = useLogoutTeacher();
  const qc = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        // Clear the cached teacher immediately; otherwise MainApp sees the old
        // teacher for one render and redirects back to the dashboard.
        qc.setQueryData(getGetMeQueryKey(), null);
        qc.removeQueries({ queryKey: getGetDashboardQueryKey(), exact: true });
        qc.removeQueries({ queryKey: getListQuizzesQueryKey(), exact: true });
        onNavigate("home");
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="flex flex-col sm:flex-row justify-between items-center mb-8 p-4 sm:px-8 gap-4">
        <h1 className="text-2xl font-bold text-pink-500">لوحة تحكم المعلمة</h1>
        <Button type="button" variant="outline" onClick={handleLogout} disabled={logout.isPending} className="bg-gray-100 text-gray-800">
          {logout.isPending ? "جاري تسجيل الخروج..." : "تسجيل خروج"} <i className={`fas ${logout.isPending ? "fa-spinner fa-spin" : "fa-sign-out-alt"}`}></i>
        </Button>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: "fa-file-alt", color: "pink", label: "إجمالي الأنشطة", value: stats?.totalQuizzes || 0 },
          { icon: "fa-users", color: "yellow", label: "إجمالي الطالبات", value: stats?.totalStudents || 0 },
          { icon: "fa-chart-line", color: "green", label: "متوسط الدرجات", value: `${Math.round(stats?.averageScore || 0)}%` },
          { icon: "fa-clock", color: "red", label: "بانتظار التصحيح", value: stats?.pendingCount || 0 },
        ].map(({ icon, color, label, value }) => (
          <Card key={label} className="p-6 flex flex-col items-center justify-center text-center">
            <div className={`w-14 h-14 bg-${color}-100 text-${color}-500 rounded-full flex items-center justify-center text-2xl mb-3`}><i className={`fas ${icon}`}></i></div>
            <h3 className="text-gray-500 font-bold mb-1 text-sm">{label}</h3>
            <p className="text-3xl font-black text-gray-800">{value}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">الإجراءات السريعة</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { view: "create-quiz", icon: "fa-plus", color: "bg-pink-400", bg: "hover:bg-pink-50", title: "إنشاء نشاط جديد", sub: "أضف أسئلة جديدة للطالبات" },
          { view: "quizzes", icon: "fa-list", color: "bg-yellow-400", bg: "hover:bg-yellow-50", title: "استعراض الأنشطة", sub: "تعديل ومشاركة الأنشطة السابقة" },
          { view: "results", icon: "fa-chart-bar", color: "bg-blue-400", bg: "hover:bg-blue-50", title: "النتائج والإحصائيات", sub: "متابعة درجات وأداء الطالبات" },
          { view: "grade", icon: "fa-check-double", color: "bg-purple-400", bg: "hover:bg-purple-50", title: "تصحيح الأنشطة", sub: "تصحيح الأسئلة المقالية", badge: stats?.pendingCount },
        ].map(({ view, icon, color, bg, title, sub, badge }) => (
          <Card key={view} role="button" tabIndex={0} onClick={() => onNavigate(view)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onNavigate(view); }} className={`p-6 flex items-center gap-4 ${bg} transition-colors text-right group cursor-pointer`}>
            <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform relative shrink-0`}>
              <i className={`fas ${icon}`}></i>
              {badge ? <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{badge}</span> : null}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
              <p className="text-gray-500">{sub}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuizzesListView({ onNavigate, showToast }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const { data: quizzes, isLoading } = useListQuizzes();
  const deleteQuiz = useDeleteQuiz();
  const qc = useQueryClient();
  const [shareQuiz, setShareQuiz] = useState<{ code: string; imageUrl?: string | null; title: string } | null>(null);
  const shareUrl = shareQuiz ? `${window.location.origin}/api/quizzes/share/${shareQuiz.code}` : "";

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا النشاط؟")) return;
    deleteQuiz.mutate({ id }, {
      onSuccess: () => {
        showToast("تم الحذف بنجاح");
        qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="flex justify-between items-center mb-8 p-4">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => onNavigate("dashboard")} className="text-gray-500 hover:text-pink-500 text-xl"><i className="fas fa-arrow-right"></i></Button>
          <h1 className="text-2xl font-bold text-pink-500">استعراض الأنشطة</h1>
        </div>
        <Button type="button" onClick={() => onNavigate("create-quiz")}>
          نشاط جديد <i className="fas fa-plus"></i>
        </Button>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-xl text-pink-500 font-bold"><i className="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!quizzes || quizzes.length === 0) && (
            <Card className="col-span-full text-center py-16">
              <i className="fas fa-folder-open text-6xl text-gray-200 mb-4 block"></i>
              <h3 className="text-xl font-bold text-gray-500">لا توجد أنشطة بعد</h3>
              <Button type="button" onClick={() => onNavigate("create-quiz")} className="mt-6">إنشاء نشاط</Button>
            </Card>
          )}
          {quizzes?.map(quiz => (
            <Card key={quiz.id} className="p-6 flex flex-col relative overflow-hidden group">
              {quiz.imageUrl && <div className="absolute top-0 right-0 left-0 h-24 opacity-20 bg-cover bg-center z-0" style={{ backgroundImage: `url(${quiz.imageUrl})` }}></div>}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{quiz.title}</h3>
                </div>
                {quiz.description && <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{quiz.description}</p>}
                <div className="flex gap-3 mb-4 text-sm text-gray-500 font-bold bg-gray-50/50 p-2 rounded-xl">
                    <Badge variant="outline"><i className="fas fa-question-circle text-pink-400 ml-1"></i>{quiz.questionCount} أسئلة</Badge>
                    <Badge variant="outline"><i className="fas fa-users text-blue-400 ml-1"></i>{quiz.submissionCount} مشاركة</Badge>
                    {quiz.pendingCount > 0 && <Badge variant="destructive"><i className="fas fa-exclamation-circle ml-1"></i>{quiz.pendingCount} للتصحيح</Badge>}
                </div>
                <div className="mt-auto flex justify-between gap-2">
                  <Button type="button" onClick={() => setShareQuiz({ code: quiz.shareCode, imageUrl: quiz.imageUrl, title: quiz.title })} className="flex-1 bg-green-500 text-white text-sm">
                    <i className="fas fa-share-alt"></i> مشاركة
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => onNavigate("edit-quiz", { id: quiz.id })} className="flex-1 text-sm">
                    <i className="fas fa-edit"></i> تعديل
                  </Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(quiz.id)} className="w-10">
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!shareQuiz} onOpenChange={open => { if (!open) setShareQuiz(null); }}>
        {shareQuiz && <DialogContent className="p-0 overflow-hidden max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>مشاركة النشاط</DialogTitle>
            <DialogDescription>رابط ورمز الدخول إلى النشاط</DialogDescription>
          </DialogHeader>
            <div className="relative h-36 bg-gradient-to-br from-pink-300 to-yellow-200 flex items-center justify-center overflow-hidden">
              {shareQuiz.imageUrl
                ? <img src={shareQuiz.imageUrl} alt="غلاف النشاط" className="absolute inset-0 w-full h-full object-cover" />
                : <img src="/logo.png" alt="logo" className="w-24 h-24 object-contain rounded-2xl shadow-lg" />
              }
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-3 right-3 left-3 z-10">
                <p className="text-white font-black text-base drop-shadow-md line-clamp-1">{shareQuiz.title}</p>
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-3 font-bold">رمز الدخول للنشاط</p>
              <div className="text-5xl font-black text-pink-500 tracking-[0.3em] mb-5 bg-pink-50 py-4 rounded-2xl border-2 border-pink-200 select-all">{shareQuiz.code}</div>

              <div className="bg-gray-50 rounded-2xl p-3 mb-5 text-right">
                <p className="text-xs text-gray-400 mb-1 font-bold">رابط النشاط المباشر:</p>
                <p className="text-xs text-pink-500 font-black break-all" dir="ltr">{shareUrl}</p>
              </div>

               <div className="flex gap-3 justify-center">
                 <Button
                   type="button"
                   variant="outline"
                  onClick={() => { navigator.clipboard.writeText(`${shareUrl}\nرمز النشاط: ${shareQuiz.code}`); showToast("تم نسخ رابط النشاط والرمز"); }}
                   className="flex-1 bg-gray-100 text-gray-700 text-sm"
                >
                  <i className="fas fa-copy"></i> نسخ
                 </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`📚 *${shareQuiz.title}*\n\nأهلاً طالباتي! 🌟\nاضغطي على الرابط لبدء النشاط مباشرة:\n${shareUrl}\n\nرمز النشاط الاحتياطي: *${shareQuiz.code}*`)}`}
                  target="_blank" rel="noreferrer"
                   className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white text-sm font-bold"
                >
                  <i className="fab fa-whatsapp text-base"></i> واتساب
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`📚 ${shareQuiz.title}\n\nاضغطي على الرابط لبدء النشاط مباشرة\nرمز النشاط الاحتياطي: ${shareQuiz.code}`)}`}
                  target="_blank" rel="noreferrer"
                   className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#0088cc] text-white text-sm font-bold"
                >
                  <i className="fab fa-telegram-plane text-base"></i> تيليغرام
                </a>
              </div>
            </div>
        </DialogContent>}
       </Dialog>
    </div>
  );
}

type QuestionDraft = {
  id?: number;
  type: "multiple" | "essay";
  questionText: string;
  imageUrl: string | null;
  points: number;
  timeLimitSeconds: number | null;
  correctAnswerIndex: number | null;
  modelAnswer: string | null;
  options: { text: string; imageUrl: string | null }[];
};

function QuizEditorView({ onNavigate, showToast, quizId }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void; quizId?: number }) {
  const isEdit = !!quizId;
  const { data: existing, isLoading: loadingExisting } = useGetQuiz(quizId!, { query: { enabled: isEdit, queryKey: getGetQuizQueryKey(quizId!) } });
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isEdit && existing && !loaded) {
      setTitle(existing.title);
      setDescription(existing.description || "");
      setTimeLimitMinutes(existing.timeLimitMinutes);
      setImageUrl(existing.imageUrl || null);
      setQuestions(existing.questions.map(q => ({
        id: q.id,
        type: q.type as "multiple" | "essay",
        questionText: q.questionText,
        imageUrl: q.imageUrl || null,
        points: q.points,
        timeLimitSeconds: q.timeLimitSeconds || null,
        correctAnswerIndex: q.correctAnswerIndex ?? null,
        modelAnswer: q.modelAnswer || null,
        options: q.options.map(o => ({ text: o.text, imageUrl: o.imageUrl || null })),
      })));
      setLoaded(true);
    }
    if (!isEdit && !loaded) { setLoaded(true); }
  }, [existing, isEdit, loaded]);

  const addQuestion = (type: "multiple" | "essay") => {
    setQuestions(prev => [...prev, {
      type,
      questionText: "",
      imageUrl: null,
      points: 10,
      timeLimitSeconds: null,
      correctAnswerIndex: null,
      modelAnswer: null,
      options: type === "multiple" ? [{ text: "", imageUrl: null }, { text: "", imageUrl: null }, { text: "", imageUrl: null }, { text: "", imageUrl: null }] : [],
    }]);
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionDraft>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const newArr = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= newArr.length) return;
    [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
    setQuestions(newArr);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { showToast("يرجى إدخال عنوان النشاط", "error"); return; }
    if (questions.length === 0) { showToast("يرجى إضافة سؤال واحد على الأقل", "error"); return; }

    for (const [i, q] of questions.entries()) {
      if (!q.questionText.trim()) { showToast(`السؤال ${i + 1}: يرجى إدخال نص السؤال`, "error"); return; }
      if (q.type === "multiple") {
        const filledOptions = q.options.filter(o => o.text.trim());
        if (filledOptions.length < 2) { showToast(`السؤال ${i + 1}: يرجى إضافة خيارين على الأقل`, "error"); return; }
        if (q.correctAnswerIndex === null) { showToast(`السؤال ${i + 1}: يرجى تحديد الإجابة الصحيحة`, "error"); return; }
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      timeLimitMinutes: 60,
      imageUrl: imageUrl || null,
      questions: questions.map((q, i) => ({
        type: q.type,
        questionText: q.questionText.trim(),
        imageUrl: q.imageUrl || null,
        points: q.points,
        timeLimitSeconds: q.timeLimitSeconds || null,
        correctAnswerIndex: q.type === "multiple" ? q.correctAnswerIndex : null,
        modelAnswer: q.modelAnswer?.trim() || null,
        options: q.type === "multiple" ? q.options.filter(o => o.text.trim()).map((o, oi) => ({ text: o.text.trim(), imageUrl: o.imageUrl || null, order: oi })) : [],
        order: i,
      })),
    };

    if (isEdit && quizId) {
      updateQuiz.mutate({ id: quizId, data: payload }, {
        onSuccess: () => {
          showToast("تم تحديث النشاط بنجاح");
          qc.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
          qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
          onNavigate("quizzes");
        },
        onError: () => showToast("حدث خطأ أثناء التحديث", "error"),
      });
    } else {
      createQuiz.mutate({ data: payload }, {
        onSuccess: () => {
          showToast("تم إنشاء النشاط بنجاح");
          qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          onNavigate("quizzes");
        },
        onError: () => showToast("حدث خطأ أثناء الإنشاء", "error"),
      });
    }
  };

  const isPending = createQuiz.isPending || updateQuiz.isPending;

  if (isEdit && loadingExisting) {
    return <div className="text-center py-20 text-xl text-pink-500 font-bold"><i className="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="flex items-center gap-4 mb-8 p-4">
        <Button type="button" variant="ghost" size="icon" onClick={() => onNavigate("quizzes")} className="text-gray-500 hover:text-pink-500 text-xl"><i className="fas fa-arrow-right"></i></Button>
        <h1 className="text-2xl font-bold text-pink-500">{isEdit ? "تعديل النشاط" : "إنشاء نشاط جديد"}</h1>
      </Card>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">معلومات النشاط</h2>
          <div>
            <label className="block text-gray-700 font-bold mb-2">عنوان النشاط <span className="text-red-500">*</span></label>
            <Input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="border-pink-200 focus-visible:border-pink-400" placeholder="مثال: اختبار الجمع والطرح" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">وصف النشاط (اختياري)</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="border-pink-200 focus-visible:border-pink-400 resize-none" rows={2} placeholder="وصف مختصر للنشاط" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">صورة النشاط (اختياري)</label>
            <ImageUploader value={imageUrl} onChange={setImageUrl} />
          </div>
        </Card>

        {questions.map((q, idx) => (
          <Card key={idx} className={`p-6 border-r-4 ${q.type === "essay" ? "border-purple-400" : "border-pink-400"}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-black flex items-center justify-center text-sm">{idx + 1}</span>
                <Badge variant={q.type === "essay" ? "outline" : "default"} className={q.type === "essay" ? "bg-purple-100 text-purple-600" : undefined}>
                  {q.type === "multiple" ? "اختيار من متعدد" : "مقالي"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="w-8 h-8 bg-gray-100 text-gray-500"><i className="fas fa-chevron-up text-xs"></i></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="w-8 h-8 bg-gray-100 text-gray-500"><i className="fas fa-chevron-down text-xs"></i></Button>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeQuestion(idx)} className="w-8 h-8 bg-red-100 text-red-500"><i className="fas fa-trash text-xs"></i></Button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-bold mb-1 text-sm">نص السؤال <span className="text-red-500">*</span></label>
              <Textarea value={q.questionText} onChange={e => updateQuestion(idx, { questionText: e.target.value })} className="border-gray-200 focus-visible:border-pink-400 resize-none" rows={2} placeholder="اكتبي السؤال هنا..." />
            </div>

            <div className="flex gap-4 mb-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-gray-700 font-bold mb-1 text-sm"><i className="fas fa-star text-yellow-400 ml-1"></i>النقاط</label>
                <Input type="number" min={1} max={100} value={q.points} onChange={e => updateQuestion(idx, { points: Number(e.target.value) })} className="border-yellow-200 focus-visible:border-yellow-400 text-sm" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-gray-700 font-bold mb-1 text-sm"><i className="fas fa-hourglass text-blue-400 ml-1"></i>وقت السؤال (ثانية، 0=بلا)</label>
                <Input type="number" min={0} max={600} value={q.timeLimitSeconds ?? 0} onChange={e => updateQuestion(idx, { timeLimitSeconds: Number(e.target.value) || null })} className="border-blue-200 focus-visible:border-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">صورة السؤال</label>
                <ImageUploader value={q.imageUrl} onChange={v => updateQuestion(idx, { imageUrl: v })} />
              </div>
            </div>

            {q.type === "multiple" && (
              <div className="mb-3">
                <label className="block text-gray-700 font-bold mb-2 text-sm">الخيارات (اضغطي على الخيار الصحيح)</label>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = q.correctAnswerIndex === oi;
                    const optionLetter = String.fromCharCode(65 + oi);

                    return (
                    <div
                      key={oi}
                      role="radio"
                      aria-checked={isCorrect}
                      tabIndex={0}
                      className={`flex min-h-14 items-center gap-2 rounded-xl border-2 p-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50 ${isCorrect ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => updateQuestion(idx, { correctAnswerIndex: oi })}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          updateQuestion(idx, { correctAnswerIndex: oi });
                        }
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "border-green-500 bg-green-500 text-white" : "border-gray-300 text-gray-600"}`}>
                        {isCorrect ? <i className="fas fa-check" aria-hidden="true"></i> : optionLetter}
                      </div>
                      <Input
                        type="text"
                        value={opt.text}
                        onChange={e => { e.stopPropagation(); const newOpts = [...q.options]; newOpts[oi] = { ...opt, text: e.target.value }; updateQuestion(idx, { options: newOpts }); }}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        className="h-10 min-w-0 flex-1 border-0 bg-transparent shadow-none text-sm font-bold focus-visible:ring-0"
                        placeholder={`الخيار ${optionLetter}`}
                      />
                      <span className={`flex shrink-0 items-center gap-1 text-[11px] font-bold sm:text-xs ${isCorrect ? "text-green-700" : "text-gray-500"}`}>
                        {isCorrect
                          ? <><i className="fas fa-check-circle" aria-hidden="true"></i><span>الإجابة الصحيحة</span></>
                          : <span>تحديد كإجابة صحيحة</span>}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {q.type === "essay" && (
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">نموذج الإجابة (للمعلمة)</label>
                <Textarea value={q.modelAnswer || ""} onChange={e => updateQuestion(idx, { modelAnswer: e.target.value })} className="border-purple-200 focus-visible:border-purple-400 resize-none text-sm" rows={2} placeholder="اكتبي نموذج الإجابة الصحيحة هنا (للاسترشاد فقط)..." />
              </div>
            )}
          </Card>
        ))}

        <Card className="p-4">
          <p className="text-gray-600 font-bold mb-3 text-center">إضافة سؤال جديد</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button type="button" variant="outline" onClick={() => addQuestion("multiple")} className="bg-pink-100 text-pink-700">
              <i className="fas fa-list-ul"></i> اختيار من متعدد
            </Button>
            <Button type="button" variant="outline" onClick={() => addQuestion("essay")} className="bg-purple-100 text-purple-700">
              <i className="fas fa-pencil-alt"></i> مقالي
            </Button>
          </div>
        </Card>

        <div className="flex gap-4 pb-8">
          <Button type="button" variant="outline" size="lg" onClick={() => onNavigate("quizzes")} className="flex-1 bg-gray-100 text-gray-700">إلغاء</Button>
          <Button type="submit" size="lg" disabled={isPending} className="flex-1 text-lg">
            {isPending ? <><i className="fas fa-spinner fa-spin ml-2"></i>جاري الحفظ...</> : <><i className="fas fa-save ml-2"></i>{isEdit ? "حفظ التعديلات" : "إنشاء النشاط"}</>}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ResultsView({ onNavigate, showToast }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const { data: quizzes, isLoading } = useListQuizzes();
  const [openQuizId, setOpenQuizId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const deleteSubmissions = useDeleteQuizSubmissions();
  const qc = useQueryClient();

  const toggle = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="flex items-center gap-4 mb-8 p-4">
        <Button type="button" variant="ghost" size="icon" onClick={() => onNavigate("dashboard")} className="text-gray-500 hover:text-pink-500 text-xl"><i className="fas fa-arrow-right"></i></Button>
        <h1 className="text-2xl font-bold text-pink-500">النتائج والإحصائيات</h1>
      </Card>

      {isLoading ? (
        <div className="text-center py-20 text-xl text-pink-500 font-bold"><i className="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...</div>
      ) : !quizzes?.length ? (
        <Card className="p-16 text-center"><i className="fas fa-chart-bar text-6xl text-gray-200 mb-4 block"></i><p className="text-gray-500 font-bold">لا توجد أنشطة بعد</p></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {quizzes.map(quiz => (
            <Card key={quiz.id} className="overflow-hidden">
              <Button type="button" variant="ghost" className="w-full h-auto p-5 flex justify-between items-center text-right whitespace-normal" onClick={() => setOpenQuizId(openQuizId === quiz.id ? null : quiz.id)}>
                <div className="flex items-center gap-3">
                  <i className={`fas fa-chevron-${openQuizId === quiz.id ? "up" : "down"} text-gray-400`}></i>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">{quiz.submissionCount} طالبة • {quiz.pendingCount > 0 ? <span className="text-red-500">{quiz.pendingCount} بانتظار التصحيح</span> : "مكتمل"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm font-bold">{quiz.submissionCount} مشاركة</div>
                </div>
              </Button>

              {openQuizId === quiz.id && (
                <QuizSubmissionsList quizId={quiz.id} selected={selected} toggle={toggle} showToast={showToast} onDelete={(ids) => {
                  if (!confirm(`حذف ${ids.length} نتيجة؟`)) return;
                  deleteSubmissions.mutate({ id: quiz.id, data: { submissionIds: ids } }, {
                    onSuccess: () => {
                      showToast("تم الحذف بنجاح");
                      setSelected(new Set());
                      qc.invalidateQueries({ queryKey: getGetQuizSubmissionsQueryKey(quiz.id) });
                      qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
                    },
                  });
                }} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionDetailModal({ submission, onClose, showToast }: {
  submission: Submission;
  onClose: () => void;
  showToast: (m: string, t?: "success" | "error" | "warning") => void;
}) {
  const gradeAnswer = useGradeAnswer();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [gradeValues, setGradeValues] = useState<Record<number, string>>({});

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleGrade = (answerId: number, grade: number) => {
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
      showToast("أدخلي درجة بين 0 و100", "warning");
      return;
    }
    setSaving(prev => new Set([...prev, answerId]));
    gradeAnswer.mutate({ id: submission.id, answerId, data: { grade } }, {
      onSuccess: () => {
        showToast(`تم حفظ الدرجة: ${grade}/100`);
        setGradeValues(prev => ({ ...prev, [answerId]: String(grade) }));
        qc.invalidateQueries({ queryKey: getGetQuizSubmissionsQueryKey(submission.quizId) });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        setSaving(prev => { const n = new Set(prev); n.delete(answerId); return n; });
      },
      onError: () => {
        showToast("حدث خطأ", "error");
        setSaving(prev => { const n = new Set(prev); n.delete(answerId); return n; });
      },
    });
  };

  const answers = submission.answers || [];
  const essayCount = answers.filter(a => a.questionType === "essay").length;
  const pendingCount = answers.filter(a => a.status === "pending").length;
  const correctCount = answers.filter(a => a.isCorrect === true || a.grade === 100).length;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`حل الطالبة ${submission.studentName}`}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-2xl h-[calc(100dvh-1rem)] sm:h-[92dvh] max-h-[900px] min-h-0 flex flex-col rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
        onMouseDown={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
      >

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-l from-pink-500 to-pink-400 rounded-t-3xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <i className="fas fa-user text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black">{submission.studentName}</h3>
                <p className="text-pink-100 text-sm mt-0.5">{submission.quizTitle}</p>
              </div>
            </div>
             <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق الحل" className="w-9 h-9 bg-white/20 text-white text-lg">
              <i className="fas fa-times"></i>
             </Button>
          </div>

          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-pink-100 text-xs">النتيجة</p>
              <p className="font-black text-lg">{submission.score != null ? `${submission.score}%` : "—"}</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-pink-100 text-xs">النقاط</p>
              <p className="font-black text-lg">{submission.earnedPoints}/{submission.totalPoints}</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-pink-100 text-xs">صحيح</p>
              <p className="font-black text-lg">{correctCount}/{answers.length}</p>
            </div>
            {pendingCount > 0 && (
              <div className="flex-1 bg-yellow-400/40 rounded-2xl px-4 py-2 text-center border border-yellow-300/50">
                <p className="text-yellow-100 text-xs">معلق</p>
                <p className="font-black text-lg text-yellow-200">{pendingCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* Answers List */}
        <div
          className="relative flex-1 min-h-0 overflow-y-scroll overscroll-contain p-4 sm:p-5 flex flex-col gap-4 bg-gray-50/50"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", scrollbarGutter: "stable both-edges" }}
        >
          {answers.map((ans, idx) => {
            const isEssay = ans.questionType === "essay";
            const isPending = ans.status === "pending";
            const isBusy = saving.has(ans.id);
            const similarity = isEssay ? calcSimilarity(ans.answerText || "", ans.modelAnswer || "") : 0;
            const currentGrade = gradeValues[ans.id] ?? (ans.grade == null ? "" : String(ans.grade));

            const statusColor = isPending
              ? "border-amber-300 bg-amber-50/50"
              : (ans.isCorrect || ans.grade === 100)
                ? "border-green-300 bg-green-50/30"
                : "border-red-300 bg-red-50/30";

            return (
              <div key={ans.id} className={`shrink-0 rounded-2xl border-2 overflow-hidden ${statusColor}`}>
                {/* Question header */}
                <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-inherit bg-white/60">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</span>
                    <p className="font-bold text-gray-800 text-sm leading-snug break-words min-w-0">{ans.questionText || "السؤال غير متوفر"}</p>
                  </div>
                  <div className="shrink-0">
                    {isPending ? (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⏳ بانتظار التصحيح</span>
                    ) : (ans.isCorrect || ans.grade === 100) ? (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">✓ صحيح</span>
                    ) : (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">✗ خطأ</span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {isEssay ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ans.modelAnswer && (
                          <div className="bg-green-50 rounded-xl border border-green-200 p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <i className="fas fa-book-open text-green-600 text-xs"></i>
                              <span className="text-xs font-black text-green-700">الإجابة النموذجية</span>
                            </div>
                            <p className="text-sm text-green-800 leading-relaxed">{ans.modelAnswer}</p>
                          </div>
                        )}
                        <div className="bg-white rounded-xl border border-gray-200 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <i className="fas fa-pen text-purple-500 text-xs"></i>
                            <span className="text-xs font-black text-purple-700">إجابة الطالبة</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{ans.answerText || <em className="text-gray-400 not-italic">لم تكتب إجابة</em>}</p>
                        </div>
                      </div>

                      {ans.modelAnswer && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${similarity >= 70 ? "bg-green-50 border-green-200 text-green-700" : similarity >= 40 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          <i className="fas fa-robot"></i>
                          <span>اقتراح التصحيح التلقائي:</span>
                          <span className="font-black">{similarity >= 70 ? "صحيح ✓" : similarity >= 40 ? "للمراجعة ⚠️" : "خطأ ✗"}</span>
                          <div className="mr-auto flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${similarity >= 70 ? "bg-green-500" : similarity >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${similarity}%` }}></div>
                            </div>
                            <span className="opacity-80">{similarity}%</span>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {ans.options?.map((opt, oi) => {
                        const isStudentChoice = ans.answerIndex === oi;
                        const bg = isStudentChoice
                          ? (ans.isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400")
                          : "bg-white border-gray-200";
                        return (
                          <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${bg}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isStudentChoice ? (ans.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white") : "bg-gray-100 text-gray-500"}`}>
                              {isStudentChoice ? (ans.isCorrect ? "✓" : "✗") : String.fromCharCode(0x0660 + oi)}
                            </span>
                            <span className={`flex-1 text-sm ${isStudentChoice ? "font-black text-gray-900" : "text-gray-600"}`}>{opt.text}</span>
                            {isStudentChoice && (
                              <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${ans.isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                {ans.isCorrect ? "اختيار صحيح ✓" : "اختيار خاطئ ✗"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {!ans.options?.length && (
                        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-500">
                          <span className="font-bold text-purple-700">اختيار الطالبة: </span>
                          {ans.answerIndex == null ? "لم تختر إجابة" : `الخيار رقم ${ans.answerIndex + 1}`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grade actions — available for every question type, including already graded answers */}
                  <div className="mt-4 border-t border-dashed border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-1">
                      <i className="fas fa-edit text-purple-500"></i>
                      تعديل درجة هذا السؤال من 100:
                    </p>
                    <div className="grid grid-cols-2 sm:flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        aria-label={`درجة السؤال ${idx + 1}`}
                        value={currentGrade}
                        onChange={e => setGradeValues(prev => ({ ...prev, [ans.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === "Enter" && currentGrade !== "") {
                            handleGrade(ans.id, Number(currentGrade));
                          }
                        }}
                        placeholder="مثال: 75"
                        className="col-span-2 sm:w-28 border-purple-200 text-center font-black text-gray-800 focus-visible:border-purple-400"
                      />
                      <Button
                        type="button"
                        onClick={() => handleGrade(ans.id, Number(currentGrade))}
                        disabled={isBusy || currentGrade === ""}
                        className="bg-purple-500 text-white text-sm shadow-sm"
                      >
                        {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        حفظ التعديل
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleGrade(ans.id, 100)}
                        disabled={isBusy}
                        variant="outline"
                        className="bg-green-100 text-green-700 text-sm"
                      >
                        100 صحيح
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleGrade(ans.id, 0)}
                        disabled={isBusy}
                        variant="outline"
                        className="bg-red-100 text-red-700 text-sm"
                      >
                        0 خطأ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-3xl flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
            <i className="fas fa-hand-pointer text-gray-300"></i>
            مرر للأسفل لرؤية المزيد
          </p>
           <Button
             type="button"
            onClick={onClose}
             className="text-sm"
          >
            إغلاق
           </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QuizSubmissionsList({ quizId, selected, toggle, onDelete, showToast }: {
  quizId: number;
  selected: Set<number>;
  toggle: (id: number) => void;
  onDelete: (ids: number[]) => void;
  showToast: (m: string, t?: "success" | "error" | "warning") => void;
}) {
  const { data: submissions, isLoading } = useGetQuizSubmissions(quizId);
  const [viewingSub, setViewingSub] = useState<number | null>(null);
  const selectedInThisQuiz = submissions?.filter(s => selected.has(s.id)).map(s => s.id) || [];
  const viewingSubmission = submissions?.find(s => s.id === viewingSub);

  if (isLoading) return <div className="p-6 text-center text-pink-500"><i className="fas fa-spinner fa-spin ml-2"></i>جاري التحميل...</div>;
  if (!submissions?.length) return <div className="p-6 text-center text-gray-400 font-bold">لا توجد مشاركات بعد</div>;

  return (
    <div className="border-t border-gray-100">
      {viewingSubmission && (
        <SubmissionDetailModal submission={viewingSubmission} onClose={() => setViewingSub(null)} showToast={showToast} />
      )}
      <ResultsList
        items={submissions.map(sub => ({
          id: sub.id,
          studentName: sub.studentName,
          score: sub.score ?? null,
          earnedPoints: sub.earnedPoints,
          totalPoints: sub.totalPoints,
          status: sub.hasPending ? "pending" : "complete",
        }))}
        selectedIds={selected}
        onToggle={id => toggle(Number(id))}
        onToggleAll={checked => {
          if (checked) submissions.forEach(s => !selected.has(s.id) && toggle(s.id));
          else submissions.forEach(s => selected.has(s.id) && toggle(s.id));
        }}
        onOpen={item => setViewingSub(Number(item.id))}
        onDeleteSelected={() => onDelete(selectedInThisQuiz)}
      />
    </div>
  );
}

function GradeView({ onNavigate, showToast }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const { data: quizzes, isLoading } = useListQuizzes();
  const pendingQuizzes = quizzes?.filter(q => q.pendingCount > 0) || [];
  const [openQuizId, setOpenQuizId] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="flex items-center gap-4 mb-8 p-4">
        <Button type="button" variant="ghost" size="icon" onClick={() => onNavigate("dashboard")} className="text-gray-500 hover:text-pink-500 text-xl"><i className="fas fa-arrow-right"></i></Button>
        <h1 className="text-2xl font-bold text-pink-500">تصحيح الأنشطة المقالية</h1>
      </Card>

      {isLoading ? (
        <div className="text-center py-20 text-xl text-pink-500 font-bold"><i className="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...</div>
      ) : pendingQuizzes.length === 0 ? (
        <Card className="p-16 text-center">
          <i className="fas fa-check-circle text-6xl text-green-300 mb-4 block"></i>
          <h3 className="text-xl font-bold text-gray-600">لا توجد أنشطة تنتظر التصحيح</h3>
          <p className="text-gray-400 mt-2">جميع الأنشطة تم تصحيحها</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingQuizzes.map(quiz => (
            <Card key={quiz.id} className="overflow-hidden">
              <Button type="button" variant="ghost" className="w-full h-auto p-5 flex justify-between items-center text-right whitespace-normal" onClick={() => setOpenQuizId(openQuizId === quiz.id ? null : quiz.id)}>
                <div className="flex items-center gap-3">
                  <i className={`fas fa-chevron-${openQuizId === quiz.id ? "up" : "down"} text-gray-400`}></i>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-red-500 font-bold">{quiz.pendingCount} إجابة بانتظار التصحيح</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 shrink-0">{quiz.pendingCount} معلق</Badge>
              </Button>
              {openQuizId === quiz.id && <GradeSubmissionsList quizId={quiz.id} showToast={showToast} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function calcSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^\u0600-\u06FF\w\s]/g, "").trim();
  const s1 = norm(text1); const s2 = norm(text2);
  if (s1 === s2) return 100;
  const w1 = s1.split(/\s+/); const w2 = s2.split(/\s+/);
  const common = w1.filter(w => w2.includes(w));
  return Math.round((common.length / Math.max(w1.length, w2.length)) * 100);
}

function GradeSubmissionsList({ quizId, showToast }: { quizId: number; showToast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const { data: submissions, isLoading } = useGetQuizSubmissions(quizId);
  const gradeAnswer = useGradeAnswer();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [autoGraded, setAutoGraded] = useState<Set<number>>(new Set());

  const pendingSubs = submissions?.filter(s => s.hasPending) || [];

  // Auto-grade essays with similarity >= 70%
  useEffect(() => {
    if (!submissions) return;
    for (const sub of submissions) {
      const pendingAnswers = sub.answers?.filter(a => a.status === "pending") || [];
      for (const ans of pendingAnswers) {
        if (!ans.modelAnswer || autoGraded.has(ans.id) || saving.has(ans.id)) continue;
        const sim = calcSimilarity(ans.answerText || "", ans.modelAnswer);
        if (sim >= 70) {
          setAutoGraded(prev => new Set([...prev, ans.id]));
          setSaving(prev => new Set([...prev, ans.id]));
          gradeAnswer.mutate({ id: sub.id, answerId: ans.id, data: { grade: 100 } }, {
            onSuccess: () => {
              showToast("🤖 تصحيح تلقائي: إجابة صحيحة");
              qc.invalidateQueries({ queryKey: getGetQuizSubmissionsQueryKey(quizId) });
              qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
              qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
              setSaving(prev => { const n = new Set(prev); n.delete(ans.id); return n; });
            },
            onError: () => {
              setSaving(prev => { const n = new Set(prev); n.delete(ans.id); return n; });
              setAutoGraded(prev => { const n = new Set(prev); n.delete(ans.id); return n; });
            },
          });
        }
      }
    }
  }, [submissions]);

  const handleGrade = (submissionId: number, answerId: number, isCorrect: boolean) => {
    setSaving(prev => new Set([...prev, answerId]));
    gradeAnswer.mutate({ id: submissionId, answerId, data: { grade: isCorrect ? 100 : 0 } }, {
      onSuccess: () => {
        showToast(isCorrect ? "✓ تم منح الدرجة كاملة" : "✗ تم خصم الدرجة");
        qc.invalidateQueries({ queryKey: getGetQuizSubmissionsQueryKey(quizId) });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        setSaving(prev => { const n = new Set(prev); n.delete(answerId); return n; });
      },
      onError: () => {
        showToast("حدث خطأ", "error");
        setSaving(prev => { const n = new Set(prev); n.delete(answerId); return n; });
      },
    });
  };

  if (isLoading) return <div className="p-6 text-center text-pink-500"><i className="fas fa-spinner fa-spin ml-2"></i>جاري التحميل...</div>;
  if (!pendingSubs.length) return <div className="p-6 text-center text-green-500 font-bold py-8">لا توجد إجابات معلقة</div>;

  return (
    <div className="border-t border-gray-100 divide-y divide-gray-100">
      {pendingSubs.map(sub => {
        const pendingAnswers = sub.answers?.filter(a => a.status === "pending") || [];
        if (!pendingAnswers.length) return null;
        return (
          <div key={sub.id} className="p-5">
            <h4 className="font-black text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-user-circle text-pink-400 text-lg"></i>
              <span>{sub.studentName}</span>
              <span className="text-sm text-gray-400 font-normal">— {pendingAnswers.length} سؤال للتصحيح</span>
            </h4>
            <div className="flex flex-col gap-5">
              {pendingAnswers.map(ans => {
                const similarity = calcSimilarity(ans.answerText || "", ans.modelAnswer || "");
                const autoLabel = similarity >= 70 ? "يُقترح: صحيح" : similarity >= 40 ? "يُقترح: مراجعة" : "يُقترح: خطأ";
                const autoBg = similarity >= 70 ? "bg-green-50 border-green-200 text-green-700" : similarity >= 40 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700";
                const isBusy = saving.has(ans.id);
                return (
                  <div key={ans.id} className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="font-bold text-gray-800 mb-3 text-base">{ans.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {ans.modelAnswer && (
                        <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                          <p className="text-xs font-bold text-green-700 mb-1"><i className="fas fa-book ml-1"></i>نموذج الإجابة:</p>
                          <p className="text-sm text-green-800 leading-relaxed">{ans.modelAnswer}</p>
                        </div>
                      )}
                      <div className="p-3 bg-white rounded-xl border border-purple-100">
                        <p className="text-xs font-bold text-purple-700 mb-1"><i className="fas fa-pencil-alt ml-1"></i>إجابة الطالبة:</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{ans.answerText || <em className="text-gray-400">لم تجب</em>}</p>
                      </div>
                    </div>

                    {ans.modelAnswer && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-4 text-sm font-bold ${autoBg}`}>
                        <i className="fas fa-robot"></i>
                        <span>نظام التصحيح التلقائي:</span>
                        <span className="font-black">{autoLabel}</span>
                        <span className="mr-auto bg-white/60 px-2 py-0.5 rounded-full text-xs">تشابه {similarity}%</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleGrade(sub.id, ans.id, true)}
                        disabled={isBusy}
                        className="flex-1 bg-green-500 text-white text-base shadow-sm whitespace-normal"
                      >
                        {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle text-lg"></i>}
                        صحيح — علامة كاملة
                      </Button>
                      <Button
                        onClick={() => handleGrade(sub.id, ans.id, false)}
                        disabled={isBusy}
                        variant="destructive"
                        className="flex-1 text-base shadow-sm whitespace-normal"
                      >
                        {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times-circle text-lg"></i>}
                        خطأ — بدون علامة
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StudentJoinView({ onNavigate, showToast, initialCode }: { onNavigate: NavFn; showToast: (m: string, t?: "success" | "error" | "warning") => void; initialCode?: string }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(initialCode || "");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast("يرجى إدخال اسمك", "error"); return; }
    if (code.length !== 6) { showToast("يرجى إدخال رمز مكون من 6 أحرف", "error"); return; }
    onNavigate("student-quiz", { name: name.trim(), code: code.toUpperCase() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md p-8 bg-yellow-50/90 border-yellow-200">
        <div className="text-center mb-6">
          <i className="fas fa-user-graduate text-5xl text-yellow-400 mb-3 block"></i>
          <h2 className="text-3xl font-bold text-yellow-600">دخول الطالبة</h2>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleJoin}>
          <div>
            <label className="block text-gray-700 font-bold mb-2">اسم الطالبة</label>
            <Input type="text" required value={name} onChange={e => setName(e.target.value)} className="border-yellow-200 focus-visible:border-yellow-400 text-center" placeholder="اكتبي اسمك هنا" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">رمز النشاط (6 أحرف)</label>
            <Input type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="border-yellow-200 focus-visible:border-yellow-400 text-center font-black tracking-widest text-2xl" dir="ltr" placeholder="XXXXXX" />
          </div>
          <Button type="submit" variant="secondary" size="lg" className="w-full mt-2 text-lg">
            ابدأ النشاط <i className="fas fa-play ml-2"></i>
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("home")} className="text-gray-500">العودة للرئيسية</Button>
        </div>
      </Card>
    </div>
  );
}

type QuizForStudent = Awaited<ReturnType<typeof import("@workspace/api-client-react").getQuizByCode>>;

function StudentQuizView({ onNavigate, showToast, quizCode, studentName }: {
  onNavigate: NavFn;
  showToast: (m: string, t?: "success" | "error" | "warning") => void;
  quizCode: string;
  studentName: string;
}) {
  const { data: quiz, isLoading, error } = useGetQuizByCode(quizCode);
  const submitQuiz = useSubmitQuiz();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerIndex?: number; answerText?: string }>>({});
  const [quizTimer, setQuizTimer] = useState<number | null>(null);
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (quiz) {
      if (quiz.timeLimitMinutes) setQuizTimer(quiz.timeLimitMinutes * 60);
    }
  }, [quiz]);

  useEffect(() => {
    if (quizTimer === null) return;
    if (quizTimer <= 0) { submitRef.current?.(); return; }
    const t = setTimeout(() => setQuizTimer(q => (q ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [quizTimer]);

  const currentQuestion = quiz?.questions?.[currentIdx];

  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.timeLimitSeconds) {
      setQuestionTimer(currentQuestion.timeLimitSeconds);
    } else {
      setQuestionTimer(null);
    }
  }, [currentIdx, currentQuestion?.id]);

  useEffect(() => {
    if (questionTimer === null) return;
    if (questionTimer <= 0) {
      if (currentIdx < (quiz?.questions?.length ?? 1) - 1) setCurrentIdx(i => i + 1);
      else submitRef.current?.();
      return;
    }
    const t = setTimeout(() => setQuestionTimer(q => (q ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [questionTimer, currentIdx]);

  const handleSubmit = () => {
    if (submitted || !quiz) return;
    setSubmitted(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const answersArr = quiz.questions.map(q => ({
      questionId: q.id,
      answerIndex: answers[q.id]?.answerIndex ?? null,
      answerText: answers[q.id]?.answerText ?? null,
    }));
    submitQuiz.mutate({ data: { quizId: quiz.id, studentName, timeSpentSeconds: timeSpent, answers: answersArr } }, {
      onSuccess: (result) => {
        onNavigate("student-result", { result: { ...result, quizTitle: quiz.title, studentName } });
      },
      onError: () => {
        showToast("حدث خطأ أثناء الإرسال", "error");
        setSubmitted(false);
      },
    });
  };

  submitRef.current = handleSubmit;

  if (isLoading) return <div className="text-center py-20 text-xl text-yellow-500 font-bold"><i className="fas fa-spinner fa-spin ml-2"></i> جاري تحميل النشاط...</div>;
  if (error || !quiz) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm p-8 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4 block"></i>
        <h3 className="text-xl font-bold text-gray-700 mb-2">رمز النشاط غير صحيح</h3>
        <Button type="button" variant="secondary" onClick={() => onNavigate("student-join")} className="mt-4">العودة</Button>
      </Card>
    </div>
  );

  const q = currentQuestion!;
  const total = quiz.questions.length;
  const progress = ((currentIdx + 1) / total) * 100;
  const questionDuration = q.timeLimitSeconds ?? 0;
  const questionTimeProgress = questionDuration > 0 && questionTimer !== null
    ? Math.max(0, Math.min(100, (questionTimer / questionDuration) * 100))
    : 0;
  const questionWarningThreshold = Math.min(10, Math.max(3, Math.ceil(questionDuration * 0.25)));
  const isQuestionTimeEnding = questionTimer !== null && questionTimer <= questionWarningThreshold;
  const remainingTimeLabel = questionTimer !== null
    ? questionTimer < 60
      ? `${questionTimer}ث`
      : `${Math.floor(questionTimer / 60)}د${questionTimer % 60 ? ` ${questionTimer % 60}ث` : ""}`
    : "";

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-4 mb-6 bg-yellow-50/90 border-yellow-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold text-yellow-600">{quiz.title}</h1>
            <p className="text-sm text-gray-600 font-bold">{studentName}</p>
          </div>
        </div>
        <div className="w-full bg-yellow-100 rounded-full h-2">
          <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-xs text-center text-gray-500 mt-1 font-bold">السؤال {currentIdx + 1} من {total}</p>
      </Card>

      <Card className="p-6 mb-6 min-h-[300px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-700 font-black flex items-center justify-center">{currentIdx + 1}</span>
          <Badge variant={q.type === "essay" ? "outline" : "default"} className={q.type === "essay" ? "bg-purple-100 text-purple-600" : undefined}>
            {q.type === "essay" ? "مقالي" : "اختيار من متعدد"}
          </Badge>
          <span className="text-xs text-gray-500 font-bold mr-auto">{q.points} نقطة</span>
        </div>
        {questionDuration > 0 && questionTimer !== null && (
          <div className={`mb-4 ${isQuestionTimeEnding ? "timer-attention" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-1 text-xs font-bold">
              <span className={isQuestionTimeEnding ? "text-red-600" : "text-blue-600"}>
                <i className="fas fa-hourglass-half ml-1"></i>الوقت المتبقي
              </span>
              <span className={isQuestionTimeEnding ? "text-red-600" : "text-blue-600"}>{remainingTimeLabel}</span>
            </div>
            <div
              className="w-full h-3 bg-blue-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-label="الوقت المتبقي للسؤال"
              aria-valuemin={0}
              aria-valuemax={questionDuration}
              aria-valuenow={questionTimer}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ${isQuestionTimeEnding ? "bg-red-500" : "bg-blue-400"}`}
                style={{ width: `${questionTimeProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <p className="text-xl font-bold text-gray-800 mb-4 leading-relaxed">{q.questionText}</p>
        {q.imageUrl && <img src={q.imageUrl} alt="question" className="w-full max-h-48 object-contain rounded-xl mb-4 border border-gray-100" />}

        {q.type === "multiple" && (
          <div className="flex flex-col gap-3 mt-4">
            {q.options.map((opt, oi) => (
              <Button key={oi} type="button" variant="outline"
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { answerIndex: oi } }))}
                className={`h-auto p-4 rounded-xl border-2 text-right font-bold whitespace-normal justify-start ${answers[q.id]?.answerIndex === oi ? "border-yellow-400 bg-yellow-50 text-yellow-700 scale-[1.02]" : "border-gray-200 hover:border-yellow-200 hover:bg-yellow-50/50 text-gray-700"}`}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black shrink-0 ${answers[q.id]?.answerIndex === oi ? "border-yellow-500 bg-yellow-400 text-white" : "border-gray-300 text-gray-500"}`}>
                  {answers[q.id]?.answerIndex === oi ? <i className="fas fa-check text-xs"></i> : String.fromCharCode(65 + oi)}
                </span>
                <span>{opt.text}</span>
                {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border mr-auto" />}
              </Button>
            ))}
          </div>
        )}

        {q.type === "essay" && (
          <Textarea
            value={answers[q.id]?.answerText || ""}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: { answerText: e.target.value } }))}
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none text-sm font-bold min-h-[120px]"
            placeholder="اكتبي إجابتك هنا..."
          />
        )}
      </Card>

      <div className="flex gap-4 pb-8">
        {currentIdx > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={() => setCurrentIdx(i => i - 1)} className="flex-1 bg-gray-100 text-gray-700">
            <i className="fas fa-arrow-right ml-2"></i> السابق
          </Button>
        )}
        {currentIdx < total - 1 ? (
          <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 text-lg">
            التالي <i className="fas fa-arrow-left mr-2"></i>
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={handleSubmit} disabled={submitted || submitQuiz.isPending} className="flex-1 bg-green-500 text-white text-lg">
            {submitQuiz.isPending ? <><i className="fas fa-spinner fa-spin ml-2"></i>جاري الإرسال...</> : <><i className="fas fa-paper-plane ml-2"></i>إرسال الإجابات</>}
          </Button>
        )}
      </div>
    </div>
  );
}

function StudentResultView({ onNavigate, result }: { onNavigate: NavFn; result: Record<string, unknown> }) {
  const score = result?.score as number | null;
  const earned = result?.earnedPoints as number;
  const total = result?.totalPoints as number;
  const hasPending = result?.hasPending as boolean;
  const quizTitle = result?.quizTitle as string;
  const studentName = result?.studentName as string;

  const emoji = hasPending ? "⏳" : score !== null && score >= 80 ? "🌟" : score !== null && score >= 60 ? "😊" : "📚";
  const msg = hasPending ? "أحسنتِ! إجاباتك المقالية قيد التصحيح" : score !== null && score >= 80 ? "ممتاز! عمل رائع!" : score !== null && score >= 60 ? "جيد جداً، استمري!" : "حاولي مرة أخرى، أنتِ قادرة!";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md p-10 text-center bg-yellow-50/80 border-yellow-200">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-3xl font-black text-yellow-600 mb-2">{studentName}</h2>
        <p className="text-gray-600 font-bold mb-6">{quizTitle}</p>
        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#fef3c7" strokeWidth="12" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={hasPending ? "#f59e0b" : score !== null && score >= 60 ? "#22c55e" : "#f87171"}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - (hasPending ? 0.5 : (score ?? 0) / 100))}`}
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-800">{hasPending ? "؟" : `${score ?? 0}%`}</span>
            <span className="text-xs text-gray-500 font-bold">{earned}/{total}</span>
          </div>
        </div>
        <p className="text-xl font-bold text-gray-700 mb-8">{msg}</p>
        {hasPending && <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-xl mb-6 font-bold">ستتلقى الدرجة النهائية بعد تصحيح المعلمة للأسئلة المقالية</p>}
        <Button type="button" variant="secondary" size="lg" onClick={() => onNavigate("home")} className="w-full">
          <i className="fas fa-home ml-2"></i>العودة للرئيسية
        </Button>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster />
    </QueryClientProvider>
  );
}
