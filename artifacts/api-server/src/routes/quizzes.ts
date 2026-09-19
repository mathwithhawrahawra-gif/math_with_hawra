import { Router, type Request, type Response } from "express";
import { db, quizzesTable, questionsTable, optionsTable, submissionsTable, answerSubmissionsTable } from "@workspace/db";
import { eq, and, count, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function generateShareCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function ensureUniqueCode(): Promise<string> {
  let code = generateShareCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.select().from(quizzesTable).where(eq(quizzesTable.shareCode, code)).limit(1);
    if (existing.length === 0) return code;
    code = generateShareCode();
    attempts++;
  }
  return code;
}

async function buildQuizWithQuestions(quizId: number) {
  const quiz = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
  if (quiz.length === 0) return null;

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId)).orderBy(questionsTable.order);

  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await db.select().from(optionsTable).where(eq(optionsTable.questionId, q.id)).orderBy(optionsTable.order);
      return {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        points: q.points,
        correctAnswerIndex: q.correctAnswerIndex,
        modelAnswer: q.modelAnswer,
        timeLimitSeconds: q.timeLimitSeconds,
        order: q.order,
        options: options.map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl, order: o.order })),
      };
    }),
  );

  return {
    id: quiz[0].id,
    title: quiz[0].title,
    description: quiz[0].description,
    timeLimitMinutes: quiz[0].timeLimitMinutes,
    shareCode: quiz[0].shareCode,
    imageUrl: quiz[0].imageUrl,
    createdAt: quiz[0].createdAt.toISOString(),
    questions: questionsWithOptions,
  };
}

router.get("/code/:code", async (req: Request, res: Response) => {
  const code = String(req.params.code);
  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.shareCode, code.toUpperCase())).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "رمز المسابقة غير صحيح" });
      return;
    }
    const result = await buildQuizWithQuestions(quiz.id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error getting quiz by code");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

function requestOrigin(req: Request): string {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  return `${forwardedProto}://${req.get("host")}`;
}

// Social platforms need a server-rendered page to read the activity title and cover.
router.get("/share/:code", async (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.shareCode, code)).limit(1);
    if (!quiz) {
      res.status(404).send("النشاط غير موجود");
      return;
    }

    const origin = requestOrigin(req);
    const appUrl = `${origin}/?quiz=${encodeURIComponent(code)}`;
    const coverUrl = quiz.imageUrl?.startsWith("http")
      ? quiz.imageUrl
      : quiz.imageUrl?.startsWith("data:image/")
        ? `${origin}/api/quizzes/code/${encodeURIComponent(code)}/cover`
        : `${origin}/logo.png`;
    const title = escapeHtml(quiz.title);
    const description = escapeHtml(quiz.description || "انضمي إلى النشاط وابدئي الحل الآن");
    const safeAppUrl = escapeHtml(appUrl);
    const safeCoverUrl = escapeHtml(coverUrl);

    res.type("html").send(`<!doctype html>
<html lang="ar" dir="rtl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Math With Hawra</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${safeCoverUrl}">
<meta property="og:image:alt" content="غلاف ${title}">
<meta property="og:type" content="website">
<meta property="og:url" content="${safeAppUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${safeCoverUrl}">
<meta http-equiv="refresh" content="0;url=${safeAppUrl}">
</head><body><p>جاري فتح النشاط...</p><script>location.replace(${JSON.stringify(appUrl)})</script></body></html>`);
  } catch (err) {
    req.log.error({ err }, "Error creating quiz share page");
    res.status(500).send("حدث خطأ");
  }
});

// Serves base64 covers as real image responses for WhatsApp/Telegram previews.
router.get("/code/:code/cover", async (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.shareCode, code)).limit(1);
    const match = quiz?.imageUrl?.match(/^data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) {
      res.status(404).end();
      return;
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.type(match[1]).send(Buffer.from(match[2].replace(/\s/g, ""), "base64"));
  } catch (err) {
    req.log.error({ err }, "Error serving quiz cover");
    res.status(500).end();
  }
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const teacherId = req.session.teacherId!;
  try {
    const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.teacherId, teacherId)).orderBy(sql`${quizzesTable.createdAt} DESC`);

    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const [qCount] = await db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.quizId, quiz.id));
        const [sCount] = await db.select({ count: count() }).from(submissionsTable).where(eq(submissionsTable.quizId, quiz.id));
        const [pCount] = await db.select({ count: count() }).from(submissionsTable).where(and(eq(submissionsTable.quizId, quiz.id), eq(submissionsTable.hasPending, true)));

        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimitMinutes: quiz.timeLimitMinutes,
          shareCode: quiz.shareCode,
          imageUrl: quiz.imageUrl,
          questionCount: qCount.count,
          submissionCount: sCount.count,
          pendingCount: pCount.count,
          createdAt: quiz.createdAt.toISOString(),
        };
      }),
    );

    res.json(quizzesWithStats);
  } catch (err) {
    req.log.error({ err }, "Error listing quizzes");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const teacherId = req.session.teacherId!;
  const { title, description, timeLimitMinutes, imageUrl, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions)) {
    res.status(400).json({ error: "البيانات غير مكتملة" });
    return;
  }

  try {
    const shareCode = await ensureUniqueCode();
    const [quiz] = await db.insert(quizzesTable).values({
      teacherId,
      title,
      description: description || null,
      timeLimitMinutes: timeLimitMinutes || 10,
      shareCode,
      imageUrl: imageUrl || null,
    }).returning();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const [question] = await db.insert(questionsTable).values({
        quizId: quiz.id,
        type: q.type || "multiple",
        questionText: q.questionText,
        imageUrl: q.imageUrl || null,
        points: q.points || 10,
        correctAnswerIndex: q.correctAnswerIndex ?? null,
        modelAnswer: q.modelAnswer || null,
        timeLimitSeconds: q.timeLimitSeconds || null,
        order: i,
      }).returning();

      if (q.options && Array.isArray(q.options)) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await db.insert(optionsTable).values({
            questionId: question.id,
            text: opt.text,
            imageUrl: opt.imageUrl || null,
            order: j,
          });
        }
      }
    }

    const result = await buildQuizWithQuestions(quiz.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Error creating quiz");
    res.status(500).json({ error: "حدث خطأ أثناء حفظ المسابقة" });
  }
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const teacherId = req.session.teacherId!;

  try {
    const [quiz] = await db.select().from(quizzesTable).where(and(eq(quizzesTable.id, id), eq(quizzesTable.teacherId, teacherId))).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }
    const result = await buildQuizWithQuestions(id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error getting quiz");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const teacherId = req.session.teacherId!;
  const { title, description, timeLimitMinutes, imageUrl, questions } = req.body;

  try {
    const [quiz] = await db.select().from(quizzesTable).where(and(eq(quizzesTable.id, id), eq(quizzesTable.teacherId, teacherId))).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }

    await db.update(quizzesTable).set({
      title,
      description: description || null,
      timeLimitMinutes: timeLimitMinutes || 10,
      imageUrl: imageUrl || null,
    }).where(eq(quizzesTable.id, id));

    // Delete existing questions (cascade deletes options)
    const existingQuestions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, id));
    if (existingQuestions.length > 0) {
      const qIds = existingQuestions.map((q) => q.id);
      await db.delete(optionsTable).where(inArray(optionsTable.questionId, qIds));
      await db.delete(questionsTable).where(eq(questionsTable.quizId, id));
    }

    // Re-insert questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const [question] = await db.insert(questionsTable).values({
        quizId: id,
        type: q.type || "multiple",
        questionText: q.questionText,
        imageUrl: q.imageUrl || null,
        points: q.points || 10,
        correctAnswerIndex: q.correctAnswerIndex ?? null,
        modelAnswer: q.modelAnswer || null,
        timeLimitSeconds: q.timeLimitSeconds || null,
        order: i,
      }).returning();

      if (q.options && Array.isArray(q.options)) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await db.insert(optionsTable).values({
            questionId: question.id,
            text: opt.text,
            imageUrl: opt.imageUrl || null,
            order: j,
          });
        }
      }
    }

    const result = await buildQuizWithQuestions(id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error updating quiz");
    res.status(500).json({ error: "حدث خطأ أثناء تحديث المسابقة" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const teacherId = req.session.teacherId!;

  try {
    const [quiz] = await db.select().from(quizzesTable).where(and(eq(quizzesTable.id, id), eq(quizzesTable.teacherId, teacherId))).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }

    await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
    res.json({ success: true, message: "تم حذف المسابقة" });
  } catch (err) {
    req.log.error({ err }, "Error deleting quiz");
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// Get submissions for a quiz
router.get("/:id/submissions", requireAuth, async (req: Request, res: Response) => {
  const quizId = parseInt(String(req.params.id));
  const teacherId = req.session.teacherId!;

  try {
    const [quiz] = await db.select().from(quizzesTable).where(and(eq(quizzesTable.id, quizId), eq(quizzesTable.teacherId, teacherId))).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }

    const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.quizId, quizId)).orderBy(sql`${submissionsTable.completedAt} DESC`);

    const submissionsWithAnswers = await Promise.all(
      submissions.map(async (sub) => {
        const answers = await db.select().from(answerSubmissionsTable).where(eq(answerSubmissionsTable.submissionId, sub.id));

        const answersWithDetails = await Promise.all(
          answers.map(async (ans) => {
            const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, ans.questionId)).limit(1);
            const options = question ? await db.select().from(optionsTable).where(eq(optionsTable.questionId, question.id)).orderBy(optionsTable.order) : [];
            return {
              id: ans.id,
              questionId: ans.questionId,
              questionText: question?.questionText || "",
              questionType: question?.type || "multiple",
              answerText: ans.answerText,
              answerIndex: ans.answerIndex,
              isCorrect: ans.isCorrect,
              grade: ans.grade,
              status: ans.status,
              modelAnswer: question?.modelAnswer,
              options: options.map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl, order: o.order })),
            };
          }),
        );

        return {
          id: sub.id,
          quizId: sub.quizId,
          quizTitle: quiz.title,
          studentName: sub.studentName,
          score: sub.score,
          earnedPoints: sub.earnedPoints,
          totalPoints: sub.totalPoints,
          completedAt: sub.completedAt.toISOString(),
          hasPending: sub.hasPending,
          answers: answersWithDetails,
        };
      }),
    );

    res.json(submissionsWithAnswers);
  } catch (err) {
    req.log.error({ err }, "Error getting quiz submissions");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// Delete submissions for a quiz
router.delete("/:id/submissions", requireAuth, async (req: Request, res: Response) => {
  const quizId = parseInt(String(req.params.id));
  const teacherId = req.session.teacherId!;
  const { submissionIds, deleteAll } = req.body;

  try {
    const [quiz] = await db.select().from(quizzesTable).where(and(eq(quizzesTable.id, quizId), eq(quizzesTable.teacherId, teacherId))).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }

    if (deleteAll) {
      await db.delete(submissionsTable).where(eq(submissionsTable.quizId, quizId));
    } else if (submissionIds && Array.isArray(submissionIds) && submissionIds.length > 0) {
      await db.delete(submissionsTable).where(and(eq(submissionsTable.quizId, quizId), inArray(submissionsTable.id, submissionIds)));
    }

    res.json({ success: true, message: "تم الحذف بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting submissions");
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

export default router;
