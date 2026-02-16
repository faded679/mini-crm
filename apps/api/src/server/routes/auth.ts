import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { signAccessToken } from "../auth/jwt.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const manager = await prisma.manager.findUnique({ where: { email: body.email } });
    if (!manager) {
      throw new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(body.password, manager.passwordHash);
    if (!ok) {
      throw new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    await prisma.manager.update({ where: { id: manager.id }, data: { lastLoginAt: new Date() } });

    const token = signAccessToken({ sub: manager.id, email: manager.email, name: manager.name });

    res.json({ accessToken: token });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", async (req, res) => {
  res.json({ ok: true });
});
