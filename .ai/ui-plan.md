# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10xCards została zaprojektowana w celu zapewnienia intuicyjnego, wydajnego i spójnego doświadczenia użytkownika. Opiera się na podejściu komponentowym, wykorzystując bibliotekę shadcn/ui i React, co gwarantuje modularność i łatwość w utrzymaniu. Aplikacja będzie w pełni responsywna (mobile-first) i będzie wspierać tryb jasny oraz ciemny.

Struktura UI koncentruje się na kilku kluczowych widokach, które odpowiadają głównym funkcjom aplikacji: generowaniu fiszek przez AI, zarządzaniu nimi, nauce oraz obsłudze konta użytkownika. Nawigacja jest prosta i scentralizowana, umożliwiając łatwy dostęp do wszystkich sekcji. Zarządzanie stanem po stronie klienta będzie obsługiwać dynamiczne dane, takie jak listy fiszek, filtry i stan sesji nauki, podczas gdy integracja z API zapewni płynną komunikację z backendem. Szczególny nacisk położono na dostępność (a11y) i bezpieczeństwo, implementując takie mechanizmy jak potwierdzanie hasłem krytycznych operacji.

## 2. Lista widoków

### Widok: Logowanie
- **Ścieżka widoku**: `/login`
- **Główny cel**: Umożliwienie zarejestrowanym użytkownikom dostępu do ich kont.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty widoku**:
  - `Card`: Obramowanie formularza.
  - `Input`: Pola na e-mail i hasło.
  - `Button`: Przycisk "Zaloguj się".
  - `Toast`: Komunikaty o błędach (np. "Nieprawidłowy adres e-mail lub hasło").
  - `Link`: Przekierowanie do strony rejestracji.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Prosty, jednoznaczny formularz. Automatyczne ustawienie fokusu na pierwszym polu.
  - **Dostępność**: Poprawne etykiety (`label`) dla pól formularza. Obsługa walidacji po stronie klienta.
  - **Bezpieczeństwo**: Komunikacja z API przez HTTPS. Ogólny komunikat błędu, aby nie ujawniać, czy e-mail istnieje w bazie.

### Widok: Rejestracja
- **Ścieżka widoku**: `/register`
- **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło. Informacja o konieczności weryfikacji adresu e-mail po rejestracji.
- **Kluczowe komponenty widoku**:
  - `Card`: Obramowanie formularza.
  - `Input`: Pola na e-mail i hasło.
  - `Button`: Przycisk "Zarejestruj się".
  - `Toast`: Komunikaty o błędach (np. "Ten adres e-mail jest już używany").
  - `Link`: Przekierowanie do strony logowania.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Wymagania dotyczące hasła (np. minimalna długość) wyświetlane na bieżąco.
  - **Dostępność**: Etykiety dla pól, atrybuty `aria-invalid` dla błędnych danych.
  - **Bezpieczeństwo**: Walidacja formatu e-mail i siły hasła po stronie klienta i serwera.

### Widok: Panel Główny / Generowanie Fiszek
- **Ścieżka widoku**: `/` (główny widok po zalogowaniu)
- **Główny cel**: Generowanie propozycji fiszek przez AI na podstawie tekstu dostarczonego przez użytkownika oraz ich akceptacja.
- **Kluczowe informacje do wyświetlenia**: Pole tekstowe na tekst źródłowy, lista wygenerowanych propozycji fiszek.
- **Kluczowe komponenty widoku**:
  - `Textarea`: Pole do wklejenia tekstu (1000-10000 znaków).
  - `Button`: Przycisk "Generuj fiszki" (dezaktywowany podczas generowania).
  - `Progress` lub `Spinner`: Wskaźnik ładowania podczas generowania.
  - `Card`: Kontener dla każdej propozycji fiszki (awers i rewers).
  - `Checkbox`: Do zaznaczania fiszek do zbiorczej akceptacji.
  - `Button`: Przycisk "Zatwierdź zaznaczone".
  - `Toast`: Komunikaty o sukcesie lub błędzie (np. błąd serwera 500).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Przycisk generowania jest blokowany, aby zapobiec wielokrotnym zapytaniom. Pole tekstowe jest czyszczone po udanej akceptacji. Zbiorcza akceptacja usprawnia proces.
  - **Dostępność**: Obsługa nawigacji klawiaturą po liście propozycji i checkboxach.
  - **Bezpieczeństwo**: Walidacja długości tekstu po stronie klienta i serwera.

### Widok: Moje Fiszki
- **Ścieżka widoku**: `/flashcards`
- **Główny cel**: Przeglądanie, edycja i zarządzanie wszystkimi zaakceptowanymi fiszkami.
- **Kluczowe informacje do wyświetlenia**: Lista fiszek z podziałem na strony, opcje sortowania i filtrowania.
- **Kluczowe komponenty widoku**:
  - `Table` lub `Card List`: Do wyświetlania listy fiszek (awers, rewers).
  - `DropdownMenu` lub `Select`: Do sortowania (data utworzenia: rosnąco/malejąco).
  - `DropdownMenu` lub `Select`: Do filtrowania (źródło: manual, ai-full, ai-edited).
  - `Icon`: Wizualna reprezentacja źródła fiszki (np. ołówek, robot).
  - `Dialog` (lub nowa strona): Do edycji fiszki.
  - `AlertDialog`: Do potwierdzenia usunięcia fiszki.
  - `Pagination`: Komponent do nawigacji między stronami listy.
  - `Button`: Przyciski "Edytuj" i "Usuń" przy każdej fiszce.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Stan filtrów i sortowania jest zapamiętywany w URL, co pozwala na udostępnianie widoku. Paginacja ułatwia nawigację po dużej liczbie fiszek.
  - **Dostępność**: Komponenty interaktywne (przyciski, menu) w pełni dostępne z klawiatury.
  - **Bezpieczeństwo**: Operacja usunięcia wymaga dodatkowego potwierdzenia.

### Widok: Sesja Nauki
- **Ścieżka widoku**: `/study`
- **Główny cel**: Przeprowadzanie sesji nauki z wykorzystaniem algorytmu `spaced repetition`.
- **Kluczowe informacje do wyświetlenia**: Awers fiszki, a po interakcji również rewers. Przyciski oceny.
- **Kluczowe komponenty widoku**:
  - `Card`: Wyświetla aktualnie uczoną fiszkę (najpierw awers, po kliknięciu rewers).
  - `Button` (x4): Przyciski oceny: "Again", "Hard", "Good", "Easy", zróżnicowane kolorami.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Minimalistyczny interfejs skupiony na nauce. Obsługa ocen za pomocą skrótów klawiszowych (1-4) dla szybszej interakcji.
  - **Dostępność**: Wyraźny fokus na karcie i przyciskach. Obsługa klawiatury jest kluczowa.
  - **Bezpieczeństwo**: Widok dostępny tylko dla zalogowanych użytkowników.

### Widok: Ustawienia Konta
- **Ścieżka widoku**: `/settings`
- **Główny cel**: Zarządzanie ustawieniami konta, w tym jego usunięcie.
- **Kluczowe informacje do wyświetlenia**: Opcje związane z kontem.
- **Kluczowe komponenty widoku**:
  - `Card`: Sekcja "Zarządzanie kontem".
  - `Button`: Przycisk "Usuń konto" (wariant destrukcyjny).
  - `AlertDialog`: Modal z prośbą o potwierdzenie operacji usunięcia.
  - `Input`: Pole do wpisania hasła w celu potwierdzenia usunięcia konta.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasne ostrzeżenie o nieodwracalności operacji usunięcia konta.
  - **Dostępność**: Modal jest w pełni dostępny, fokus jest poprawnie zarządzany.
  - **Bezpieczeństwo**: Wymóg podania hasła jest kluczowym zabezpieczeniem przed przypadkowym lub nieautoryzowanym usunięciem konta.

## 3. Mapa podróży użytkownika

Główny przepływ użytkownika (happy path) obejmuje generowanie, akceptację i naukę fiszek:

1.  **Rejestracja/Logowanie**: Użytkownik trafia na stronę `/login` lub `/register`, aby uzyskać dostęp do aplikacji.
2.  **Generowanie Fiszek**: Po zalogowaniu użytkownik jest przekierowywany do panelu głównego (`/`). Wkleja tekst do `Textarea` i klika "Generuj fiszki".
3.  **Przegląd Propozycji**: System wyświetla listę propozycji fiszek wygenerowanych przez AI. Użytkownik zaznacza `Checkbox` przy wybranych pozycjach.
4.  **Akceptacja Fiszek**: Użytkownik klika "Zatwierdź zaznaczone". Aplikacja wysyła zapytanie `POST /api/flashcards` z tablicą fiszek. Po sukcesie pole tekstowe jest czyszczone, a użytkownik widzi komunikat `Toast`.
5.  **Zarządzanie Fiszkami**: Użytkownik przechodzi do widoku "Moje Fiszki" (`/flashcards`). Może tam przeglądać, sortować, filtrować, edytować i usuwać swoje fiszki. Edycja fiszki wygenerowanej przez AI (`source: 'ai-full'`) zmienia jej źródło na `'ai-edited'` poprzez zapytanie `PATCH /api/flashcards/{id}`.
6.  **Sesja Nauki**: Użytkownik przechodzi do widoku "Sesja Nauki" (`/study`), gdzie algorytm FSRS prezentuje mu fiszki do powtórki. Użytkownik ocenia swoją wiedzę za pomocą czterech przycisków.
7.  **Wylogowanie/Ustawienia**: W dowolnym momencie użytkownik może przejść do ustawień (`/settings`), aby np. usunąć konto, lub wylogować się z aplikacji.

## 4. Układ i struktura nawigacji

Nawigacja będzie prosta i spójna w całej aplikacji, oparta na głównym, trwałym menu nawigacyjnym dostępnym po zalogowaniu.

- **Układ strony**:
  - **Nagłówek (Header)**: Zawiera logo aplikacji oraz menu użytkownika.
  - **Menu Główne (Sidebar/Navbar)**: Umieszczone po lewej stronie lub na górze, zawiera linki do kluczowych widoków:
    - Panel Główny (`/`)
    - Moje Fiszki (`/flashcards`)
    - Sesja Nauki (`/study`)
  - **Treść Główna (Main Content)**: Centralna część strony, gdzie renderowany jest aktualny widok.
  - **Menu Użytkownika (User Dropdown)**: Dostępne w nagłówku, zawiera:
    - Link do Ustawień (`/settings`).
    - Przełącznik trybu Jasny/Ciemny.
    - Przycisk "Wyloguj".

- **Nawigacja dla niezalogowanych użytkowników**: Ograniczona do stron `/login` i `/register`. Próba dostępu do chronionych ścieżek przekierowuje na stronę logowania.

## 5. Kluczowe komponenty

Poniższe komponenty (głównie z biblioteki shadcn/ui) będą reużywalne i zapewnią spójność wizualną oraz funkcjonalną w całej aplikacji:

- **`Button`**: Standardowe przyciski do akcji, w różnych wariantach (główny, drugorzędny, destrukcyjny).
- **`Card`**: Używany jako kontener dla treści, takich jak fiszki, formularze czy sekcje ustawień.
- **`Input`**: Standardowe pola tekstowe do wprowadzania danych w formularzach.
- **`Textarea`**: Rozszerzone pole tekstowe do wprowadzania dłuższego tekstu źródłowego.
- **`Toast`**: Niewielkie, globalne powiadomienia do informowania użytkownika o wynikach operacji (sukces, błąd).
- **`AlertDialog`**: Modal używany do potwierdzania krytycznych i nieodwracalnych akcji, takich jak usunięcie konta lub fiszki.
- **`Dialog`**: Standardowy modal do wyświetlania dodatkowych treści lub formularzy, np. do edycji fiszki.
- **`Pagination`**: Komponent do nawigacji po podzielonych na strony listach danych.
- **`DropdownMenu` / `Select`**: Do implementacji opcji sortowania i filtrowania.
- **`Icon`**: Komponent do wyświetlania ikon (np. z `lucide-react`) w celu wizualnego wsparcia interfejsu.

