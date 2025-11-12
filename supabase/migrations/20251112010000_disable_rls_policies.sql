-- ============================================================================
-- Migration: Disable RLS Policies for flashcards, generations, and generation_error_logs
-- Created: 2025-11-12
-- Description: Drops all RLS policies from the three main tables
--
-- Tables affected:
--   - generations: Drops all 4 policies (select, insert, update, delete)
--   - flashcards: Drops all 4 policies (select, insert, update, delete)
--   - generation_error_logs: Drops all 2 policies (select, insert)
--
-- Notes:
--   - RLS remains ENABLED on the tables, but all policies are removed
--   - This effectively blocks all access until new policies are created
--   - To allow access, either create new policies or disable RLS entirely
-- ============================================================================

-- ============================================================================
-- SECTION 1: Drop RLS Policies - generations table
-- ============================================================================

-- Drop policy for authenticated users to select their own generations
drop policy if exists "authenticated_users_select_own_generations" on generations;

-- Drop policy for authenticated users to insert their own generations
drop policy if exists "authenticated_users_insert_own_generations" on generations;

-- Drop policy for authenticated users to update their own generations
drop policy if exists "authenticated_users_update_own_generations" on generations;

-- Drop policy for authenticated users to delete their own generations
drop policy if exists "authenticated_users_delete_own_generations" on generations;

-- ============================================================================
-- SECTION 2: Drop RLS Policies - flashcards table
-- ============================================================================

-- Drop policy for authenticated users to select their own flashcards
drop policy if exists "authenticated_users_select_own_flashcards" on flashcards;

-- Drop policy for authenticated users to insert their own flashcards
drop policy if exists "authenticated_users_insert_own_flashcards" on flashcards;

-- Drop policy for authenticated users to update their own flashcards
drop policy if exists "authenticated_users_update_own_flashcards" on flashcards;

-- Drop policy for authenticated users to delete their own flashcards
drop policy if exists "authenticated_users_delete_own_flashcards" on flashcards;

-- ============================================================================
-- SECTION 3: Drop RLS Policies - generation_error_logs table
-- ============================================================================

-- Drop policy for authenticated users to select their own error logs
drop policy if exists "authenticated_users_select_own_error_logs" on generation_error_logs;

-- Drop policy for authenticated users to insert their own error logs
drop policy if exists "authenticated_users_insert_own_error_logs" on generation_error_logs;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

