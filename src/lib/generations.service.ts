/**
 * Generations service
 *
 * Handles business logic for AI-powered flashcard generation
 */

import { createHash } from "crypto";
import type { SupabaseClient } from "../db/supabase.client";
import { DEFAULT_USER_ID } from "../db/supabase.client";
import type { GenerationResultDto, FlashcardProposalDto } from "../types";
import type { GenerationErrorCode } from "./error-codes";

/**
 * Calculate MD5 hash of source text
 */
function calculateHash(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

/**
 * Log generation error to database
 */
async function logGenerationError(
  supabase: SupabaseClient,
  errorCode: GenerationErrorCode,
  errorMessage: string,
  model: string,
  sourceTextHash: string,
  sourceTextLength: number
): Promise<void> {
  try {
    await supabase.from("generation_error_logs").insert({
      user_id: DEFAULT_USER_ID,
      error_code: errorCode,
      error_message: errorMessage,
      model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
    });
  } catch (error) {
    // Log to console if database logging fails
    console.error("Failed to log generation error:", error);
  }
}

/**
 * Create AI generation and return flashcard proposals
 */
export async function createGeneration(supabase: SupabaseClient, sourceText: string): Promise<GenerationResultDto> {
  const sourceTextHash = calculateHash(sourceText);
  const sourceTextLength = sourceText.length;
  const model = "mock-model-v1"; // TODO: Replace with actual model name from AI service

  try {
    // TODO: Call AI service to generate flashcards
    // For now, return mock data
    const mockFlashcards: FlashcardProposalDto[] = [
      {
        front: "Example Question 1",
        back: "Example Answer 1",
        source: "ai-full",
      },
      {
        front: "Example Question 2",
        back: "Example Answer 2",
        source: "ai-full",
      },
    ];

    const generationDuration = 1000; // Mock duration in ms
    const generatedCount = mockFlashcards.length;

    // Save generation metadata to database
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: DEFAULT_USER_ID,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        model,
        generated_count: generatedCount,
        generation_duration: generationDuration,
      })
      .select("id")
      .single();

    if (insertError || !generation) {
      const errorMessage = insertError?.message || "Failed to insert generation record";
      console.error("Database error details:", {
        error: insertError,
        message: errorMessage,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      await logGenerationError(supabase, "DATABASE_ERROR", errorMessage, model, sourceTextHash, sourceTextLength);
      throw new Error("Failed to save generation");
    }

    return {
      generation_id: generation.id,
      flashcards_proposals: mockFlashcards,
      generated_count: generatedCount,
    };
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error instanceof Error && error.message === "Failed to save generation") {
      throw error;
    }

    // Log unexpected errors
    await logGenerationError(
      supabase,
      "AI_SERVICE_ERROR",
      error instanceof Error ? error.message : "Unknown error",
      model,
      sourceTextHash,
      sourceTextLength
    );

    throw new Error("AI service is temporarily unavailable");
  }
}
