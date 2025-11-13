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
- **Metoda HTTP**: POST
- **URL**: /api/generations
- **Headers**: Authorization (Supabase token przez middleware), Content-Type: application/json
- **Parametry wymagane**: `source_text` (string) – tekst o długości od 1000 do 10000 znaków
- **Przykład Request Body**:
  ```json
  {
    "source_text": "Lorem ipsum dolor sit amet... [1000-10000 znaków]"
  }
  ```

## 3. Wykorzystywane typy
- **CreateGenerationCommand**: Model wejściowy zawierający `source_text`
- **GenerationResultDto**: Model odpowiedzi zawierający `generation_id`, `flashcards_proposals` (FlashcardProposalDto[]), `generated_count`
- **FlashcardProposalDto**: Propozycja fiszki z polami `front`, `back`, `source` (wartość: "ai-full")
- **AIGenerationResponse**: Odpowiedź z AI service zawierająca `flashcards` i `generationDuration`
- **GenerationErrorCode**: Union type kodów błędów ('VALIDATION_ERROR' | 'AI_SERVICE_ERROR' | 'AI_RESPONSE_INVALID' | 'DATABASE_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'SERVICE_UNAVAILABLE')
- **GENERATION_VALIDATION**: Stałe z types.ts (SOURCE_TEXT_MIN_LENGTH: 1000, SOURCE_TEXT_MAX_LENGTH: 10000)

## 4. Szczegóły odpowiedzi
- **Sukces (HTTP 201)**:
  ```json
  {
    "generation_id": 123,
    "flashcards_proposals": [
       { "front": "Pytanie", "back": "Odpowiedź", "source": "ai-full" }
    ],
    "generated_count": 5
  }
  ```
- **Kody statusu**:
  - 201: Pomyślne utworzenie generacji
  - 400: Błędne dane wejściowe (niepoprawna długość source_text, brak pola, nieprawidłowy JSON)
  - 401: Brak uwierzytelnienia (brak/nieprawidłowy/wygasły token)
  - 500: Błąd serwera (błąd zapisu do bazy danych)
  - 503: Błąd serwisu AI (OpenRouter.ai niedostępny, timeout, rate limit)

## 5. Przepływ danych
1. Odbiór żądania POST z `source_text` (`src/pages/api/generations.ts`)
2. Walidacja za pomocą Zod schema (długość 1000-10000 znaków) + sprawdzenie uwierzytelnienia przez `context.locals.supabase.auth.getUser()`
3. Wywołanie `generations.service.ts` który:
   - Oblicza SHA-256 hash i długość source_text
   - Wywołuje `ai.service.ts` przekazując source_text do OpenRouter.ai z pomiarem czasu (generation_duration)
   - Parsuje i waliduje odpowiedź AI
   - Zapisuje metadane w tabeli `generations` (user_id, source_text_hash, source_text_length, model, generated_count, generation_duration)
   - Mapuje dane AI na FlashcardProposalDto[]
4. W przypadku błędu AI/database: logowanie do `generation_error_logs` (error_code, error_message, model, source_text_hash, source_text_length, user_id)
5. Zwrot GenerationResultDto z kodem 201 lub odpowiedni błąd (400/401/500/503)

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint zabezpieczony Supabase Auth, sprawdzenie `getUser()` w route handler
- **RLS**: Row Level Security w Supabase zapewnia dostęp tylko do własnych danych
- **Walidacja danych**: Zod schema, limity 1000-10000 znaków, TypeScript strict mode
- **Ochrona kluczy**: OPENROUTER_API_KEY w zmiennych środowiskowych (nie commitować .env)
- **Ochrona danych**: SHA-256 hash zamiast pełnego source_text, HTTPS

## 7. Obsługa błędów
- **400 Bad Request**: Zod validation fail → wczesny return z `zodValidation.error.message`
- **401 Unauthorized**: Brak/nieprawidłowy user → return "Authentication required"
- **503 Service Unavailable**: OpenRouter.ai niedostępny/timeout/rate limit → loguj do generation_error_logs, return "AI service is temporarily unavailable"
- **500 Internal Server Error**: Database error → loguj do generation_error_logs, return "Failed to save generation"
- **500 Unexpected**: Nieobsłużone wyjątki → try/catch logowania, return "An unexpected error occurred"
- **Struktura error log**: error_code, error_message, model, source_text_hash, source_text_length, user_id

## 8. Rozważania dotyczące wydajności
- **Timeout**: 60 sekund dla wywołania AI
- **Asynchroniczność**: Użycie async/await dla IO-bound operacji (AI call, DB write)
- **Monitoring**: Logowanie czasów odpowiedzi AI i DB do analizy wydajności

## 9. Plan implementacji
1. **Utworzenie endpointu API**: Plik `src/pages/api/generations.ts` z handlerami POST
2. **Walidacja wejścia**: Implementacja Zod schema dla CreateGenerationCommand (walidacja source_text 1000-10000 znaków)
3. **Serwis generacji**: Utworzenie `src/lib/generations.service.ts` zawierającego:
   - Funkcję obliczającą SHA-256 hash source_text
   - Logikę wywołującą ai.service.ts (mock na etapie developmentu, później integracja z OpenRouter.ai)
   - Zapis metadanych do tabeli `generations` przez Supabase client
   - Logowanie błędów do `generation_error_logs`
4. **Uwierzytelnienie**: Wykorzystanie `context.locals.supabase.auth.getUser()` w route handlerze
5. **Integracja komponentów**: Połączenie endpointu z generations.service.ts, mapowanie odpowiedzi na GenerationResultDto
6. **Obsługa błędów**: Implementacja try/catch z odpowiednimi kodami HTTP i logowaniem
