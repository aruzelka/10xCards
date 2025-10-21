# Stos Technologiczny Projektu 10xCards

Data ostatniej aktualizacji: 21 października 2025

## Finalna Decyzja

Na podstawie przeprowadzonej analizy, zatwierdzamy następujący stos technologiczny dla projektu 10xCards.

---

## Frontend

### Framework i Język
- **Astro** - główny framework do budowy aplikacji webowej
  - Wykorzystuje architekturę "Islands" dla optymalnej wydajności
  - Generuje statyczne strony gdzie to możliwe
  - Dodaje interaktywność tylko tam, gdzie jest potrzebna
- **React** - biblioteka do komponentów interaktywnych
  - Używana w Astro Islands do dynamicznych części aplikacji
  - Komponenty: formularz generowania fiszek, panel użytkownika, system powtórek
- **TypeScript** - język programowania
  - Silne typowanie dla większej niezawodności kodu
  - Lepsza integracja z IDE i autouzupełnianie

### Styling i Komponenty UI
- **Tailwind CSS** - utility-first CSS framework
  - Szybkie stylowanie bez opuszczania JSX/HTML
  - Spójny design system
  - Konfiguracja w `tailwind.config.mjs`
- **Shadcn/ui** - biblioteka komponentów UI
  - Gotowe, dostępne komponenty (przyciski, formularze, modale, karty)
  - Zbudowane na Radix UI
  - Pełna kontrola nad kodem komponentów (kopiowane do projektu)
  - Kompatybilne z Tailwind CSS

---

## Backend

### Backend-as-a-Service
- **Supabase** - główna platforma backendowa
  - **PostgreSQL** - relacyjna baza danych
    - Silne typowanie danych
    - ACID compliance
    - Zaawansowane możliwości SQL
  - **Supabase Auth** - system uwierzytelniania
    - Rejestracja i logowanie użytkowników
    - Weryfikacja email
    - JWT tokens
    - Obsługa sesji
  - **Supabase Client SDK** - oficjalny klient JavaScript/TypeScript
    - Łatwa integracja z frontendem
    - Real-time subscriptions (opcjonalnie)
  - **Row Level Security (RLS)** - bezpieczeństwo na poziomie bazy danych
    - Granularne kontrole dostępu
    - Izolacja danych między użytkownikami
  - **Supabase Edge Functions** (opcjonalnie) - serverless functions
    - Do operacji wymagających logiki backendowej
    - Bezpieczne przechowywanie kluczy API

---

## AI/ML

### Platforma AI
- **Openrouter.ai** - agregator modeli LLM
  - Ujednolicony interfejs API do wielu modeli
  - Możliwość wyboru różnych dostawców (OpenAI, Anthropic, Google, Mistral, etc.)
  - Kontrola kosztów poprzez limity na kluczach API
  - Łatwa zmiana modeli bez przebudowy aplikacji

### Używane Modele (wstępnie)
- Modele do rozważenia w zależności od wymagań jakości/cena:
  - GPT-4 / GPT-3.5 Turbo (OpenAI)
  - Claude 3 (Anthropic)
  - Gemini (Google)
  - Mistral (tańsza alternatywa)

---

## DevOps i Hosting

### CI/CD
- **GitHub Actions** - automatyzacja pipeline'ów
  - Automatyczne testy
  - Automatyczne budowanie
  - Deployment po merge do głównej gałęzi
  - Wykorzystanie darmowego limitu minut

### Hosting i Infrastruktura
- **DigitalOcean** - hosting aplikacji
  - Droplets (VPS) do uruchamiania aplikacji
  - Przewidywalny koszt (5-10 USD/miesiąc na start)
- **Docker** - konteneryzacja
  - Dockerfile dla aplikacji Astro
  - Łatwe przenoszenie między środowiskami
  - Uproszczone skalowanie

---

## Struktura Projektu

```
/home/annaf/Dokumenty/10xDevs/10xCards/
├── src/
│   ├── components/       # Komponenty React i Astro
│   ├── layouts/          # Layouty Astro
│   ├── pages/            # Strony aplikacji (routing Astro)
│   ├── lib/              # Utilities, helpery
│   │   ├── supabase.ts   # Konfiguracja klienta Supabase
│   │   └── openrouter.ts # Integracja z Openrouter
│   └── styles/           # Globalne style CSS
├── public/               # Pliki statyczne
├── .ai/                  # Dokumentacja AI i kontekst projektu
├── astro.config.mjs      # Konfiguracja Astro
├── tailwind.config.mjs   # Konfiguracja Tailwind
├── tsconfig.json         # Konfiguracja TypeScript
├── package.json          # Zależności npm
├── Dockerfile            # Definicja kontenera Docker
└── .github/
    └── workflows/        # GitHub Actions workflows
```

---

## Zmienne Środowiskowe

### Wymagane Zmienne
```bash
# Supabase
PUBLIC_SUPABASE_URL=<url-projektu-supabase>
PUBLIC_SUPABASE_ANON_KEY=<klucz-publiczny-supabase>
SUPABASE_SERVICE_ROLE_KEY=<klucz-serwisowy-tylko-backend>

# Openrouter.ai
OPENROUTER_API_KEY=<klucz-api-openrouter>

# Opcjonalne
NODE_ENV=development|production
```

---

## Kluczowe Zależności (package.json)

### Dependencies
```json
{
  "astro": "^4.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "@astrojs/react": "^3.x",
  "@astrojs/tailwind": "^5.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "typescript": "^5.x"
}
```

### Dev Dependencies
```json
{
  "@types/react": "^18.x",
  "@types/react-dom": "^18.x"
}
```

---

## Konwencje i Best Practices

### Nazewnictwo
- Komponenty React: PascalCase (np. `FlashcardGenerator.tsx`)
- Pliki utility: camelCase (np. `supabaseClient.ts`)
- Strony Astro: kebab-case (np. `generate-cards.astro`)

### Organizacja Kodu
- Komponenty UI z Shadcn/ui w `src/components/ui/`
- Komponenty biznesowe w `src/components/`
- Logika Supabase w `src/lib/supabase/`
- Logika AI w `src/lib/ai/`

### Bezpieczeństwo
- **NIGDY** nie umieszczaj kluczy API po stronie klienta
- Używaj Row Level Security (RLS) dla wszystkich tabel użytkowników
- Waliduj wszystkie dane wejściowe
- Używaj HTTPS w produkcji
- Przechowuj klucze API w zmiennych środowiskowych

### TypeScript
- Definiuj typy dla wszystkich odpowiedzi API
- Używaj interface dla struktur danych
- Unikaj `any` - używaj `unknown` jeśli typ jest rzeczywiście nieznany

---

## Roadmap Technologiczna

### MVP (Faza 1)
- Podstawowa konfiguracja Astro + React + Tailwind
- Integracja Supabase Auth
- Shadcn/ui: podstawowe komponenty (Button, Input, Card)
- Prosty formularz generowania fiszek przez Openrouter
- Wyświetlanie wygenerowanych fiszek
- Docker + podstawowy deployment na DigitalOcean

### Post-MVP (Faza 2)
- System powtórek z algorytmem spaced repetition
- Statystyki i dashboard użytkownika
- Eksport/import fiszek
- Optymalizacja kosztów AI (caching, wybór modeli)
- Zaawansowany CI/CD z testami E2E

### Przyszłość (Faza 3)
- Własny Edge Functions dla zaawansowanej logiki
- Rozważenie migracji na własny hosting Supabase (jeśli konieczne)
- PWA dla offline access
- Współdzielenie zestawów fiszek między użytkownikami

---

## Decyzja i Uzasadnienie

**Status: ZATWIERDZONY ✅**

Ten stos technologiczny został wybrany po dokładnej analizie wymagań projektu 10xCards. Zapewnia:
- ✅ Szybkie wdrożenie MVP
- ✅ Skalowalność w przyszłości
- ✅ Niskie koszty początkowe z kontrolą wzrostu
- ✅ Umiarkowaną złożoność przy wysokiej jakości
- ✅ Solidne fundamenty bezpieczeństwa

Każda technologia w stosie została wybrana celowo i rozwiązuje konkretny problem projektowy, minimalizując jednocześnie ilość niepotrzebnej pracy deweloperskiej.

---

**Ostatnia aktualizacja:** 21 października 2025  
**Zatwierdzone przez:** Zespół 10xCards  
**Następny przegląd:** Po wdrożeniu MVP

