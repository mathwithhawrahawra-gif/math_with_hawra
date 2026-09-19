import { Router, type Request, type Response } from "express";
import { db, quizzesTable, questionsTable, optionsTable, submissionsTable, answerSubmissionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function calculateSimilarity(text1: string, text2: string): number {
  const s1 = text1.toLowerCase().replace(/[^\u0600-\u06FF\w\s]/g, "").trim();
  const s2 = text2.toLowerCase().replace(/[^\u0600-\u06FF\w\s]/g, "").trim();

  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const common = words1.filter((w) => words2.includes(w));

  return Math.round((common.length / Math.max(words1.length, words2.length)) * 100);
}

router.post("/", async (req: Request, res: Response) => {
  const { quizId, studentName, timeSpentSeconds, answers } = req.body;

  if (!quizId || !studentName || !answers || !Array.isArray(answers)) {
    res.status(400).json({ error: "البيانات غير مكتملة" });
    return;
  }

  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
    if (!quiz) {
      res.status(404).json({ error: "المسابقة غير موجودة" });
      return;
    }

    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId)).orderBy(questionsTable.order);

    let earnedPoints = 0;
    let totalPoints = 0;
    let hasPending = false;

    const answerRecords: Array<{
      questionId: number;
      answerText: string | null;
      answerIndex: number | null;
      isCorrect: boolean | null;
      grade: number | null;
      status: string;
    }> = [];

    for (const question of questions) {
      const points = question.points || 10;
      totalPoints += points;

      const studentAnswer = answers.find((a: { questionId: number }) => a.questionId === question.id);

      if (!studentAnswer) {
        answerRecords.push({
          questionId: question.id,
          answerText: null,
          answerIndex: null,
          isCorrect: false,
          grade: null,
          status: "auto",
        });
        continue;
      }

      if (question.type === "multiple") {
        const isCorrect = studentAnswer.answerIndex === question.correctAnswerIndex;
        if (isCorrect) earnedPoints += points;
        answerRecords.push({
          questionId: question.id,
          answerText: null,
          answerIndex: studentAnswer.answerIndex ?? null,
          isCorrect,
          grade: null,
          status: "auto",
        });
      } else if (question.type === "essay") {
        const answerText = studentAnswer.answerText || "";
        // All essay answers go to pending for teacher review
        hasPending = true;
        answerRecords.push({
          questionId: question.id,
          answerText,
          answerIndex: null,
          isCorrect: null,
          grade: null,
          status: "pending",
        });
      }
    }

    const score = hasPending ? null : (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0);

    const [submission] = await db.insert(submissionsTable).values({
      quizId,
      studentName,
      earnedPoints,
      totalPoints,
      score,
      timeSpentSeconds: timeSpentSeconds || 0,
      hasPending,
    }).returning();

    for (const ans of answerRecords) {
      await db.insert(answerSubmissionsTable).values({
        submissionId: submission.id,
        ...ans,
      });
    }

    res.status(201).json({
      id: submission.id,
      score: submission.score,
      earnedPoints: submission.earnedPoints,
      totalPoints: submission.totalPoints,
      hasPending: submission.hasPending,
    });
  } catch (err) {
    req.log.error({ err }, "Error submitting quiz");
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الإجابات" });
  }
});

router.patch("/:id/answers/:answerId/grade", requireAuth, async (req: Request, res: Response) => {
  const submissionId = parseInt(String(req.params.id));
  const answerId = parseInt(String(req.params.answerId));
  const { grade } = req.body;

  if (grade === undefined || grade < 0 || grade > 100) {
    res.status(400).json({ error: "الدرجة يجب أن تكون بين 0 و 100" });
    return;
  }

  try {
    const [answer] = await db.select().from(answerSubmissionsTable).where(and(eq(answerSubmissionsTable.id, answerId), eq(answerSubmissionsTable.submissionId, submissionId))).limit(1);

    if (!answer) {
      res.status(404).json({ error: "الإجابة غير موجودة" });
      return;
    }

    const [submissionQuiz] = await db
      .select({ quizId: submissionsTable.quizId })
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1);
    const [ownedQuiz] = submissionQuiz
      ? await db.select({ id: quizzesTable.id }).from(quizzesTable).where(and(eq(quizzesTable.id, submissionQuiz.quizId), eq(quizzesTable.teacherId, req.session.teacherId!))).limit(1)
      : [];
    if (!ownedQuiz) {
      res.status(404).json({ error: "النتيجة غير موجودة" });
      return;
    }

    const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, answer.questionId)).limit(1);
    const points = question?.points || 10;
    const earnedFromEssay = Math.round((grade / 100) * points);

    await db.update(answerSubmissionsTable).set({
      grade,
      isCorrect: grade >= 50,
      status: "graded",
    }).where(eq(answerSubmissionsTable.id, answerId));

    // Check if all answers for this submission are now graded
    const allAnswers = await db.select().from(answerSubmissionsTable).where(eq(answerSubmissionsTable.submissionId, submissionId));
    const stillPending = allAnswers.some((a) => a.status === "pending");

    // Recalculate score
    const [submission] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, submissionId)).limit(1);
    if (submission) {
      let newEarned = 0;
      for (const a of allAnswers) {
        const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, a.questionId)).limit(1);
        const qPoints = q?.points || 10;
        if (a.id === answerId) {
          newEarned += earnedFromEssay;
        } else if (a.isCorrect) {
          if (a.status === "auto") {
            newEarned += qPoints;
          } else if (a.status === "graded" && a.grade !== null) {
            newEarned += Math.round((a.grade / 100) * qPoints);
          }
        }
      }

      const newScore = stillPending ? null : (submission.totalPoints > 0 ? Math.round((newEarned / submission.totalPoints) * 100) : 0);

      await db.update(submissionsTable).set({
        hasPending: stillPending,
        earnedPoints: newEarned,
        score: newScore,
      }).where(eq(submissionsTable.id, submissionId));
    }

    res.json({ success: true, message: "تم حفظ التصحيح" });
  } catch (err) {
    req.log.error({ err }, "Error grading answer");
    res.status(500).json({ error: "حدث خطأ أثناء التصحيح" });
  }
});

export default router;
