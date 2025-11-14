/**
 * Zod validation schemas for API endpoints
 *
 * This module contains all validation schemas used across the API
 */

import { z } from "zod";
import { GENERATION_VALIDATION, FLASHCARD_VALIDATION } from "../types";

/**
 * Schema for CreateGenerationCommand
 * Validates source_text length (1000-10000 characters)
 */
export const createGenerationSchema = z.object({
  source_text: z
    .string()
    .min(GENERATION_VALIDATION.SOURCE_TEXT_MIN_LENGTH, {
      message: `Source text must be at least ${GENERATION_VALIDATION.SOURCE_TEXT_MIN_LENGTH} characters long`,
    })
    .max(GENERATION_VALIDATION.SOURCE_TEXT_MAX_LENGTH, {
      message: `Source text must not exceed ${GENERATION_VALIDATION.SOURCE_TEXT_MAX_LENGTH} characters`,
    }),
});

/**
 * Schema for FlashcardCreateDto (manual)
 */
export const flashcardCreateManualSchema = z.object({
  front: z.string().min(FLASHCARD_VALIDATION.FRONT_MIN_LENGTH).max(FLASHCARD_VALIDATION.FRONT_MAX_LENGTH),
  back: z.string().min(FLASHCARD_VALIDATION.BACK_MIN_LENGTH).max(FLASHCARD_VALIDATION.BACK_MAX_LENGTH),
  source: z.literal("manual"),
  generation_id: z.null(),
});

/**
 * Schema for FlashcardCreateDto (AI-generated)
 */
export const flashcardCreateAiSchema = z.object({
  front: z.string().min(FLASHCARD_VALIDATION.FRONT_MIN_LENGTH).max(FLASHCARD_VALIDATION.FRONT_MAX_LENGTH),
  back: z.string().min(FLASHCARD_VALIDATION.BACK_MIN_LENGTH).max(FLASHCARD_VALIDATION.BACK_MAX_LENGTH),
  source: z.enum(["ai-full", "ai-edited"]),
  generation_id: z.number().int().positive(),
});

/**
 * Schema for CreateFlashcardsCommand
 */
export const createFlashcardsSchema = z.object({
  flashcards: z
    .array(z.discriminatedUnion("source", [flashcardCreateManualSchema, flashcardCreateAiSchema]))
    .min(1, { message: "At least one flashcard is required" }),
});

/**
 * Schema for UpdateFlashcardCommand
 */
export const updateFlashcardSchema = z
  .object({
    front: z.string().min(FLASHCARD_VALIDATION.FRONT_MIN_LENGTH).max(FLASHCARD_VALIDATION.FRONT_MAX_LENGTH).optional(),
    back: z.string().min(FLASHCARD_VALIDATION.BACK_MIN_LENGTH).max(FLASHCARD_VALIDATION.BACK_MAX_LENGTH).optional(),
    source: z.enum(["ai-edited", "manual"]).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined || data.source !== undefined, {
    message: "At least one field must be provided for update",
  });
