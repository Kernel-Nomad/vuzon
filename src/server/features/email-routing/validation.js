import { z } from 'zod';
import { cloudflareResourceIdSchema } from '../../../shared/cloudflare-schemas.js';

export { cloudflareResourceIdSchema };

export const addressSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
});

export const ruleSchema = z.object({
  localPart: z.string()
    .min(1, 'El alias no puede estar vacío')
    .max(64, 'El alias es demasiado largo')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, puntos y guiones'),
  destEmail: z.string().email('Email de destino inválido'),
});
