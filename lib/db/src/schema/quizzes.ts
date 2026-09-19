import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teachersTable } from "./teachers";

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes").notNull().default(10),
  shareCode: text("share_code").notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "multiple" | "essay"
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  points: integer("points").notNull().default(10),
  correctAnswerIndex: integer("correct_answer_index"),
  modelAnswer: text("model_answer"),
  timeLimitSeconds: integer("time_limit_seconds"),
  order: integer("order").notNull().default(0),
});

export const optionsTable = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
export type Option = typeof optionsTable.$inferSelect;
