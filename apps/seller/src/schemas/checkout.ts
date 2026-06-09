import { z } from 'zod'

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(32, 'Máximo 32 caracteres'),
  identification: z
    .string()
    .trim()
    .min(1, 'La identificación es obligatoria')
    .max(64, 'Máximo 64 caracteres'),
})

export const addressSchema = z.object({
  province: z
    .string()
    .trim()
    .min(1, 'La provincia es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
  municipality: z
    .string()
    .trim()
    .min(1, 'El municipio es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  district: z
    .string()
    .trim()
    .min(1, 'El distrito es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  neighborhood: z
    .string()
    .trim()
    .min(1, 'El reparto es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  address: z
    .string()
    .trim()
    .min(1, 'La dirección es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
  reference: z
    .string()
    .trim()
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
})

export const checkoutOrderSchema = z
  .object({
    mode: z.enum(['new', 'existing']),
    customer: customerSchema,
    customerId: z.string(),
    addressSource: z.enum(['saved', 'new']),
    addressId: z.string(),
    address: addressSchema,
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'new') {
      return
    }

    if (!values.customerId.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona un cliente',
        path: ['customerId'],
      })
    }

    if (values.addressSource === 'saved') {
      if (!values.addressId.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecciona una dirección',
          path: ['addressId'],
        })
      }
      return
    }

    const addressResult = addressSchema.safeParse(values.address)
    if (!addressResult.success) {
      for (const issue of addressResult.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['address', ...issue.path],
        })
      }
    }
  })
