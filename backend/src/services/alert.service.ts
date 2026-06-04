import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateAlertOptions {
  documentId?: string;
  workerId?: string;
  companyId?: string;
}

/**
 * Servicio de alertas y notificaciones.
 * Genera alertas automáticas para documentos próximos a vencer, vencidos,
 * y otros eventos del sistema.
 */
export const alertService = {
  /**
   * Crea una alerta en la base de datos.
   */
  async createAlert(
    tipo: string,
    titulo: string,
    mensaje: string,
    destinatarioId: string,
    tenantId: string,
    opts: CreateAlertOptions = {}
  ) {
    const alert = await prisma.alert.create({
      data: {
        tenantId,
        tipo: tipo as any,
        titulo,
        mensaje,
        destinatarioId,
        documentId: opts.documentId || null,
        workerId: opts.workerId || null,
        companyId: opts.companyId || null,
      },
    });

    return alert;
  },

  /**
   * Revisa todos los documentos próximos a vencer y genera alertas.
   * Usa las configuraciones de notificación del tenant para determinar los plazos.
   */
  async checkExpiringDocuments(tenantId: string) {
    const now = new Date();

    // Obtener configuración de notificaciones del tenant
    const notifConfig = await prisma.notificationConfig.findUnique({
      where: { tenantId },
    });

    const diasAdvertencia = [
      notifConfig?.diasAdvertencia90 || 90,
      notifConfig?.diasAdvertencia60 || 60,
      notifConfig?.diasAdvertencia30 || 30,
      notifConfig?.diasAdvertencia15 || 15,
      notifConfig?.diasAdvertencia7 || 7,
    ];

    const alertasGeneradas = [];

    for (const dias of diasAdvertencia) {
      const fechaLimite = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

      const documents = await prisma.document.findMany({
        where: {
          tenantId,
          fechaVencimiento: {
            gte: now,
            lte: fechaLimite,
          },
          estado: 'APROBADO',
        },
        include: {
          company: { select: { id: true, razonSocial: true } },
          worker: { select: { id: true, nombreCompleto: true } },
        },
      });

      for (const doc of documents) {
        // Buscar usuarios administrativos del tenant para notificar
        const usuarios = await prisma.user.findMany({
          where: {
            tenantId,
            activo: true,
            rol: { in: ['ADMIN', 'REVISOR'] },
          },
        });

        for (const usuario of usuarios) {
          const alert = await this.createAlert(
            'DOCUMENTO_PROXIMO_VENCER',
            `Documento próximo a vencer (${dias} días)`,
            `El documento "${doc.nombreArchivo}" de tipo ${doc.tipoDocumento} ${
              doc.worker ? `del trabajador ${doc.worker.nombreCompleto}` : ''
            } de la empresa ${doc.company.razonSocial} vence en ${dias} días.`,
            usuario.id,
            tenantId,
            {
              documentId: doc.id,
              workerId: doc.workerId || undefined,
              companyId: doc.companyId,
            }
          );
          alertasGeneradas.push(alert);
        }
      }
    }

    return alertasGeneradas;
  },

  /**
   * Revisa documentos vencidos y genera alertas.
   */
  async checkExpiredDocuments(tenantId: string) {
    const now = new Date();
    const alertasGeneradas = [];

    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        fechaVencimiento: {
          lte: now,
        },
        estado: { in: ['APROBADO', 'PENDIENTE'] },
      },
      include: {
        company: { select: { id: true, razonSocial: true } },
        worker: { select: { id: true, nombreCompleto: true } },
      },
    });

    for (const doc of documents) {
      const usuarios = await prisma.user.findMany({
        where: {
          tenantId,
          activo: true,
          rol: { in: ['ADMIN', 'REVISOR'] },
        },
      });

      for (const usuario of usuarios) {
        const alert = await this.createAlert(
          'DOCUMENTO_VENCIDO',
          'Documento vencido',
          `El documento "${doc.nombreArchivo}" de tipo ${doc.tipoDocumento} ${
            doc.worker ? `del trabajador ${doc.worker.nombreCompleto}` : ''
          } de la empresa ${doc.company.razonSocial} ha vencido.`,
          usuario.id,
          tenantId,
          {
            documentId: doc.id,
            workerId: doc.workerId || undefined,
            companyId: doc.companyId,
          }
        );
        alertasGeneradas.push(alert);
      }
    }

    return alertasGeneradas;
  },

  /**
   * Obtiene las alertas de un usuario.
   * @param userId ID del usuario
   * @param leido Filtrar por leído (opcional)
   */
  async getAlerts(userId: string, leido?: boolean) {
    const where: any = { destinatarioId: userId };

    if (leido !== undefined) {
      where.leido = leido;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        document: {
          select: { id: true, nombreArchivo: true, tipoDocumento: true },
        },
        worker: {
          select: { id: true, nombreCompleto: true },
        },
        company: {
          select: { id: true, razonSocial: true },
        },
      },
    });

    return alerts;
  },

  /**
   * Marca una alerta como leída.
   */
  async markAsRead(alertId: string, userId: string) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, destinatarioId: userId },
    });

    if (!alert) {
      throw new AppError('Alerta no encontrada', 404, 'ALERT_NOT_FOUND');
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        leido: true,
        fechaLectura: new Date(),
      },
    });

    return updated;
  },

  /**
   * Obtiene el conteo de alertas no leídas de un usuario.
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.alert.count({
      where: { destinatarioId: userId, leido: false },
    });

    return count;
  },
};
