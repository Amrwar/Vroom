import { z } from 'zod';

export const WashTypeSchema = z.enum(['INNER', 'OUTER', 'FREE', 'FULL']);
export const PaymentTypeSchema = z.enum(['CASH', 'INSTAPAY']);
export const StatusSchema = z.enum(['IN_PROGRESS', 'FINISHED']);

export const CreateWashRecordSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').transform(v => v.trim().toUpperCase()),
  carType: z.string().optional().transform(v => v?.trim() || null),
  washType: WashTypeSchema,
  paymentType: PaymentTypeSchema.nullable().optional(),
  amountPaid: z.number().min(0, 'Amount must be 0 or positive').default(0),
  tipAmount: z.number().min(0, 'Tip must be 0 or positive').default(0),
  workerId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
}).refine(data => {
  if (data.washType === 'FREE') {
    return data.amountPaid === 0;
  }
  return true;
}, {
  message: 'FREE wash must have amount paid = 0',
  path: ['amountPaid'],
}).refine(data => {
  if (data.washType !== 'FREE' && data.amountPaid > 0) {
    return data.paymentType !== null && data.paymentType !== undefined;
  }
  return true;
}, {
  message: 'Payment type is required for paid washes',
  path: ['paymentType'],
});

export const UpdateWashRecordSchema = z.object({
  plateNumber: z.string().min(1).transform(v => v.trim().toUpperCase()).optional(),
  carType: z.string().nullable().optional().transform(v => v?.trim() || null),
  washType: WashTypeSchema.optional(),
  paymentType: PaymentTypeSchema.nullable().optional(),
  amountPaid: z.number().min(0).optional(),
  tipAmount: z.number().min(0).optional(),
  workerId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  entryTime: z.string().datetime().optional(),
  finishTime: z.string().datetime().nullable().optional(),
});

export const FinishWashRecordSchema = z.object({
  paymentType: PaymentTypeSchema.nullable().optional(),
  amountPaid: z.number().min(0).optional(),
  tipAmount: z.number().min(0).optional(),
});

export const CreateWorkerSchema = z.object({
  name: z.string().min(1, 'Worker name is required').transform(v => v.trim()),
});

export const UpdateWorkerSchema = z.object({
  name: z.string().min(1).transform(v => v.trim()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateWashRecordInput = z.infer<typeof CreateWashRecordSchema>;
export type UpdateWashRecordInput = z.infer<typeof UpdateWashRecordSchema>;
export type FinishWashRecordInput = z.infer<typeof FinishWashRecordSchema>;
export type CreateWorkerInput = z.infer<typeof CreateWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof UpdateWorkerSchema>;
