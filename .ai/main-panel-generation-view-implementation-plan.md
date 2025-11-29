# Plan implementacji widoku: Panel Główny / Generowanie Fiszek

## 1. Przegląd
Widok "Panel Główny / Generowanie Fiszek" jest centralnym punktem aplikacji dla zalogowanego użytkownika. Jego głównym celem jest umożliwienie generowania propozycji fiszek przez AI na podstawie dostarczonego tekstu, a następnie przeglądanie i akceptowanie tych propozycji. Widok ten bezpośrednio wspiera kluczowe historyjki użytkownika US-006 i US-007, realizując podstawową propozycję wartości aplikacji – automatyzację tworzenia materiałów do nauki.

## 2. Routing widoku
- **Ścieżka**: `/`
- **Dostęp**: Widok powinien być dostępny tylko dla zalogowanych użytkowników. Niezalogowani użytkownicy próbujący uzyskać dostęp do tej ścieżki powinni zostać przekierowani na stronę logowania.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i umieszczone w katalogu `src/components/`.

```
/src/pages/index.astro
└── /src/components/GenerationView.tsx (Komponent-kontener)
    ├── /src/components/GenerationForm.tsx (Formularz generowania)
    │   ├── /src/components/ui/textarea.tsx
    │   ├── /src/components/ui/button.tsx
    │   └── /src/components/ui/progress.tsx
    └── /src/components/ProposalsList.tsx (Lista propozycji)
        ├── /src/components/ProposalCard.tsx (Pojedyncza propozycja)
        │   ├── /src/components/ui/card.tsx
        │   └── /src/components/ui/checkbox.tsx
        └── /src/components/ui/button.tsx (Przycisk "Zatwierdź zaznaczone")
```

## 4. Szczegóły komponentów

### `GenerationView.tsx` (Komponent-kontener)
- **Opis**: Główny komponent zarządzający stanem całego widoku. Odpowiada za komunikację z API, przekazywanie danych do komponentów podrzędnych oraz obsługę logiki biznesowej.
- **Główne elementy**: `GenerationForm`, `ProposalsList`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji z użytkownikiem.
- **Typy**: `useGenerationViewModel` (custom hook).
- **Propsy**: Brak.

### `GenerationForm.tsx`
- **Opis**: Komponent formularza, który pozwala użytkownikowi wprowadzić tekst źródłowy i zainicjować proces generowania fiszek.
- **Główne elementy**: `Textarea`, `Button`, `Progress` (lub `Spinner`).
- **Obsługiwane interakcje**:
  - `onChange` na `Textarea`: Aktualizacja stanu tekstu źródłowego.
  - `onClick` na `Button`: Wywołanie funkcji `handleGenerate` przekazanej z `GenerationView`.
- **Warunki walidacji**:
  - Przycisk "Generuj fiszki" jest aktywny tylko wtedy, gdy `sourceText` ma długość między 1000 a 10000 znaków i `isLoading` jest `false`.
  - Wyświetla komunikat o błędzie walidacji, jeśli tekst jest poza wymaganym zakresem.
- **Typy**: `GenerationFormProps`.
- **Propsy**:
  - `sourceText: string`
  - `setSourceText: (text: string) => void`
  - `handleGenerate: () => void`
  - `isLoading: boolean`
  - `validationError: string | null`

### `ProposalsList.tsx`
- **Opis**: Wyświetla listę propozycji fiszek wygenerowanych przez AI i umożliwia ich zbiorczą akceptację.
- **Główne elementy**: `ProposalCard` (mapowany z listy propozycji), `Button` ("Zatwierdź zaznaczone").
- **Obsługiwane interakcje**:
  - `onClick` na `Button`: Wywołanie funkcji `handleAccept` z listą zaznaczonych propozycji.
- **Warunki walidacji**:
  - Przycisk "Zatwierdź zaznaczone" jest aktywny tylko wtedy, gdy co najmniej jedna propozycja jest zaznaczona (`selectedProposals.length > 0`) i `isAccepting` jest `false`.
  - Przycisk "Zatwierdź zaznaczone" jest aktywny tylko wtedy, gdy co najmniej jedna propozycja jest zaznaczona (`selectedProposals.size > 0`) i `isAccepting` jest `false`.
- **Propsy**:
  - `proposals: FlashcardProposalViewModel[]`
  - `selectedProposals: Set<number>`
  - `toggleProposalSelection: (index: number) => void`
  - `handleAccept: () => void`
  - `isAccepting: boolean`

### `ProposalCard.tsx`
- **Opis**: Reprezentuje pojedynczą propozycję fiszki na liście. Wyświetla awers, rewers i checkbox do zaznaczenia.
- **Główne elementy**: `Card`, `Checkbox`, `Button` (opcjonalnie do edycji/odrzucenia pojedynczej).
- **Obsługiwane interakcje**:
  - `onCheckedChange` na `Checkbox`: Wywołanie funkcji `toggleProposalSelection` z indeksem propozycji.
- **Typy**: `ProposalCardProps`.
- **Propsy**:
  - `proposal: FlashcardProposalViewModel`
  - `index: number`
  - `isSelected: boolean`
  - `toggleProposalSelection: (index: number) => void`

## 5. Typy

### `FlashcardProposalViewModel`
Rozszerza `FlashcardProposalDto` o pole `isSelected` do śledzenia stanu zaznaczenia w interfejsie użytkownika.
```typescript
import type { FlashcardProposalDto } from "../../types";

export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  isSelected: boolean;
}
```

### `useGenerationViewModel` (interfejs zwracany przez hook)
Definiuje stan i akcje dostępne w komponencie `GenerationView`.
```typescript
interface UseGenerationViewModel {
  // Stan
  sourceText: string;
  proposals: FlashcardProposalViewModel[];
  selectedProposals: Set<number>;
  isLoading: boolean;
  isAccepting: boolean;
  error: string | null;
  validationError: string | null;
  generationId: number | null;

  // Akcje
  setSourceText: (text: string) => void;
  handleGenerate: () => Promise<void>;
  handleAccept: () => Promise<void>;
  toggleProposalSelection: (index: number) => void;
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane za pomocą customowego hooka `useGenerationViewModel`. Takie podejście hermetyzuje całą logikę, separując ją od warstwy prezentacji.

### `useGenerationViewModel.ts`
- **Cel**: Centralne zarządzanie stanem widoku generowania fiszek.
- **Struktura**:
  - Użycie `useState` do zarządzania:
    - `sourceText`: Tekst wprowadzany przez użytkownika.
    - `proposals`: Lista propozycji fiszek.
    - `selectedProposals`: Zbiór indeksów zaznaczonych propozycji.
    - `isLoading`: Stan ładowania podczas generowania.
    - `isAccepting`: Stan ładowania podczas akceptowania.
    - `error`: Błędy z API.
    - `validationError`: Błędy walidacji formularza.
    - `generationId`: ID bieżącej generacji.
  - Implementacja funkcji `handleGenerate`, `handleAccept`, `toggleProposalSelection`.
  - Hook zwraca obiekt zgodny z interfejsem `UseGenerationViewModel`.

## 7. Integracja API

### Generowanie fiszek
- **Endpoint**: `POST /api/generations`
- **Akcja**: Wywołanie w funkcji `handleGenerate` w `useGenerationViewModel`.
- **Typ żądania**: `CreateGenerationCommand`
  ```typescript
  {
    source_text: string; // z stanu sourceText
  }
  ```
- **Typ odpowiedzi (sukces)**: `GenerationResultDto`
  ```typescript
  {
    generation_id: number;
    flashcards_proposals: FlashcardProposalDto[];
    generated_count: number;
  }
  ```
- **Logika**: Po otrzymaniu odpowiedzi, stan `proposals` jest aktualizowany, a `generationId` zapisywany.

### Akceptacja fiszek
- **Endpoint**: `POST /api/flashcards`
- **Akcja**: Wywołanie w funkcji `handleAccept` w `useGenerationViewModel`.
- **Typ żądania**: `CreateFlashcardsCommand`
  ```typescript
  {
    flashcards: FlashcardCreateDto[]; // Budowane na podstawie zaznaczonych propozycji
  }
  ```
  - Każda propozycja jest mapowana na obiekt `FlashcardCreateDto`:
    ```typescript
    {
      front: proposal.front,
      back: proposal.back,
      source: 'ai-full',
      generation_id: generationId // Zapisane po udanym generowaniu
    }
    ```
- **Typ odpowiedzi (sukces)**: `{ flashcards: FlashcardDto[] }`
- **Logika**: Po udanej akceptacji, stany `sourceText`, `proposals` i `selectedProposals` są czyszczone. Wyświetlany jest komunikat o sukcesie.

## 8. Interakcje użytkownika
1.  **Wprowadzanie tekstu**: Użytkownik wkleja tekst w `Textarea`. Stan `sourceText` jest aktualizowany.
2.  **Inicjowanie generowania**: Użytkownik klika "Generuj fiszki".
    - Wywoływana jest funkcja `handleGenerate`.
    - Przycisk jest dezaktywowany, pojawia się wskaźnik `Progress`.
    - Po zakończeniu, lista `ProposalsList` jest wypełniana danymi.
3.  **Zaznaczanie propozycji**: Użytkownik klika `Checkbox` na `ProposalCard`.
    - Wywoływana jest `toggleProposalSelection`.
    - Indeks propozycji jest dodawany/usuwany ze zbioru `selectedProposals`.
4.  **Akceptacja propozycji**: Użytkownik klika "Zatwierdź zaznaczone".
    - Wywoływana jest funkcja `handleAccept`.
    - Przycisk jest dezaktywowany.
    - Po sukcesie, formularz i lista propozycji są czyszczone, a użytkownik widzi komunikat `Toast`.

## 9. Warunki i walidacja
- **Komponent `GenerationForm`**:
  - **Warunek**: Długość `sourceText` musi być w przedziale [1000, 10000] znaków.
  - **Weryfikacja**: Sprawdzane na bieżąco przy zmianie tekstu.
  - **Stan interfejsu**:
    - Jeśli warunek jest spełniony, przycisk "Generuj fiszki" jest aktywny.
    - Jeśli nie, przycisk jest nieaktywny, a pod `Textarea` może pojawić się komunikat (np. "Wymagane od 1000 do 10000 znaków").
- **Komponent `ProposalsList`**:
  - **Warunek**: Co najmniej jedna propozycja musi być zaznaczona (`selectedProposals.size > 0`).
  - **Weryfikacja**: Sprawdzane przy każdej zmianie w `selectedProposals`.
  - **Stan interfejsu**: Przycisk "Zatwierdź zaznaczone" jest aktywny tylko, gdy warunek jest spełniony.

## 10. Obsługa błędów
- **Błędy walidacji (klient)**: Komunikaty o błędach (np. nieprawidłowa długość tekstu) będą wyświetlane bezpośrednio w formularzu `GenerationForm`. Stan `validationError` będzie używany do ich przechowywania.
- **Błędy API (4xx, 5xx)**:
  - Błędy zwrócone z `POST /api/generations` lub `POST /api/flashcards` będą przechwytywane w bloku `catch` w `useGenerationViewModel`.
  - Stan `error` zostanie zaktualizowany komunikatem o błędzie.
  - Komponent `GenerationView` wyświetli globalny komunikat o błędzie, np. za pomocą komponentu `Toast` (np. z `shadcn/ui`).
  - Stany `isLoading` i `isAccepting` zostaną zresetowane do `false`, aby umożliwić ponowną próbę.
- **Przypadki brzegowe**:
  - **Brak propozycji**: Jeśli AI nie zwróci żadnych propozycji, `ProposalsList` wyświetli komunikat "Nie udało się wygenerować propozycji z podanego tekstu."
  - **Utrata połączenia**: Standardowe mechanizmy przeglądarki obsłużą błąd sieciowy, który zostanie przechwycony jako błąd API.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików**: Stworzenie plików dla komponentów `GenerationView.tsx`, `GenerationForm.tsx`, `ProposalsList.tsx`, `ProposalCard.tsx` w `src/components/` oraz hooka `useGenerationViewModel.ts` w `src/lib/hooks/`.
2.  **Utworzenie typów ViewModel**: Zdefiniowanie interfejsu `FlashcardProposalViewModel` w nowym pliku `src/lib/types.view-models.ts`, aby oddzielić typy widoku od głównych typów DTO.
3**Utworzenie struktury plików**: Stworzenie plików dla komponentów `GenerationView.tsx`, `GenerationForm.tsx`, `ProposalsList.tsx`, `ProposalCard.tsx` w `src/components/` oraz hooka `useGenerationViewModel.ts` w `src/lib/hooks/`.
4**Implementacja `useGenerationViewModel`**: Zdefiniowanie stanów (`useState`) i pustych funkcji obsługi (`handleGenerate`, `handleAccept`, etc.).
5**Implementacja `GenerationForm`**: Budowa interfejsu formularza z `Textarea` i `Button`. Podłączenie propsów do hooka, w tym walidacji i stanu `isLoading`.
6**Integracja z `POST /api/generations`**: Implementacja logiki `handleGenerate` w hooku, w tym wywołania `fetch`, obsługi odpowiedzi i błędów.
7**Implementacja `ProposalsList` i `ProposalCard`**: Budowa interfejsu listy propozycji. Podłączenie propsów do hooka, w tym logiki zaznaczania.
8**Integracja z `POST /api/flashcards`**: Implementacja logiki `handleAccept` w hooku, w tym mapowania zaznaczonych propozycji na `CreateFlashcardsCommand` i obsługi odpowiedzi.
9**Implementacja `GenerationView`**: Złożenie `GenerationForm` i `ProposalsList` w jeden widok. Wykorzystanie hooka `useGenerationViewModel` do zarządzania całością.
10**Obsługa błędów i komunikatów**: Dodanie komponentu `Toast` do `GenerationView` w celu wyświetlania komunikatów o sukcesie i błędach.
11**Stylowanie i testowanie**: Dopracowanie stylów za pomocą Tailwind CSS, weryfikacja dostępności (nawigacja klawiaturą) i manualne przetestowanie całego przepływu.
12. **Aktualizacja strony głównej**: Zmiana `src/pages/index.astro`, aby renderował komponent `GenerationView.tsx` z atrybutem `client:load`.
