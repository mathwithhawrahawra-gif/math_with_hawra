import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { db, teachersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

declare module "express-session" {
  interface SessionData {
    teacherId?: number;
  }
}

router.post("/register", async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  try {
    const existing = await db.select().from(teachersTable).where(eq(teachersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [teacher] = await db.insert(teachersTable).values({ email, name, passwordHash }).returning();

    req.session.teacherId = teacher.id;
    res.status(201).json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      createdAt: teacher.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error registering teacher");
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }

  try {
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.email, email)).limit(1);

    if (!teacher) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, teacher.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    req.session.teacherId = teacher.id;
    res.json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      createdAt: teacher.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error logging in teacher");
    res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const teacherId = req.session.teacherId;
  if (!teacherId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }

  try {
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, teacherId)).limit(1);
    if (!teacher) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "الجلسة غير صالحة" });
      return;
    }

    res.json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      createdAt: teacher.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting current teacher");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Error logging out teacher");
      res.status(500).json({ error: "تعذر تسجيل الخروج" });
      return;
    }

    // Explicitly remove the session cookie in addition to destroying the
    // server-side session, including in production where secure cookies are used.
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  });
});

export default router;
