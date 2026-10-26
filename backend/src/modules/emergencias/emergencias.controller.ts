/**
 * Controlador de Emergencias
 * Maneja las solicitudes HTTP para el flujo de vida de una emergencia
 * Flujo: reportar -> clasificar -> asignar -> iniciar atención -> cerrar
 */

import { Request, Response, NextFunction } from 'express';
import { emergenciasService } from './emergencias.service';
import { emitSosAlert, emitCaseUpdate } from '../../socket';
import { successResponse, errorResponse } from '../../utils/api-response';
import { EstadoEmergencia } from '@prisma/client';

export class EmergenciasController {
  /**
   * RF-01: Crear reporte inicial por ciudadano
   * POST /api/v1/emergencias
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCiudadano = req.usuario!.id;
      const emergencia = await emergenciasService.crearReporte(req.body, idCiudadano);
      emitSosAlert(emergencia);
    successResponse(res, emergencia, 'Emergencia reportada exitosamente', 201);
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * RF-03: Clasificar reporte por operador
   * PATCH /api/v1/emergencias/:id/clasificar
   * Valida estado previo: REPORTADO -> CLASIFICADO
   */
  async clasificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const idOperador = req.usuario!.id;
      const emergencia = await emergenciasService.clasificarReporte(idEmergencia, req.body, idOperador);
      emitCaseUpdate(emergencia);
      successResponse(res, emergencia, 'Emergencia clasificada exitosamente');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * RF-05: Asignar unidad de respuesta por despachador
   * PATCH /api/v1/emergencias/:id/asignar
   * Valida estado previo: CLASIFICADO -> ASIGNADO
   */
  async asignar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const idDespachador = req.usuario!.id;
      const emergencia = await emergenciasService.asignarUnidad(idEmergencia, req.body, idDespachador);
      emitCaseUpdate(emergencia);
      successResponse(res, emergencia, 'Unidad asignada exitosamente');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * Iniciar atención en escena por personal de campo / operador
   * PATCH /api/v1/emergencias/:id/iniciar-atencion
   * Valida estado previo: ASIGNADO -> EN_ATENCION
   */
  async iniciarAtencion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const idUsuario = req.usuario!.id;
      const emergencia = await emergenciasService.iniciarAtencion(idEmergencia, req.body, idUsuario);
      emitCaseUpdate(emergencia);
      successResponse(res, emergencia, 'Atención de emergencia iniciada en campo');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * Cerrar emergencia y registrar resolución
   * PATCH /api/v1/emergencias/:id/cerrar
   * Valida estado previo: EN_ATENCION -> CERRADO
   */
  async cerrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const idUsuario = req.usuario!.id;
      const emergencia = await emergenciasService.cerrarEmergencia(idEmergencia, req.body, idUsuario);
      emitCaseUpdate(emergencia);
      successResponse(res, emergencia, 'Emergencia cerrada exitosamente y unidad liberada');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * Obtener detalle completo de una emergencia
   * GET /api/v1/emergencias/:id
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const emergencia = await emergenciasService.obtenerEmergencia(idEmergencia);
      successResponse(res, emergencia, 'Emergencia obtenida exitosamente');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * Listar emergencias con filtros operativos y paginación
   * GET /api/v1/emergencias
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        estado: req.query.estado as EstadoEmergencia | undefined,
        prioridad: req.query.prioridad ? parseInt(req.query.prioridad as string, 10) : undefined,
        fecha_inicio: req.query.fecha_inicio as string | undefined,
        fecha_fin: req.query.fecha_fin as string | undefined,
        pagina: req.query.pagina ? parseInt(req.query.pagina as string, 10) : 1,
        limite: req.query.limite ? parseInt(req.query.limite as string, 10) : 20,
      };

      const resultado = await emergenciasService.listarEmergencias(filtros);
      successResponse(res, resultado, 'Listado de emergencias obtenido');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Obtener historial completo de auditoría y trazabilidad (RNF-09)
   * GET /api/v1/emergencias/:id/historial
   */
  async obtenerHistorial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEmergencia = parseInt(req.params.id, 10);
      const historial = await emergenciasService.obtenerHistorial(idEmergencia);
      successResponse(res, historial, 'Historial de auditoría obtenido exitosamente');
    } catch (error: any) {
      if (error.statusCode) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }

  /**
   * Listar los reportes creados por el ciudadano autenticado
   * GET /api/v1/emergencias/mis-reportes
   */
  async misReportes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCiudadano = req.usuario!.id;
      const reportes = await emergenciasService.listarMisReportes(idCiudadano);
      successResponse(res, reportes, 'Reportes de ciudadano obtenidos');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Carga de evidencia multimedia (foto/video de incidente)
   * POST /api/v1/emergencias/upload
   */
  async subirEvidencia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        errorResponse(res, 'No se ha adjuntado ningún archivo de evidencia multimedia', 400);
        return;
      }

      const urlRelativa = `/uploads/evidencias/${req.file.filename}`;
      successResponse(
        res,
        {
          url: urlRelativa,
          nombreArchivo: req.file.filename,
          nombreOriginal: req.file.originalname,
          tamanoBytes: req.file.size,
          mimetype: req.file.mimetype,
        },
        'Evidencia multimedia subida exitosamente',
        201
      );
    } catch (error: any) {
      next(error);
    }
  }
}

export const emergenciasController = new EmergenciasController();
