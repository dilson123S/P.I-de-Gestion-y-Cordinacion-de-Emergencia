import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import config from '../../config';

export const evidenciasDir = path.resolve(config.uploadDir);

fs.mkdirSync(evidenciasDir, { recursive: true });

export const subirEvidencia = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, evidenciasDir),
    filename: (_req, file, callback) => {
      const extensiones: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
      };
      callback(null, `${randomUUID()}${extensiones[file.mimetype] || '.jpg'}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      callback(Object.assign(new Error('La evidencia debe ser una imagen JPG, PNG o WebP.'), { statusCode: 400 }));
      return;
    }
    callback(null, true);
  },
});
