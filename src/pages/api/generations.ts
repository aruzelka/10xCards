/**
 * POST /api/generations
 *
 * Initiates AI-powered flashcard generation from source text
 *
 * @body {CreateGenerationCommand} - Source text (1000-10000 characters)
 * @returns {GenerationResultDto} - Generation ID and flashcard proposals
 */

import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../lib/validation.schemas";
import { createGeneration } from "../../lib/generations.service";
import type { CreateGenerationCommand, GenerationResultDto } from "../../types";

export const prerender = false;

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
    const validation = createGenerationSchema.safeParse(body);

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

    const command: CreateGenerationCommand = validation.data;

    // Step 3: Call generation service
    try {
      const result: GenerationResultDto = await createGeneration(locals.supabase, command.source_text);

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle service-specific errors
      if (error instanceof Error) {
        if (error.message === "Failed to save generation") {
          return new Response(JSON.stringify({ error: "Failed to save generation" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (error.message === "AI service is temporarily unavailable") {
          return new Response(JSON.stringify({ error: "AI service is temporarily unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    // Step 4: Handle unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
