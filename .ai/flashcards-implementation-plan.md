# API Endpoint Implementation Plan: Flashcards CRUD

## 1. Przegląd punktu końcowego

Implementacja pełnego CRUD dla fiszek użytkownika z obsługą paginacji, filtrowania i sortowania. Umożliwia tworzenie fiszek manualnie lub z generacji AI (bulk operation).

## 2. Szczegóły żądania

### GET `/api/flashcards`
**Metoda**: `GET`  
**URL**: `/api/flashcards`  
**Query parameters**:
- `page` (number, optional, default: 1, min: 1)
- `limit` (number, optional, default: 10, min: 1, max: 100)
- `sort` (string, optional, default: "created_at", allowed: "created_at", "updated_at")
- `order` (string, optional, default: "desc", allowed: "asc", "desc")
- `source` (string, optional, allowed: "manual", "ai-full", "ai-edited")
- `generation_id` (number, optional)

**Headers**: `Authorization: Bearer <token>`  
**Response Type**: `PaginatedFlashcardsDto`

### GET `/api/flashcards/[id]`
**Metoda**: `GET`  
**URL**: `/api/flashcards/{id}`  
**Path parameters**:
- `id` (number, required, positive integer)

**Headers**: `Authorization: Bearer <token>`  
**Response Type**: `FlashcardDto`

### POST `/api/flashcards`
**Metoda**: `POST`  
**URL**: `/api/flashcards`  
**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body Type**: `CreateFlashcardsCommand`
```typescript
{
  flashcards: [
    {
      front: string,        // 1-200 chars
      back: string,         // 1-500 chars
      source: "manual",
      generation_id: null
    },
    // lub
    {
      front: string,        // 1-200 chars
      back: string,         // 1-500 chars
      source: "ai-full" | "ai-edited",
      generation_id: number // musi należeć do user_id
    }
  ]
}
```
**Response Type**: `{ flashcards: FlashcardDto[] }` (status 201)

### PATCH `/api/flashcards/[id]`
**Metoda**: `PATCH`  
**URL**: `/api/flashcards/{id}`  
**Path parameters**:
- `id` (number, required, positive integer)

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body Type**: `UpdateFlashcardCommand` (partial)
```typescript
{
  front?: string,         // 1-200 chars
  back?: string,          // 1-500 chars
  source?: "ai-edited" | "manual"  // nie "ai-full"
}
```
**Response Type**: `FlashcardDto`

### DELETE `/api/flashcards/[id]`
**Metoda**: `DELETE`  
**URL**: `/api/flashcards/{id}`  
**Path parameters**:
- `id` (number, required, positive integer)

**Headers**: `Authorization: Bearer <token>`  
**Response**: `{ message: "Flashcard deleted successfully" }` (status 200)

## 3. Wykorzystywane typy

Z `types.ts`:
- `FlashcardDto` - response object
- `PaginatedFlashcardsDto` - list response
- `CreateFlashcardsCommand` - bulk create
- `FlashcardCreateDto` - single flashcard (discriminated union)
- `UpdateFlashcardCommand` - partial update
- `FLASHCARD_VALIDATION` - validation constants

## 4. Szczegóły odpowiedzi

**Success responses**:
- **200**: `FlashcardDto` (GET by id, PATCH) lub `PaginatedFlashcardsDto` (GET list) lub `{ message: string }` (DELETE)
- **201**: `{ flashcards: FlashcardDto[] }` (POST)

**Error responses** (wszystkie z `Content-Type: application/json`):
- **400**: `{ error: "Validation error", details: [{ path: string, message: string }] }` lub `{ error: "Invalid JSON in request body" }`
- **401**: `{ error: "Unauthorized" }` (brak tokenu lub nieprawidłowy token)
- **404**: `{ error: "Flashcard not found" }` (nie istnieje lub nie należy do użytkownika)
- **500**: `{ error: "An unexpected error occurred" }` (błędy DB lub nieoczekiwane)

## 5. Przepływ danych

1. **Middleware** (`src/middleware/index.ts`) → weryfikacja auth token → `context.locals.supabase` + `context.locals.user`
2. **Endpoint** → parsowanie JSON body (try/catch, zwrot 400 jeśli nieprawidłowy) → walidacja Zod (safeParse) → wywołanie service
3. **Service** → query Supabase z `locals.supabase` i filtrem `user_id` → zwrot danych
4. **Endpoint** → formatowanie response → `new Response(JSON.stringify(data), { status, headers })`

**Specjalne przypadki**:
- **POST**: Walidacja `generation_id` - jeśli podane, sprawdź czy generation należy do `user_id` przed insertem (query do tabeli `generations`)
- **GET list**: Budowanie dynamicznego query z filtrami (`.eq()`, `.order()`, `.range()` dla paginacji)
- **PATCH/DELETE**: Sprawdzenie czy flashcard należy do użytkownika przed operacją (zwrot 404 jeśli nie)

## 6. Względy bezpieczeństwa

- Wszystkie endpointy wymagają autentykacji - middleware ustawia `locals.user` (typ: `User` z Supabase Auth)
- Jeśli `locals.user` jest `undefined` → zwróć 401 na początku endpointu (early return)
- Row-level filtering: zawsze dodawaj `.eq('user_id', locals.user.id)` do queries
- Walidacja `generation_id`: przed utworzeniem fiszek sprawdź `SELECT id FROM generations WHERE id = ? AND user_id = ?`
- Sanityzacja input przez Zod przed zapisem do DB (automatyczne escapowanie przez Supabase)
- Używanie `locals.supabase` zamiast globalnego importu `supabaseClient`
- Nigdy nie ujawniaj w response czy zasób istnieje, ale należy do innego użytkownika (zawsze 404)

## 7. Obsługa błędów

**Struktura try/catch w endpoincie**:
1. Zewnętrzny try/catch dla nieoczekiwanych błędów (500)
2. Wewnętrzny try/catch dla `request.json()` (400 jeśli nieprawidłowy JSON)
3. `safeParse()` dla walidacji Zod (zwrot 400 z details)
4. Service może rzucić błędy - obsłużyć lub przekazać do zewnętrznego catch

**Konkretne przypadki**:
- **401**: Sprawdzenie `if (!locals.user)` na początku endpointu → early return
- **400**: Nieprawidłowy JSON → `{ error: "Invalid JSON in request body" }`
- **400**: Zod validation fail → `{ error: "Validation error", details: [...] }` (mapowanie `error.errors`)
- **404**: Query zwraca null lub empty array → `{ error: "Flashcard not found" }`
- **500**: Unexpected errors → logowanie `console.error()` + `{ error: "An unexpected error occurred" }`

## 8. Rozważania dotyczące wydajności

- Indeksy DB: `user_id`, `generation_id`, `created_at` (dla sortowania)
- Pagination z limitem max 100 items
- `.select()` tylko potrzebnych kolumn (FlashcardDto)
- Bulk insert w jednej transakcji (POST)

## 9. Etapy wdrożenia

1. **Walidacja** (`src/lib/validation.schemas.ts`):
   - `listFlashcardsQuerySchema` - walidacja query params (page, limit, sort, order, source, generation_id)
   - `flashcardIdSchema` - walidacja path param (positive int)
   - `createFlashcardsSchema` - już istnieje
   - `updateFlashcardSchema` - już istnieje

2. **Service** (`src/lib/flashcards.service.ts`):
   - `listFlashcards(supabase, userId, filters)` → Promise<PaginatedFlashcardsDto>
   - `getFlashcardById(supabase, userId, id)` → Promise<FlashcardDto | null>
   - `createFlashcards(supabase, userId, command)` → Promise<FlashcardDto[]>
   - `updateFlashcard(supabase, userId, id, command)` → Promise<FlashcardDto | null>
   - `deleteFlashcard(supabase, userId, id)` → Promise<boolean>

3. **Endpointy**:
   - `/src/pages/api/flashcards/index.ts` - export `GET` i `POST` jako `APIRoute`
   - `/src/pages/api/flashcards/[id].ts` - export `GET`, `PATCH`, `DELETE` jako `APIRoute`
   - Dodać `export const prerender = false;` w obu plikach

