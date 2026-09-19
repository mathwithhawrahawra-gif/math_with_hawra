import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { quizzesTable } from "./quizzes";
import { questionsTable } from "./quizzes";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  studentName: text("student_name").notNull(),
  earnedPoints: integer("earned_points").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  score: integer("score"), // percentage, null until all essays graded
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  hasPending: boolean("has_pending").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const answerSubmissionsTable = pgTable("answer_submissions", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  answerText: text("answer_text"),
  answerIndex: integer("answer_index"),
  isCorrect: boolean("is_correct"),
  grade: integer("grade"), // 0-100 percentage for essay
  status: text("status").notNull().default("auto"), // "auto" | "pending" | "graded"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, completedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
export type AnswerSubmission = typeof answerSubmissionsTable.$inferSelect;
