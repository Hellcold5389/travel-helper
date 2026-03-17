// Zod schemas for validation

import { z } from 'zod';

export const CreateTripSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  budget: z.number().optional(),
  preferences: z.object({
    travelStyle: z.enum(['relax', 'adventure', 'culture', 'food', 'nature']).optional(),
    pace: z.enum(['slow', 'moderate', 'fast']).optional(),
    groupSize: z.number().min(1).optional(),
  }).optional(),
});

export const VisaQuerySchema = z.object({
  nationality: z.string().length(2, 'Use ISO 3166-1 alpha-2 country code'),
  destination: z.string().length(2, 'Use ISO 3166-1 alpha-2 country code'),
});

export const UserPreferencesSchema = z.object({
  nationality: z.string().length(2).optional(),
  language: z.string().length(2).default('en'),
  currency: z.string().length(3).default('USD'),
  notifications: z.object({
    visaExpiry: z.boolean().default(true),
    policyChanges: z.boolean().default(true),
    tripReminders: z.boolean().default(true),
  }).default({}),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type VisaQueryInput = z.infer<typeof VisaQuerySchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;