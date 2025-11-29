/**
 * Service layer for flashcards operations
 *
 * This module contains all business logic for CRUD operations on flashcards.
 * It handles database interactions with Supabase and data transformations.
 */

import type { SupabaseClient } from "../db/supabase.client";
import type {
  FlashcardDto,
  PaginatedFlashcardsDto,
  CreateFlashcardsCommand,
  UpdateFlashcardCommand,
} from "../types";

/**
 * Filters for listing flashcards
 */
export interface ListFlashcardsFilters {
  page: number;
  limit: number;
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
  source?: "manual" | "ai-full" | "ai-edited";
  generation_id?: number;
}

/**
 * List flashcards with pagination and filters
 */
export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  filters: ListFlashcardsFilters
): Promise<PaginatedFlashcardsDto> {
  const { page, limit, sort, order, source, generation_id } = filters;

  // Calculate offset for pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query
  let query = supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId);

  // Apply filters
  if (source) {
    query = query.eq("source", source);
  }

  if (generation_id !== undefined) {
    query = query.eq("generation_id", generation_id);
  }

  // Apply sorting and pagination
  query = query.order(sort, { ascending: order === "asc" }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data as FlashcardDto[],
    pagination: {
      page,
      limit,
      total: count ?? 0,
    },
  };
}

/**
 * Get a single flashcard by ID
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<FlashcardDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    // Return null if not found (PGRST116 is Supabase error code for "not found")
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as FlashcardDto;
}

/**
 * Create one or more flashcards (bulk operation)
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  command: CreateFlashcardsCommand
): Promise<FlashcardDto[]> {
  // Validate generation_id ownership for AI-generated flashcards
  const generationIds = command.flashcards
    .filter((f) => f.generation_id !== null)
    .map((f) => f.generation_id as number);

  if (generationIds.length > 0) {
    const uniqueGenerationIds = [...new Set(generationIds)];

    const { data: generations, error: genError } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .in("id", uniqueGenerationIds);

    if (genError) {
      throw genError;
    }

    const validGenerationIds = new Set(generations?.map((g) => g.id) ?? []);

    // Check if all generation_ids belong to the user
    for (const genId of uniqueGenerationIds) {
      if (!validGenerationIds.has(genId)) {
        throw new Error(`Generation with ID ${genId} not found or does not belong to user`);
      }
    }
  }

  // Prepare flashcards for insertion
  const flashcardsToInsert = command.flashcards.map((f) => ({
    user_id: userId,
    front: f.front,
    back: f.back,
    source: f.source,
    generation_id: f.generation_id,
  }));

  // Insert flashcards
  const { data, error } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select("id, front, back, source, generation_id, created_at, updated_at");

  if (error) {
    throw error;
  }

  return data as FlashcardDto[];
}

/**
 * Update an existing flashcard
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  id: number,
  command: UpdateFlashcardCommand
): Promise<FlashcardDto | null> {
  // First check if flashcard exists and belongs to user
  const existing = await getFlashcardById(supabase, userId, id);

  if (!existing) {
    return null;
  }

  // Update flashcard
  const { data, error } = await supabase
    .from("flashcards")
    .update({
      front: command.front,
      back: command.back,
      source: command.source,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as FlashcardDto;
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<boolean> {
  // First check if flashcard exists and belongs to user
  const existing = await getFlashcardById(supabase, userId, id);

  if (!existing) {
    return false;
  }

  const { error } = await supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

