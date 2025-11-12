# Schemat bazy danych PostgreSQL - 10xCards

## 1. Tabele

### 1.1 users

This table is managed by Supabase Auth.

- `id`: UUID PRIMARY KEY
- `email`: VARCHAR(255) NOT NULL UNIQUE
- `encrypted_password`: VARCHAR NOT NULL
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT now()
- `confirmed_at`: TIMESTAMPTZ

---

### 1.2 generations

Przechowuje informacje o generacjach fiszek przez AI dla użytkowników.

- `id`: BIGSERIAL PRIMARY KEY
- `user_id`: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `model`: VARCHAR NOT NULL
- `generated_count`: INTEGER NOT NULL
- `accepted_unedited_count`: INTEGER NULLABLE
- `accepted_edited_count`: INTEGER NULLABLE
- `source_text_hash`: VARCHAR NOT NULL
- `source_text_length`: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- `generation_duration`: INTEGER NOT NULL
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT now()

---

### 1.3 flashcards

Główna tabela przechowująca fiszki użytkowników.

- `id`: BIGSERIAL PRIMARY KEY
- `user_id`: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `generation_id`: UUID REFERENCES generations(id) ON DELETE SET NULL
- `front`: VARCHAR(200) NOT NULL CHECK (length(front) > 0)
- `back`: VARCHAR(500) NOT NULL CHECK (length(back) > 0)
- `source`: VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- `due`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `stability`: REAL NOT NULL DEFAULT 0
- `difficulty`: REAL NOT NULL DEFAULT 0
- `last_reviewed_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

---

### 1.4 generation_error_logs

Przechowuje logi błędów generacji fiszek przez AI.

- `id`: BIGSERIAL PRIMARY KEY
- `user_id`: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `model`: VARCHAR NOT NULL
- `source_text_hash`: VARCHAR NOT NULL
- `source_text_length`: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- `error_code`: VARCHAR(100) NOT NULL
- `error_message`: TEXT NOT NULL
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT now()

---

## 2. Relacje między tabelami

### users → generations (jeden-do-wielu)
- Jeden użytkownik może mieć wiele generacji
- `generations.user_id` → `users.id`
- ON DELETE CASCADE - usunięcie użytkownika usuwa wszystkie jego generacje

### users → flashcards (jeden-do-wielu)
- Jeden użytkownik może mieć wiele fiszek
- `flashcards.user_id` → `users.id`
- ON DELETE CASCADE - usunięcie użytkownika usuwa wszystkie jego fiszki

### users → generation_error_logs (jeden-do-wielu)
- Jeden użytkownik może mieć wiele logów błędów generacji
- `generation_error_logs.user_id` → `users.id`
- ON DELETE CASCADE - usunięcie użytkownika usuwa wszystkie jego logi błędów

### generations → flashcards (jeden-do-wielu, opcjonalnie)
- Jedna generacja może zawierać wiele fiszek
- Fiszka może być niepowiązana z generacją (utworzona manualnie)
- `flashcards.generation_id` → `generations.id`
- ON DELETE SET NULL - usunięcie generacji nie usuwa fiszek, tylko zeruje powiązanie

---

## 3. Indeksy

- `idx_flashcards_user_id` na `flashcards(user_id)` - dla szybkiego pobierania fiszek użytkownika
- `idx_generations_user_id` na `generations(user_id)` - dla szybkiego pobierania generacji użytkownika
- `idx_generation_error_logs_user_id` na `generation_error_logs(user_id)` - dla szybkiego pobierania logów błędów użytkownika
- `idx_flashcards_generation_id` na `flashcards(generation_id)` - dla szybkiego pobierania fiszek z danej generacji
- `idx_flashcards_due` na `flashcards(due)` - dla efektywnego pobierania fiszek do powtórki

---

## 4. Funkcje pomocnicze

- `update_updated_at_column()` - funkcja triggerowa automatycznie aktualizująca pole `updated_at` w tabelach `generations` i `flashcards` przy każdej modyfikacji rekordu

---

## 5. Row Level Security (RLS)

### Tabela generations

- Polityki RLS zapewniają, że użytkownicy mogą wyświetlać, wstawiać, aktualizować i usuwać tylko swoje własne generacje
- Weryfikacja oparta na funkcji `auth.uid()` porównywanej z `user_id`

### Tabela flashcards

- Polityki RLS zapewniają, że użytkownicy mogą wyświetlać, wstawiać, aktualizować i usuwać tylko swoje własne fiszki
- Weryfikacja oparta na funkcji `auth.uid()` porównywanej z `user_id`

### Tabela generation_error_logs

- Polityki RLS zapewniają, że użytkownicy mogą wyświetlać i wstawiać tylko swoje własne logi błędów
- Weryfikacja oparta na funkcji `auth.uid()` porównywanej z `user_id`

---

## 6. Dodatkowe uwagi i decyzje projektowe

### Uwaga 2: Typy UUID
Wszystkie klucze główne używają typu UUID z automatycznym generowaniem za pomocą funkcji `gen_random_uuid()`, co zapewnia globalną unikalność i bezpieczeństwo.

### Uwaga 4: Algorytm FSRS
Schemat zawiera kolumny `due`, `stability`, `difficulty` oraz `last_reviewed_at` wymagane przez algorytm FSRS (Free Spaced Repetition Scheduler). Wartości początkowe są ustawione tak, aby nowe fiszki były dostępne od razu do nauki.

### Uwaga 5: Źródło fiszki
Pole `source` śledzi pochodzenie fiszki:
- `manual` - utworzona ręcznie przez użytkownika
- `ai-full` - wygenerowana przez AI i niezmodyfikowana
- `ai-edited` - pierwotnie wygenerowana przez AI, ale zmodyfikowana przez użytkownika

Aplikacja powinna zmieniać wartość z `ai-full` na `ai-edited` przy pierwszej edycji.

### Uwaga 1: Kaskadowe usuwanie
- Usunięcie użytkownika (`users`) automatycznie usuwa wszystkie jego generacje i fiszki
- Usunięcie generacji nie usuwa powiązanych fiszek, tylko zeruje pole `generation_id`


### Uwaga 2: Wydajność
Indeksy zostały dobrane tak, aby optymalizować najczęstsze zapytania:
- Pobieranie fiszek użytkownika
- Filtrowanie fiszek do powtórki (po `due`)
- Filtrowanie fiszek oczekujących na akceptację (po `status`)

### Uwaga 3: Skalowalność
Schemat jest zaprojektowany z myślą o przyszłej rozbudowie:
- Możliwość dodania tabeli `decks` (talii) w przyszłości
- Możliwość rozszerzenia o historie zmian fiszek
