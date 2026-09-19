import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    teacherId?: number;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.teacherId) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }
  next();
}
