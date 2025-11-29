/**
 * GET /api/flashcards - List flashcards with pagination and filters
 * POST /api/flashcards - Create one or more flashcards (bulk operation)
 */

import type { APIRoute } from "astro";
import { listFlashcardsQuerySchema, createFlashcardsSchema } from "../../lib/validation.schemas";
import { listFlashcards, createFlashcards } from "../../lib/flashcards.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { CreateFlashcardsCommand, PaginatedFlashcardsDto } from "../../types";

export const prerender = false;

/**
 * GET /api/flashcards
 * List flashcards with pagination and optional filters
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
      source: url.searchParams.get("source"),
      generation_id: url.searchParams.get("generation_id"),
    };

    const validation = listFlashcardsQuerySchema.safeParse(queryParams);

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

    const filters = validation.data;

    // Step 2: Call service to fetch flashcards
    const result: PaginatedFlashcardsDto = await listFlashcards(locals.supabase, DEFAULT_USER_ID, filters);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Handle unexpected errors
    console.error("Unexpected error in GET /api/flashcards:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/flashcards
 * Create one or more flashcards (bulk operation)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate input with Zod
    const validation = createFlashcardsSchema.safeParse(body);

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

    const command: CreateFlashcardsCommand = validation.data;

    // Step 3: Call service to create flashcards
    try {
      const flashcards = await createFlashcards(locals.supabase, DEFAULT_USER_ID, command);

      return new Response(JSON.stringify({ flashcards }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle service-specific errors
      if (error instanceof Error) {
        if (error.message.includes("Generation") && error.message.includes("not found")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    // Step 4: Handle unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

