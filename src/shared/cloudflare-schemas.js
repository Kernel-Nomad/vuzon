import { z } from 'zod';

/** IDs de recursos Cloudflare (zonas, cuentas, reglas, direcciones en rutas). */
export const cloudflareResourceIdSchema = z.string()
  .min(1, 'Identificador inválido')
  .max(64, 'Identificador demasiado largo')
  .regex(/^[A-Za-z0-9_-]+$/, 'Identificador con caracteres no permitidos');
