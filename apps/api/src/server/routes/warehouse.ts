import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";

const router = Router();

/**
 * GET /warehouse/worker/:telegramId - Получить имя кладовщика (публичный endpoint)
 */
router.get("/worker/:telegramId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.params.telegramId;
    
    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { telegramId },
      select: { name: true },
    });
    
    if (!worker) {
      return res.json({ name: null });
    }
    
    res.json({ name: worker.name });
  } catch (err) {
    next(err);
  }
});

/**
 * Middleware для проверки что пользователь является кладовщиком
 */
async function requireWarehouseWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const telegramId = req.body.telegramId || req.query.telegramId;
    
    if (!telegramId) {
      throw new ApiError(401, "Telegram ID required");
    }

    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { telegramId: String(telegramId), isActive: true },
    });

    if (!worker) {
      throw new ApiError(403, "Access denied: not a warehouse worker");
    }

    (req as any).warehouseWorker = worker;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /warehouse/requests/new - Получить все заявки со статусом "new"
 */
router.get("/requests/new", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await (prisma as any).shipmentRequest.findMany({
      where: { status: "new" },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        cityRef: {
          select: {
            shortName: true,
            fullName: true,
          },
        },
        boxType: {
          select: {
            name: true,
          },
        },
        deliveryType: {
          select: {
            name: true,
          },
        },
        photos: {
          orderBy: { uploadedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /warehouse/requests/:id - Получить детали заявки
 */
router.get("/requests/:id", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (!Number.isFinite(id)) {
      throw new ApiError(400, "Invalid request ID");
    }

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
          },
        },
        boxType: {
          select: {
            name: true,
          },
        },
        deliveryType: {
          select: {
            name: true,
          },
        },
        photos: {
          orderBy: { uploadedAt: "desc" },
        },
        services: true,
      },
    });

    if (!request) throw new ApiError(404, "Request not found");

    // Handle cityRef separately for FBS requests with fallback logic
    let cityRef;
    if (request.deliveryType?.name === "FBS") {
      // Try cityFbs first for FBS
      cityRef = await (prisma as any).cityFbs.findUnique({ 
        where: { shortName: request.city },
        select: { shortName: true, fullName: true }
      });
      // If not found in cityFbs, fallback to cities
      if (!cityRef) {
        cityRef = await (prisma as any).city.findUnique({ 
          where: { shortName: request.city },
          select: { shortName: true, fullName: true }
        });
      }
    } else {
      cityRef = await (prisma as any).city.findUnique({ 
        where: { shortName: request.city },
        select: { shortName: true, fullName: true }
      });
    }

    (request as any).cityRef = cityRef || { shortName: request.city, fullName: request.city };

    res.json(request);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /warehouse/requests/:id/volume - Обновить объем заявки (для FBS)
 */
router.patch("/requests/:id/volume", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { volume } = req.body;
    const worker = (req as any).warehouseWorker;

    if (!Number.isFinite(id)) {
      throw new ApiError(400, "Invalid request ID");
    }

    if (!volume || !Number.isFinite(Number(volume)) || Number(volume) <= 0) {
      throw new ApiError(400, "Invalid volume value");
    }

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== "new") {
      throw new ApiError(400, "Can only edit requests with status 'new'");
    }

    const updated = await (prisma as any).shipmentRequest.update({
      where: { id },
      data: { volume: Number(volume) },
      include: {
        client: true,
        cityRef: true,
        boxType: true,
        photos: true,
      },
    });

    // Логируем изменение
    await (prisma as any).requestFieldHistory.create({
      data: {
        requestId: id,
        managerId: 1, // TODO: создать отдельную таблицу для логов кладовщиков
        field: "volume",
        oldValue: request.volume?.toString() || null,
        newValue: volume.toString(),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /warehouse/requests/:id/packaging - Обновить коробки/паллеты (для FBO)
 */
router.patch("/requests/:id/packaging", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { boxCount, boxTypeId } = req.body;
    const worker = (req as any).warehouseWorker;

    if (!Number.isFinite(id)) {
      throw new ApiError(400, "Invalid request ID");
    }

    if (!boxCount || !Number.isFinite(Number(boxCount)) || Number(boxCount) <= 0) {
      throw new ApiError(400, "Invalid box count");
    }

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== "new") {
      throw new ApiError(400, "Can only edit requests with status 'new'");
    }

    const updateData: any = { boxCount: Number(boxCount) };
    if (boxTypeId) {
      updateData.boxTypeId = Number(boxTypeId);
    }

    const updated = await (prisma as any).shipmentRequest.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        cityRef: true,
        boxType: true,
        photos: true,
      },
    });

    // Логируем изменение
    await (prisma as any).requestFieldHistory.create({
      data: {
        requestId: id,
        managerId: 1,
        field: "boxCount",
        oldValue: request.boxCount?.toString() || null,
        newValue: boxCount.toString(),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /warehouse/requests/:id/photo - Добавить фото к заявке
 */
router.post("/requests/:id/photo", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { fileId, fileUrl } = req.body;
    const worker = (req as any).warehouseWorker;

    if (!Number.isFinite(id)) {
      throw new ApiError(400, "Invalid request ID");
    }

    if (!fileId) {
      throw new ApiError(400, "File ID required");
    }

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    // Проверяем что уже не добавлено фото (максимум 1)
    if (request.photos && request.photos.length >= 1) {
      throw new ApiError(400, "Maximum 1 photo per request");
    }

    const photo = await (prisma as any).requestPhoto.create({
      data: {
        requestId: id,
        fileId,
        fileUrl: fileUrl || null,
        uploadedBy: worker.telegramId,
      },
    });

    res.json(photo);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /warehouse/requests/:id/photo/:photoId - Удалить фото
 */
router.delete("/requests/:id/photo/:photoId", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const photoId = Number(req.params.photoId);

    if (!Number.isFinite(id) || !Number.isFinite(photoId)) {
      throw new ApiError(400, "Invalid ID");
    }

    const photo = await (prisma as any).requestPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.requestId !== id) {
      throw new ApiError(404, "Photo not found");
    }

    await (prisma as any).requestPhoto.delete({
      where: { id: photoId },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /warehouse/requests/:id/status - Изменить статус заявки на "warehouse"
 */
router.patch("/requests/:id/status", requireWarehouseWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const worker = (req as any).warehouseWorker;

    if (!Number.isFinite(id)) {
      throw new ApiError(400, "Invalid request ID");
    }

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== "new") {
      throw new ApiError(400, "Can only change status from 'new' to 'warehouse'");
    }

    const updated = await (prisma as any).shipmentRequest.update({
      where: { id },
      data: { status: "warehouse" },
      include: {
        client: true,
        cityRef: true,
        boxType: true,
        photos: true,
      },
    });

    // Логируем изменение статуса
    await (prisma as any).requestStatusHistory.create({
      data: {
        requestId: id,
        oldStatus: request.status,
        newStatus: "warehouse",
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
