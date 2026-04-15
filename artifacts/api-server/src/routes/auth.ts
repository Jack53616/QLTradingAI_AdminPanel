import { Router } from "express";
import { SignJWT, jwtVerify } from "jose";
import { AdminLoginBody } from "@workspace/api-zod";

export const authRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "ql-trading-ai-secret-key-change-in-production"
);

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

authRouter.post("/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request" });
    return;
  }

  const { password } = parsed.data;
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, error: "invalid_password", message: "Invalid admin password" });
    return;
  }

  const token = await signAdminToken();
  res.json({ ok: true, token });
});
