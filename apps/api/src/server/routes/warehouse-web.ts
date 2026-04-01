import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../errors.js";
import { prisma } from "../db/prisma.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "warehouse-secret-key-change-in-production";

// Middleware для проверки JWT токена кладовщика
async function requireWarehouseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { workerId: number };

    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { id: decoded.workerId, isActive: true },
    });

    if (!worker) {
      throw new ApiError(401, "Unauthorized");
    }

    (req as any).warehouseWorker = worker;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, "Unauthorized"));
    }
  }
}

// POST /warehouse-web/login — авторизация кладовщика
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { email, isActive: true },
    });

    if (!worker || !worker.password) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, worker.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign({ workerId: worker.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/my-requests — получить заявки в статусе "in_warehouse"
router.get("/my-requests", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryType } = req.query as { deliveryType?: string };

    const where: any = { status: "in_warehouse" };
    
    if (deliveryType && (deliveryType === "FBO" || deliveryType === "FBS")) {
      where.deliveryType = { name: deliveryType };
    }

    const requests = await (prisma as any).shipmentRequest.findMany({
      where,
      include: {
        client: {
          include: {
            counterparties: {
              include: {
                counterparty: true,
              },
            },
          },
        },
        deliveryType: true,
        boxType: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/bulk-ship — массовая отгрузка заявок
router.patch("/requests/bulk-ship", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestIds } = req.body as { requestIds: number[] };

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new ApiError(400, "requestIds array is required");
    }

    const worker = (req as any).warehouseWorker;

    // Обновляем статус всех заявок
    const result = await (prisma as any).shipmentRequest.updateMany({
      where: {
        id: { in: requestIds },
        status: "in_warehouse",
      },
      data: {
        status: "shipped",
      },
    });

    // Создаем записи в истории статусов для каждой заявки
    const historyRecords = requestIds.map((id) => ({
      requestId: id,
      status: "shipped",
      changedBy: `warehouse_worker_${worker.id}`,
      comment: `Отгружено кладовщиком ${worker.name}`,
    }));

    await (prisma as any).requestStatusHistory.createMany({
      data: historyRecords,
    });

    res.json({ success: true, shipped: result.count });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/stats — простая статистика
router.get("/stats", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [inWarehouse, shippedToday] = await Promise.all([
      (prisma as any).shipmentRequest.count({
        where: { status: "in_warehouse" },
      }),
      (prisma as any).shipmentRequest.count({
        where: {
          status: "shipped",
          updatedAt: { gte: today },
        },
      }),
    ]);

    res.json({
      inWarehouse,
      shippedToday,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
