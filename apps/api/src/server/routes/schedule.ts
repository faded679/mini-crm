import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

// GET /schedule — public endpoint, returns upcoming delivery schedule
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await prisma.deliverySchedule.findMany({
      orderBy: [{ deliveryDate: "asc" }, { destination: "asc" }],
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

// GET /schedule/destinations — unique destination list
router.get("/destinations", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const destinations = await prisma.deliverySchedule.findMany({
      select: { destination: true },
      distinct: ["destination"],
      orderBy: { destination: "asc" },
    });
    res.json(destinations.map((d: { destination: string }) => d.destination));
  } catch (err) {
    next(err);
  }
});

export default router;
