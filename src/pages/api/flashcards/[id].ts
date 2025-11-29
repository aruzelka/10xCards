/**
 * GET /api/flashcards/[id] - Get a single flashcard by ID
 * PATCH /api/flashcards/[id] - Update an existing flashcard
 * DELETE /api/flashcards/[id] - Delete a flashcard
 */

import type { APIRoute } from "astro";
import { flashcardIdSchema, updateFlashcardSchema } from "../../../lib/validation.schemas";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/flashcards.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { UpdateFlashcardCommand, FlashcardDto } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/[id]
 * Get a single flashcard by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: idValidation.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = idValidation.data;

    // Step 2: Call service to fetch flashcard
    const flashcard: FlashcardDto | null = await getFlashcardById(locals.supabase, DEFAULT_USER_ID, id);

    if (!flashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Handle unexpected errors
    console.error("Unexpected error in GET /api/flashcards/[id]:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/flashcards/[id]
 * Update an existing flashcard
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Validate path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: idValidation.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = idValidation.data;

    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Validate input with Zod
    const validation = updateFlashcardSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validation.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: UpdateFlashcardCommand = validation.data;

    // Step 4: Call service to update flashcard
    const updatedFlashcard: FlashcardDto | null = await updateFlashcard(locals.supabase, DEFAULT_USER_ID, id, command);

    if (!updatedFlashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    console.error("Unexpected error in PATCH /api/flashcards/[id]:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/flashcards/[id]
 * Delete a flashcard
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: idValidation.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = idValidation.data;

    // Step 2: Call service to delete flashcard
    const deleted: boolean = await deleteFlashcard(locals.supabase, DEFAULT_USER_ID, id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Flashcard deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Handle unexpected errors
    console.error("Unexpected error in DELETE /api/flashcards/[id]:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

