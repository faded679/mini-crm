import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { signToken } from "../auth/jwt.js";
import { ApiError } from "../errors.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const manager = await prisma.manager.findUnique({ where: { email } });
    if (!manager) {
      throw new ApiError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, manager.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = signToken({ managerId: manager.id, email: manager.email });
    res.json({ token, manager: { id: manager.id, email: manager.email, name: manager.name } });
  } catch (err) {
    next(err);
  }
});

export default router;
