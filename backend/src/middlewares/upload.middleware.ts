/**
 * Middleware institucional para carga segura de evidencias multimedia (RF-01 / RNF-07)
 * Utiliza Multer con almacenamiento local en disco, filtrado estricto por tipo MIME
 * y generación de nombres inmutables criptográficamente únicos.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import config from '../config';
import { AppError } from './error.middleware';

// Ruta destino para evidencias
const UPLOAD_PATH = path.resolve(config.uploadDir, 'evidencias');

// Asegurar existencia del directorio
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hashUnico = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `evidencia_${timestamp}_${hashUnico}${ext}`);
  },
});

// Filtro estricto por tipo MIME permitido (imágenes y videos cortos de reporte)
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const mimePermitidos = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
  ];

  if (mimePermitidos.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        `Tipo de archivo no permitido: "${file.mimetype}". Formatos admitidos: JPG, PNG, WEBP, GIF, MP4.`
      )
    );
  }
};

export const uploadEvidencia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 Megabytes
    files: 1,
  },
});
