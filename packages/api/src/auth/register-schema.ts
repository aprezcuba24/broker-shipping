import { z } from 'zod'

export const clientAppSchema = z.enum(['backoffice', 'seller'])

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().email('Introduce un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
export type ClientApp = z.infer<typeof clientAppSchema>

export const EMAIL_NOT_VERIFIED_DETAIL = 'Email not verified'

export function isEmailNotVerifiedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const detail = (error as { detail?: unknown }).detail
  return detail === EMAIL_NOT_VERIFIED_DETAIL
}
