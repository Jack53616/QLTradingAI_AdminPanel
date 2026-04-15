import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "ql-trading-ai-secret-key-change-in-production"
);

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "unauthorized", message: "Authentication required" });
    return;
  }

  const token = auth.slice(7);
  try {
    await jwtVerify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: "invalid_token", message: "Invalid or expired token" });
  }
}
