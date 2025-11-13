/**
 * Shared types for backend and frontend (Entities, DTOs, Command Models)
 *
 * This file contains Data Transfer Objects (DTOs) and Command Models
 * that are used across the API endpoints. All types are derived from
 * the database schema to ensure type safety and consistency.
 */

import type { Tables } from './db/database.types';

// ============================================================================
// Common Types
// ============================================================================

/**
 * Flashcard source type - tracks the origin of a flashcard
 */
export type FlashcardSource = 'manual' | 'ai-full' | 'ai-edited';

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}


// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Public flashcard object returned by API (restricted subset of columns)
 */
export type FlashcardDto = Pick<
  Tables<'flashcards'>,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;

/**
 * Paginated list of flashcards
 * Used by GET /api/flashcards
 */
export interface PaginatedFlashcardsDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

/**
 * Flashcard creation model (FlashcardCreateDto)
 * - For source 'manual': generation_id must be null
 * - For source 'ai-full' | 'ai-edited': generation_id must be a number
 * This discriminated union enforces the business rules at type level.
 */
export type FlashcardCreateDto =
  | { front: string; back: string; source: 'manual'; generation_id: null }
  | { front: string; back: string; source: 'ai-full' | 'ai-edited'; generation_id: number };

/**
 * Command model for creating one or more flashcards
 * Used by POST /api/flashcards
 */
export interface CreateFlashcardsCommand {
  flashcards: FlashcardCreateDto[];
}

/**
 * Command model for updating an existing flashcard
 * Used by PATCH /api/flashcards/{id}
 *
 * Only allows updating front, back, and source fields.
 * Source can only be 'ai-edited' or 'manual' (not 'ai-full' on update).
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
  source?: Extract<FlashcardSource, 'ai-edited' | 'manual'>;
}

// ============================================================================
// Generation DTOs
// ============================================================================

/**
 * Complete generation object returned by API
 * Directly maps to the generations table
 */
export type GenerationDto = Tables<'generations'>;

/**
 * Paginated list of generations
 * Used by GET /api/generations
 */
export interface PaginatedGenerationsDto {
  data: GenerationDto[];
  pagination: PaginationDto;
}

/**
 * Generation with associated flashcards
 * Used by GET /api/generations/{id}
 */
export interface GenerationWithFlashcardsDto extends GenerationDto {
  flashcards?: FlashcardDto[]; 
}

/**
 * Flashcard proposal from AI generation
 * Returned as part of GenerationResultDto
 */
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: 'ai-full';
}

/**
 * Result of AI generation request
 * Used by POST /api/generations
 */
export interface GenerationResultDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}

/**
 * Command model for initiating AI generation
 * Used by POST /api/generations
 *
 * source_text must be between 1000 and 10000 characters
 */
export interface CreateGenerationCommand {
  source_text: string;
}

// ============================================================================
// Generation Error Log DTOs
// ============================================================================

/**
 * Generation error log entry (full row)
 * Directly maps to the generation_error_logs table
 * Used by GET /api/generation-error-logs
 */
export type GenerationErrorLogDto = Pick<
  Tables<'generation_error_logs'>,
  'id' | 'error_code' | 'error_message' | 'model' | 'source_text_hash' | 'source_text_length' | 'created_at' | 'user_id'
>;

/**
 * Lista logów błędów (bez paginacji na ten moment)
 */
export interface GenerationErrorLogsListResponseDto {
  data: GenerationErrorLogDto[];
}

// ============================================================================
// Validation Constants
// ============================================================================

export const FLASHCARD_VALIDATION = {
  FRONT_MIN_LENGTH: 1,
  FRONT_MAX_LENGTH: 200,
  BACK_MIN_LENGTH: 1,
  BACK_MAX_LENGTH: 500,
} as const;

export const GENERATION_VALIDATION = {
  SOURCE_TEXT_MIN_LENGTH: 1000,
  SOURCE_TEXT_MAX_LENGTH: 10000,
} as const;