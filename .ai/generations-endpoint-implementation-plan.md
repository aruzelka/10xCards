# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generations` umożliwia użytkownikom inicjację procesu generowania AI fiszek edukacyjnych na podstawie dostarczonego tekstu źródłowego. System wywołuje zewnętrzną usługę AI (OpenRouter.ai), zapisuje metadane generacji w bazie danych i zwraca propozycje fiszek do akceptacji przez użytkownika.

**Główne funkcje:**
- Walidacja tekstu źródłowego (1000-10000 znaków)
- Wywołanie modelu AI przez OpenRouter.ai do wygenerowania fiszek
- Zapisanie metadanych generacji do tabeli `generations`
- Zwrócenie propozycji fiszek użytkownikowi
- Logowanie błędów do tabeli `generation_error_logs` w przypadku niepowodzenia

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/generations`

### Parametry

#### Wymagane (Request Body):
```typescript
{
  "source_text": string // 1000-10000 znaków
}
```

#### Opcjonalne:
Brak

### Headers
- `Authorization`: Token uwierzytelnienia Supabase (przekazywany automatycznie przez middleware)
- `Content-Type`: `application/json`

### Przykład żądania
```json
{
  "source_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit... [1000-10000 znaków]"
}
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

```typescript
// Request
interface CreateGenerationCommand {
  source_text: string;
}

// Response
interface GenerationResultDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}

interface FlashcardProposalDto {
  front: string;
  back: string;
  source: 'ai-full';
}

// Constants
const GENERATION_VALIDATION = {
  SOURCE_TEXT_MIN_LENGTH: 1000,
  SOURCE_TEXT_MAX_LENGTH: 10000,
}
```

### Typy z database.types.ts:

```typescript
// Dla zapisu do bazy
Tables<'generations'>['Insert']
Tables<'generation_error_logs'>['Insert']
```

### Nowe typy do dodania w services:

```typescript
// W src/lib/ai.service.ts
interface AIGenerationRequest {
  sourceText: string;
  model?: string;
}

interface AIGenerationResponse {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  generationDuration: number;
}

// Kody błędów
type GenerationErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'AI_RESPONSE_INVALID'
  | 'DATABASE_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE';
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "Co to jest TypeScript?",
      "back": "TypeScript to nadzbiór JavaScript dodający statyczne typowanie.",
      "source": "ai-full"
    },
    {
      "front": "Jakie są korzyści z używania TypeScript?",
      "back": "Lepsze wykrywanie błędów, lepsza dokumentacja kodu, wsparcie IDE.",
      "source": "ai-full"
    }
  ],
  "generated_count": 2
}
```

### Błąd walidacji (400 Bad Request)
```json
{
  "error": "Validation error",
  "details": "source_text must be between 1000 and 10000 characters"
}
```

### Błąd uwierzytelnienia (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "details": "Authentication required"
}
```

### Błąd serwera (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "details": "Failed to generate flashcards"
}
```

### Service Unavailable (503)
```json
{
  "error": "Service unavailable",
  "details": "AI service is temporarily unavailable"
}
```

## 5. Przepływ danych

### Sekwencja operacji:

1. **Przyjęcie żądania** (`src/pages/api/generations.ts`)
   - Odbiór POST request z body zawierającym `source_text`
   - Ekstrakcja użytkownika z `context.locals.supabase`

2. **Walidacja żądania**
   - Walidacja formatu JSON za pomocą Zod
   - Sprawdzenie długości `source_text` (1000-10000 znaków)
   - Walidacja uwierzytelnienia użytkownika

3. **Przygotowanie danych** (`src/lib/generations.service.ts`)
   - Obliczenie hasha source_text (SHA-256)
   - Przygotowanie metadanych (długość tekstu, user_id)

4. **Wywołanie AI** (`src/lib/ai.service.ts`)
   - Wysłanie żądania do OpenRouter.ai z source_text
   - Pomiar czasu generowania (generation_duration)
   - Parsowanie odpowiedzi i walidacja struktury

5. **Zapis do bazy danych** (`src/lib/generations.service.ts`)
   - Utworzenie rekordu w tabeli `generations`:
     - `user_id`, `source_text_hash`, `source_text_length`
     - `model`, `generated_count`, `generation_duration`
   - Pobranie `generation_id` z odpowiedzi

6. **Przygotowanie odpowiedzi**
   - Mapowanie danych AI na `FlashcardProposalDto[]`
   - Budowanie `GenerationResultDto`
   - Zwrócenie odpowiedzi z kodem 201

7. **Obsługa błędów** (w przypadku niepowodzenia)
   - Logowanie błędu do `generation_error_logs`
   - Zwrócenie odpowiedniego kodu błędu i komunikatu

### Diagram przepływu:

```
Client Request
      ↓
[Astro API Route] /api/generations.ts
      ↓
[Walidacja Zod] CreateGenerationCommand
      ↓
[Auth Check] Supabase User
      ↓
[Generations Service] generations.service.ts
      ↓ (hash, metadata)
[AI Service] ai.service.ts → OpenRouter.ai
      ↓ (flashcards proposals)
[Database] Supabase → generations table
      ↓ (generation_id)
[Response] GenerationResultDto → Client
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie i autoryzacja:
- **Wymagane uwierzytelnienie**: Sprawdzenie czy użytkownik jest zalogowany przez `context.locals.supabase.auth.getUser()`
- **User ID**: Pobranie user_id z sesji i użycie go przy zapisie do bazy
- **RLS (Row Level Security)**: Polityki Supabase zapewniają, że użytkownik może operować tylko na swoich danych

### Walidacja danych wejściowych:
- **Zod Schema**: Ścisła walidacja struktury i typu danych
- **Długość tekstu**: Wymuszenie limitu 1000-10000 znaków
- **Sanityzacja**: Usunięcie potencjalnie niebezpiecznych znaków (jeśli potrzebne)
- **Type safety**: TypeScript zapewnia bezpieczeństwo typów

### Ochrona API:
- **Rate Limiting** (opcjonalne, do rozważenia):
  - Limit żądań na użytkownika (np. 10 generacji/godzinę)
  - Limit na IP address
- **Koszty AI**: Kontrola kosztów poprzez limity długości tekstu
- **API Keys**: Klucze OpenRouter.ai przechowywane w zmiennych środowiskowych

### Ochrona danych:
- **Hashowanie tekstu**: SHA-256 hash zamiast przechowywania pełnego tekstu
- **Nie przechowujemy source_text**: Zmniejszenie ryzyka wycieku danych
- **HTTPS**: Wszystkie połączenia przez szyfrowane połączenia

### Potencjalne zagrożenia i mitigacje:

| Zagrożenie | Mitigacja |
|------------|-----------|
| Injection attacks | Zod walidacja, brak bezpośredniego SQL |
| Nadużycia kosztowne | Limity znaków, rate limiting |
| Brak uwierzytelnienia | Middleware + sprawdzenie w route |
| Wyciek kluczy API | Zmienne środowiskowe, nie commitujemy .env |
| DDoS | Rate limiting, monitoring |

## 7. Obsługa błędów

### Scenariusze błędów i ich obsługa:

#### 1. Błędy walidacji (400 Bad Request)

**Przypadki:**
- `source_text` poza zakresem 1000-10000 znaków
- Brak pola `source_text`
- Nieprawidłowy format JSON
- Nieprawidłowy typ danych

**Obsługa:**
```typescript
// Wczesne zwrócenie błędu
if (!zodValidation.success) {
  return new Response(
    JSON.stringify({ 
      error: 'Validation error', 
      details: zodValidation.error.message 
    }), 
    { status: 400 }
  );
}
```

**Logowanie:** Brak (błędy użytkownika, nie systemu)

#### 2. Błędy uwierzytelnienia (401 Unauthorized)

**Przypadki:**
- Brak tokena uwierzytelnienia
- Token wygasł
- Nieprawidłowy token

**Obsługa:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({ 
      error: 'Unauthorized', 
      details: 'Authentication required' 
    }), 
    { status: 401 }
  );
}
```

**Logowanie:** Brak

#### 3. Błędy serwisu AI (500/503)

**Przypadki:**
- OpenRouter.ai niedostępny (503)
- Timeout połączenia (500)
- Nieprawidłowa odpowiedź z API (500)
- Rate limit OpenRouter.ai (429 → 503)
- Błąd parsowania odpowiedzi (500)

**Obsługa:**
```typescript
try {
  const aiResponse = await aiService.generateFlashcards(sourceText);
} catch (error) {
  // Logowanie do generation_error_logs
  await errorLogService.logError({
    error_code: 'AI_SERVICE_ERROR',
    error_message: error.message,
    model: AI_MODEL,
    source_text_hash: hash,
    source_text_length: sourceText.length,
    user_id: user.id
  });
  
  return new Response(
    JSON.stringify({ 
      error: 'Service unavailable', 
      details: 'AI service is temporarily unavailable' 
    }), 
    { status: 503 }
  );
}
```

**Logowanie:** TAK - do `generation_error_logs`

#### 4. Błędy bazy danych (500)

**Przypadki:**
- Błąd połączenia z Supabase
- Błąd zapisu do tabeli `generations`
- Naruszenie constraintów (mało prawdopodobne)

**Obsługa:**
```typescript
const { data, error } = await supabase
  .from('generations')
  .insert(generationData)
  .select()
  .single();

if (error) {
  await errorLogService.logError({
    error_code: 'DATABASE_ERROR',
    error_message: error.message,
    model: AI_MODEL,
    source_text_hash: hash,
    source_text_length: sourceText.length,
    user_id: user.id
  });
  
  return new Response(
    JSON.stringify({ 
      error: 'Internal server error', 
      details: 'Failed to save generation' 
    }), 
    { status: 500 }
  );
}
```

**Logowanie:** TAK - do `generation_error_logs`

#### 5. Nieoczekiwane błędy (500)

**Przypadki:**
- Wszelkie nieobsłużone wyjątki
- Błędy runtime

**Obsługa:**
```typescript
try {
  // Cały flow
} catch (error) {
  console.error('Unexpected error in generations endpoint:', error);
  
  // Próba logowania (jeśli możliwe)
  try {
    await errorLogService.logError({
      error_code: 'UNEXPECTED_ERROR',
      error_message: error.message || 'Unknown error',
      model: AI_MODEL || 'unknown',
      source_text_hash: hash || '',
      source_text_length: sourceText?.length || 0,
      user_id: user?.id || ''
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
  
  return new Response(
    JSON.stringify({ 
      error: 'Internal server error', 
      details: 'An unexpected error occurred' 
    }), 
    { status: 500 }
  );
}
```

**Logowanie:** TAK - próba logowania do `generation_error_logs`

### Struktura rekordu błędu:

```typescript
interface GenerationErrorLogInsert {
  error_code: string;        // 'AI_SERVICE_ERROR', 'DATABASE_ERROR', etc.
  error_message: string;      // Szczegółowy komunikat błędu
  model: string;              // Nazwa użytego modelu AI
  source_text_hash: string;   // SHA-256 hash tekstu źródłowego
  source_text_length: number; // Długość tekstu w znakach
  user_id: string;            // ID użytkownika
  // created_at dodawane automatycznie przez bazę
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

#### 1. Czas odpowiedzi AI (główne wąskie gardło)
- **Problem**: Generowanie fiszek przez AI może trwać 5-30 sekund
- **Mitigacja**:
  - Użycie szybszego modelu (kompromis jakość/szybkość)
  - Informowanie użytkownika o czasie oczekiwania (UI loader)
  - Rozważenie async processing z webhook (przyszłość)
  - Timeout zabezpieczający (np. 60 sekund)

#### 2. Zapis do bazy danych
- **Problem**: Opóźnienie zapisu metadanych
- **Mitigacja**:
  - Supabase jest szybkie dla pojedynczych insert
  - Indeksy na `user_id` i `created_at` (już w schemacie)
  - Brak dodatkowych operacji synchronicznych

#### 3. Hashowanie tekstu
- **Problem**: SHA-256 dla długich tekstów (do 10000 znaków)
- **Mitigacja**:
  - Operacja bardzo szybka (< 1ms)
  - Użycie natywnego crypto API
  - Brak znaczącego wpływu na wydajność

#### 4. Liczba równoczesnych żądań
- **Problem**: Wiele użytkowników generujących jednocześnie
- **Mitigacja**:
  - Rate limiting per user
  - Queue system (przyszłość)
  - Monitoring i skalowanie infrastruktury

### Strategie optymalizacji:

#### Krótkoterminowe:
1. **Wybór optymalnego modelu AI**: Balance między szybkością a jakością
2. **Caching**: Rozważenie cache dla identycznych source_text_hash (opcjonalne)
3. **Timeout handling**: Graceful handling długich requestów
4. **Connection pooling**: Supabase zarządza tym automatycznie

#### Długoterminowe:
1. **Async processing**: 
   - POST zwraca natychmiast generation_id
   - Processing w tle
   - Webhook/polling dla statusu
2. **Background jobs**: Queue system (Bull, BullMQ)
3. **CDN**: Dla statycznych assets
4. **Database optimization**: Monitoring slow queries

### Metryki do monitorowania:
- Średni czas odpowiedzi AI
- 95th percentile czasu generowania
- Liczba błędów AI
- Liczba timeoutów
- Database query times
- Rate limit violations

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

**Zadanie:** Utworzenie plików serwisów i endpointu

**Pliki do utworzenia:**
```
src/lib/ai.service.ts
src/lib/generations.service.ts
src/lib/error-log.service.ts
src/pages/api/generations.ts
```

**Szczegóły:**
- Utworzenie pustych plików z podstawową strukturą
- Import niezbędnych typów i zależności

---

### Krok 2: Implementacja Error Log Service

**Zadanie:** Serwis do logowania błędów generacji

**Plik:** `src/lib/error-log.service.ts`

**Funkcjonalności:**
```typescript
// Główna funkcja
async function logGenerationError(
  supabase: SupabaseClient,
  errorData: {
    error_code: string;
    error_message: string;
    model: string;
    source_text_hash: string;
    source_text_length: number;
    user_id: string;
  }
): Promise<void>

// Helper do obliczania hasha
function calculateTextHash(text: string): string
```

**Zależności:**
- `@supabase/supabase-js` - SupabaseClient
- `crypto` - dla SHA-256

**Testy:**
- Poprawny zapis do generation_error_logs
- Obsługa błędów zapisu
- Walidacja wymaganych pól

---

### Krok 3: Implementacja AI Service

**Zadanie:** Komunikacja z OpenRouter.ai

**Plik:** `src/lib/ai.service.ts`

**Funkcjonalności:**
```typescript
// Główna funkcja generowania
async function generateFlashcards(
  sourceText: string,
  model?: string
): Promise<{
  flashcards: Array<{ front: string; back: string }>;
  generationDuration: number;
  model: string;
}>

// Helper do walidacji odpowiedzi AI
function validateAIResponse(response: unknown): boolean

// Helper do formatowania prompt
function buildGenerationPrompt(sourceText: string): string
```

**Konfiguracja:**
- Zmienne środowiskowe: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- Default model (np. `anthropic/claude-3-haiku`)
- Timeout: 60 sekund
- Retry logic: 2 próby w przypadku błędu sieci

**Prompt engineering:**
- Jasne instrukcje dla AI
- Format odpowiedzi (JSON z tablicą obiektów)
- Przykłady dobrych fiszek
- Ograniczenia (liczba fiszek, długość)

**Obsługa błędów:**
- Network errors → throw z kodem 'AI_SERVICE_ERROR'
- Timeout → throw z kodem 'AI_TIMEOUT'
- Invalid response → throw z kodem 'AI_RESPONSE_INVALID'
- Rate limit → throw z kodem 'RATE_LIMIT_EXCEEDED'

**Zależności:**
- `node-fetch` lub native fetch
- Pomiar czasu: `performance.now()` lub `Date.now()`

---

### Krok 4: Implementacja Generations Service

**Zadanie:** Orchestracja procesu generacji i zapis do bazy

**Plik:** `src/lib/generations.service.ts`

**Funkcjonalności:**
```typescript
// Główna funkcja orchestrująca
async function createGeneration(
  supabase: SupabaseClient,
  userId: string,
  sourceText: string
): Promise<GenerationResultDto>

// Helper do hashowania
function calculateSourceTextHash(text: string): string

// Helper do zapisu generacji
async function saveGeneration(
  supabase: SupabaseClient,
  generationData: Tables<'generations'>['Insert']
): Promise<number> // returns generation_id
```

**Przepływ w createGeneration:**
1. Oblicz hash i długość source_text
2. Wywołaj AI service (aiService.generateFlashcards)
3. Zapisz metadane do tabeli generations
4. Mapuj odpowiedź AI na FlashcardProposalDto[]
5. Zwróć GenerationResultDto

**Obsługa błędów:**
- Propaguj błędy z AI service
- Obsłuż błędy bazy danych
- Wszystkie błędy powinny być logowane przez wywołującego

**Zależności:**
- `./ai.service.ts`
- `crypto` dla hashowania
- Typy z `src/types.ts` i `src/db/database.types.ts`

---

### Krok 5: Implementacja Zod Schema

**Zadanie:** Walidacja request body

**Plik:** `src/pages/api/generations.ts` (na początku pliku)

**Schema:**
```typescript
import { z } from 'zod';
import { GENERATION_VALIDATION } from '../../types';

const createGenerationSchema = z.object({
  source_text: z.string()
    .min(
      GENERATION_VALIDATION.SOURCE_TEXT_MIN_LENGTH,
      `source_text must be at least ${GENERATION_VALIDATION.SOURCE_TEXT_MIN_LENGTH} characters`
    )
    .max(
      GENERATION_VALIDATION.SOURCE_TEXT_MAX_LENGTH,
      `source_text must be at most ${GENERATION_VALIDATION.SOURCE_TEXT_MAX_LENGTH} characters`
    )
});
```

**Walidacja:**
- Typ string
- Minimum 1000 znaków
- Maximum 10000 znaków
- Użycie stałych z types.ts

---

### Krok 6: Implementacja API Route

**Zadanie:** Główny endpoint POST /api/generations

**Plik:** `src/pages/api/generations.ts`

**Struktura:**
```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    // 2. Validate with Zod
    // 3. Check authentication
    // 4. Call generations service
    // 5. Return response 201
  } catch (error) {
    // Error handling with logging
  }
}
```

**Szczegółowy flow:**

1. **Parse body:**
```typescript
const body = await request.json();
```

2. **Walidacja Zod:**
```typescript
const validation = createGenerationSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({ 
      error: 'Validation error', 
      details: validation.error.issues[0].message 
    }), 
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

3. **Auth check:**
```typescript
const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ 
      error: 'Unauthorized', 
      details: 'Authentication required' 
    }), 
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

4. **Call service:**
```typescript
const result = await generationsService.createGeneration(
  locals.supabase,
  user.id,
  validation.data.source_text
);
```

5. **Return success:**
```typescript
return new Response(
  JSON.stringify(result), 
  { 
    status: 201, 
    headers: { 'Content-Type': 'application/json' } 
  }
);
```

6. **Error handling:**
```typescript
catch (error) {
  console.error('Error in POST /api/generations:', error);
  
  // Log to error table
  try {
    await errorLogService.logGenerationError(locals.supabase, {
      error_code: error.code || 'UNEXPECTED_ERROR',
      error_message: error.message || 'Unknown error',
      model: error.model || 'unknown',
      source_text_hash: error.hash || '',
      source_text_length: validation?.data?.source_text?.length || 0,
      user_id: user?.id || ''
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
  
  // Return appropriate error response
  const statusCode = error.code === 'AI_SERVICE_ERROR' ? 503 : 500;
  return new Response(
    JSON.stringify({ 
      error: 'Internal server error', 
      details: 'Failed to generate flashcards' 
    }), 
    { status: statusCode, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

### Krok 7: Konfiguracja zmiennych środowiskowych

**Zadanie:** Dodanie wymaganych zmiennych środowiskowych

**Plik:** `.env` (local) i konfiguracja production

**Zmienne:**
```env
# OpenRouter.ai
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3-haiku # lub inny model

# Supabase (już istniejące)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
```

**Dokumentacja:**
- Dodać do README.md instrukcje uzyskania klucza OpenRouter
- Udokumentować dostępne modele
- Dodać `.env.example` z przykładowymi wartościami

---

### Krok 8: Testy jednostkowe i integracyjne

**Zadanie:** Napisanie testów dla serwisów i endpointu

**Pliki testowe:**
```
src/lib/__tests__/ai.service.test.ts
src/lib/__tests__/generations.service.test.ts
src/lib/__tests__/error-log.service.test.ts
src/pages/api/__tests__/generations.test.ts
```

**Test cases:**

**AI Service:**
- Poprawna generacja fiszek
- Obsługa timeout
- Obsługa błędnej odpowiedzi AI
- Obsługa network error
- Walidacja formatu odpowiedzi

**Generations Service:**
- Pełny flow generacji
- Poprawny zapis do bazy
- Obliczanie hasha
- Obsługa błędów AI service
- Obsługa błędów database

**Error Log Service:**
- Poprawny zapis błędu
- Wszystkie wymagane pola
- Obsługa błędu zapisu

**API Endpoint:**
- Sukces 201 z poprawnymi danymi
- 400 dla zbyt krótkiego tekstu
- 400 dla zbyt długiego tekstu
- 400 dla braku source_text
- 401 dla niezalogowanego użytkownika
- 500 dla błędu AI service
- Poprawne logowanie błędów

**Narzędzia:**
- Vitest (lub Jest)
- Mock dla OpenRouter API
- Mock dla Supabase client
- Fixtures dla danych testowych

---

### Krok 9: Dokumentacja API

**Zadanie:** Dokumentacja endpointu dla developerów

**Plik:** `docs/api/generations.md` lub update do istniejącej dokumentacji

**Zawartość:**
- Opis endpointu
- Przykłady requestów (curl, JavaScript, Python)
- Wszystkie możliwe odpowiedzi
- Kody błędów i ich znaczenie
- Rate limiting (jeśli zaimplementowane)
- Best practices dla użytkowników API

**Format:**
- OpenAPI/Swagger specification (opcjonalnie)
- Markdown documentation (minimum)

---

### Krok 10: Monitoring i logging

**Zadanie:** Dodanie monitoringu i logowania

**Implementacja:**

1. **Structured logging:**
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  endpoint: '/api/generations',
  user_id: user.id,
  generation_id: result.generation_id,
  generated_count: result.generated_count,
  duration: generationDuration
}));
```

2. **Error tracking:**
- Integracja z Sentry (opcjonalnie)
- Logging błędów do pliku/external service

3. **Metrics:**
- Licznik requestów
- Średni czas generowania
- Rate błędów
- Użycie per user

**Tools:**
- Console.log (podstawowe)
- Sentry (error tracking)
- Prometheus/Grafana (metryki)
- Supabase Dashboard (database monitoring)

---

### Krok 11: Testy manualne end-to-end

**Zadanie:** Weryfikacja pełnego flow w środowisku dev

**Scenariusze testowe:**

1. **Happy path:**
   - Zaloguj się jako użytkownik
   - Wyślij POST z poprawnym source_text (np. 2000 znaków)
   - Zweryfikuj response 201
   - Sprawdź czy rekord w tabeli generations istnieje
   - Zweryfikuj structure response

2. **Edge cases:**
   - Dokładnie 1000 znaków
   - Dokładnie 10000 znaków
   - 999 znaków (powinno zwrócić 400)
   - 10001 znaków (powinno zwrócić 400)
   - Pusty source_text
   - null/undefined source_text

3. **Auth scenarios:**
   - Brak tokena → 401
   - Nieprawidłowy token → 401
   - Wygasły token → 401

4. **Error scenarios:**
   - Symulacja błędu AI (niepoprawny API key)
   - Symulacja timeout
   - Sprawdzenie czy błąd jest logowany w generation_error_logs

5. **Performance:**
   - Zmierz czas odpowiedzi
   - Przetestuj z różnymi długościami tekstu
   - Sprawdź behavior przy równoczesnych requestach

**Narzędzia:**
- Postman/Insomnia (API testing)
- curl (CLI testing)
- Browser DevTools (Network tab)
- Supabase Dashboard (database verification)

---

### Krok 12: Code review i refactoring

**Zadanie:** Przegląd kodu i optymalizacje

**Checklist:**
- [ ] Kod zgodny z coding guidelines (copilot-instructions.md)
- [ ] Obsługa błędów według zasady early returns
- [ ] Brak nested if statements
- [ ] Wszystkie funkcje mają pojedynczą odpowiedzialność
- [ ] TypeScript strict mode compliance
- [ ] Wszystkie promises są properly handled (await/catch)
- [ ] Brak hardcoded values (używamy zmiennych środowiskowych)
- [ ] Komentarze dla złożonej logiki
- [ ] Nazwy zmiennych są descriptive
- [ ] Usunięcie console.log debug statements
- [ ] ESLint passes bez warnings
- [ ] TypeScript compiles bez errors

**Refactoring:**
- Wydzielenie reusable helpers
- Simplifikacja złożonej logiki
- Poprawa czytelności
- Dodanie type guards gdzie potrzebne

---

### Krok 13: Deployment preparation

**Zadanie:** Przygotowanie do wdrożenia na produkcję

**Zadania:**

1. **Environment variables:**
   - Ustawienie production OPENROUTER_API_KEY
   - Weryfikacja wszystkich env vars na produkcji
   - Dodanie fallback values gdzie sensowne

2. **Database migrations:**
   - Weryfikacja czy tabele generations i generation_error_logs istnieją
   - Sprawdzenie indeksów
   - Weryfikacja RLS policies

3. **Security check:**
   - Audit zmiennych środowiskowych
   - Sprawdzenie czy klucze API są zabezpieczone
   - Weryfikacja CORS settings
   - Review authentication flow

4. **Performance optimization:**
   - Enable production builds (minification, etc.)
   - Verify connection pooling
   - Check timeout values

5. **Documentation update:**
   - README z instrukcjami deployment
   - API documentation
   - Environment variables documentation

---

### Krok 14: Deployment i monitoring

**Zadanie:** Wdrożenie na produkcję i monitoring

**Deployment:**
1. Merge do main branch (przez pull request)
2. Automated deployment przez GitHub Actions
3. Health check po deployment
4. Smoke tests na produkcji

**Post-deployment monitoring:**
- Monitoring błędów w Sentry (jeśli zaimplementowane)
- Sprawdzenie logów aplikacji
- Monitoring tabeli generation_error_logs
- Verify response times
- Check success rate

**Rollback plan:**
- Przygotowanie procedury rollback
- Backup bazy danych
- Feature flag (opcjonalnie)

---

### Krok 15: Post-deployment validation

**Zadanie:** Weryfikacja działania na produkcji

**Validation checklist:**
- [ ] Endpoint odpowiada na requests
- [ ] Authentication działa poprawnie
- [ ] Fiszki są generowane poprawnie
- [ ] Dane zapisują się do bazy
- [ ] Błędy są logowane
- [ ] Response times są akceptowalne (< 30s)
- [ ] Brak memory leaks
- [ ] Brak error spikes w logach

**User acceptance:**
- Test przez wewnętrznych użytkowników
- Zbieranie feedbacku
- Monitoring usage patterns

**Iteracja:**
- Analiza metryk
- Identyfikacja obszarów do poprawy
- Planowanie kolejnych iteracji

---

## Podsumowanie kroków implementacji

| Krok | Zadanie | Priorytet | Czas (est.) |
|------|---------|-----------|-------------|
| 1 | Przygotowanie struktury plików | Wysoki | 15 min |
| 2 | Error Log Service | Wysoki | 1-2h |
| 3 | AI Service | Krytyczny | 3-4h |
| 4 | Generations Service | Krytyczny | 2-3h |
| 5 | Zod Schema | Wysoki | 30 min |
| 6 | API Route | Krytyczny | 2-3h |
| 7 | Environment variables | Wysoki | 30 min |
| 8 | Testy | Wysoki | 4-6h |
| 9 | Dokumentacja | Średni | 2-3h |
| 10 | Monitoring | Średni | 1-2h |
| 11 | Testy manualne | Wysoki | 2-3h |
| 12 | Code review | Wysoki | 1-2h |
| 13 | Deployment prep | Wysoki | 1-2h |
| 14 | Deployment | Krytyczny | 1-2h |
| 15 | Validation | Wysoki | 1-2h |

**Łączny czas: 23-38 godzin**

## Dependency graph

```
Step 1 (Structure)
    ↓
Step 2 (Error Log) ──┐
    ↓                │
Step 3 (AI Service)  │
    ↓                │
Step 4 (Gen Service) │
    ↓                │
Step 5 (Zod) ────────┤
    ↓                │
Step 6 (API Route) ←─┘
    ↓
Step 7 (Env vars)
    ↓
Steps 8-15 (Testing, Deploy, Monitor)
```

**Kroki 2-5 mogą być wykonywane częściowo równolegle przez różnych developerów.**

