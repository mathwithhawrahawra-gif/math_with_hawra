import { Router, type Request, type Response } from "express";
import { db, quizzesTable, submissionsTable } from "@workspace/db";
import { eq, count, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const teacherId = req.session.teacherId!;

  try {
    const [quizCount] = await db.select({ count: count() }).from(quizzesTable).where(eq(quizzesTable.teacherId, teacherId));

    const teacherQuizzes = await db.select({ id: quizzesTable.id }).from(quizzesTable).where(eq(quizzesTable.teacherId, teacherId));
    const quizIds = teacherQuizzes.map((q) => q.id);

    if (quizIds.length === 0) {
      res.json({ totalQuizzes: 0, totalStudents: 0, averageScore: 0, pendingCount: 0 });
      return;
    }

    const submissions = await db.select({ studentName: submissionsTable.studentName, score: submissionsTable.score, hasPending: submissionsTable.hasPending })
      .from(submissionsTable)
      .where(inArray(submissionsTable.quizId, quizIds));

    const uniqueStudents = new Set(submissions.map((s) => s.studentName)).size;

    const scoredSubmissions = submissions.filter((s) => s.score !== null);
    const avgScore = scoredSubmissions.length > 0
      ? Math.round(scoredSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / scoredSubmissions.length)
      : 0;

    const pendingCount = submissions.filter((s) => s.hasPending).length;

    res.json({
      totalQuizzes: quizCount.count,
      totalStudents: uniqueStudents,
      averageScore: avgScore,
      pendingCount,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard stats");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
