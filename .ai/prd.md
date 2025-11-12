# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu
10xCards to aplikacja internetowa zaprojektowana w celu usprawnienia procesu tworzenia fiszek edukacyjnych. Wykorzystując sztuczną inteligencję (AI), aplikacja automatycznie generuje fiszki z tekstu dostarczonego przez użytkownika, znacznie skracając czas potrzebny na ich przygotowanie. Projekt ma na celu rozwiązanie problemu czasochłonnego, manualnego tworzenia fiszek, co często zniechęca do stosowania skutecznych metod nauki, takich jak `spaced repetition`. Aplikacja umożliwi również manualne tworzenie i edycję fiszek, a także ich przechowywanie na indywidualnych kontach użytkowników. Wygenerowane fiszki zostaną zintegrowane z gotowym algorytmem powtórek, aby ułatwić proces nauki.

## 2. Problem użytkownika
Głównym problemem, który rozwiązuje 10xCards, jest fakt, że manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem powolnym i żmudnym. Uczniowie, studenci i osoby uczące się samodzielnie często rezygnują z tej formy nauki, mimo jej udowodnionej skuteczności, ze względu na barierę czasową i wysiłek wymagany do przygotowania materiałów. Brak prostego i szybkiego narzędzia do tworzenia fiszek ogranicza wykorzystanie metody `spaced repetition` na szerszą skalę.

## 3. Wymagania funkcjonalne
- RF-001: System rejestracji i logowania użytkowników za pomocą adresu e-mail i hasła, z weryfikacją adresu e-mail.
- RF-002: Generowanie fiszek (pytanie/odpowiedź) przez AI na podstawie tekstu wklejonego przez użytkownika.
- RF-003: Możliwość manualnego tworzenia, edycji i usuwania pojedynczych fiszek.
- RF-004: Przeglądanie listy wszystkich utworzonych fiszek.
- RF-005: Mechanizm akceptacji lub odrzucenia fiszek wygenerowanych przez AI.
- RF-006: Każda fiszka musi mieć atrybut wskazujący źródło jej utworzenia (`created_by`: `manual`, `AI-full`, `AI-edited`).
- RF-007: Integracja z gotowym, zewnętrznym algorytmem powtórek w celu wyświetlania fiszek do nauki.
- RF-008: Podstawowe opcje personalizacji interfejsu użytkownika (DO ustalenia).
- RF-009: Pole tekstowe do generowania fiszek oczekuje od 1000 do 10 000 znaków.
- RF-010: Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
- RF-011: Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.
- RF-012: Statystyki generowania fiszek - zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

## 4. Granice produktu
Następujące funkcje celowo NIE wchodzą w zakres wersji MVP (Minimum Viable Product), aby umożliwić szybkie wdrożenie i weryfikację kluczowych założeń:
- Tworzenie własnego, zaawansowanego algorytmu powtórek (np. na wzór SuperMemo, Anki).
- Importowanie treści z różnych formatów plików (np. PDF, DOCX, PPTX).
- Funkcje społecznościowe, takie jak współdzielenie talii fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi (np. Moodle, Google Classroom).
- Dedykowane aplikacje mobilne na systemy iOS i Android (projekt będzie dostępny jako aplikacja internetowa).
- Mechanizmy gamifikacji.
- Rozbudowany system powiadomień.
- Zaawansowane wyszukiwanie fiszek po słowach kluczowych.
- Publicznie dostępne API.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby móc zapisywać i zarządzać moimi fiszkami.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - Hasło musi spełniać podstawowe wymagania bezpieczeństwa (np. minimalna długość 8 znaków).
  - System waliduje format adresu e-mail.
  - Po pomyślnej rejestracji na podany adres e-mail wysyłana jest wiadomość z linkiem weryfikacyjnym.
  - Użytkownik nie może zalogować się, dopóki nie zweryfikuje swojego adresu e-mail.
  - Po pomyślnej rejestracji użytkownik jest informowany o konieczności weryfikacji e-maila.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto przy użyciu e-maila i hasła, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po pomyślnym zalogowaniu użytkownik jest przekierowywany do głównego panelu aplikacji.
  - System przechowuje sesję użytkownika, aby nie musiał logować się przy każdej wizycie.

- ID: US-003
- Tytuł: Obsługa nieudanej rejestracji
- Opis: Jako użytkownik próbujący się zarejestrować, chcę otrzymać jasny komunikat o błędzie, jeśli podany przeze mnie adres e-mail jest już zajęty.
- Kryteria akceptacji:
  - Jeśli użytkownik próbuje zarejestrować się przy użyciu istniejącego w bazie danych adresu e-mail, system wyświetla komunikat "Ten adres e-mail jest już używany".
  - Proces rejestracji zostaje przerwany.

- ID: US-004
- Tytuł: Obsługa nieudanego logowania
- Opis: Jako użytkownik próbujący się zalogować, chcę otrzymać jasny komunikat o błędzie, jeśli podam nieprawidłowy e-mail lub hasło.
- Kryteria akceptacji:
  - W przypadku podania błędnych danych logowania, system wyświetla komunikat "Nieprawidłowy adres e-mail lub hasło".
  - System nie ujawnia, która część danych (e-mail czy hasło) była nieprawidłowa.

- ID: US-005
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość wylogowania się z aplikacji, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  - W interfejsie użytkownika znajduje się widoczny przycisk "Wyloguj".
  - Po kliknięciu przycisku sesja użytkownika jest kończona.
  - Użytkownik jest przekierowywany na stronę główną lub stronę logowania.

### Zarządzanie Fiszkami

- ID: US-006
- Tytuł: Generowanie fiszek przez AI
- Opis: Jako zalogowany użytkownik, chcę wkleić fragment tekstu do pola tekstowego i kliknąć przycisk "Generuj fiszki", aby system AI automatycznie stworzył dla mnie zestaw fiszek (pytanie i odpowiedź).
- Kryteria akceptacji:
  - Na stronie głównej znajduje się pole tekstowe (`textarea`) oraz przycisk "Generuj fiszki".
  - Po kliknięciu przycisku treść jest wysyłana do modelu LLM.
  - Wygenerowane fiszki są wyświetlane na liście do przeglądu.
  - Każda wygenerowana fiszka ma domyślnie status "do akceptacji".
  - Atrybut `created_by` dla tych fiszek jest ustawiony na `AI`.

- ID: US-007
- Tytuł: Przegląd i akceptacja fiszek AI
- Opis: Jako użytkownik, chcę przejrzeć fiszki wygenerowane przez AI i zaakceptować te, które uważam za poprawne i wartościowe, aby dodać je do mojej bazy do nauki.
- Kryteria akceptacji:
  - Przy każdej fiszce wygenerowanej przez AI znajdują się przyciski "Zatwierdź" i "Odrzuć".
  - Kliknięcie "Zatwierdź" zmienia status fiszki na "zaakceptowana" i dodaje ją do głównej talii użytkownika.
  - Kliknięcie "Odrzuć" usuwa fiszkę z listy.
  - Akcje te są rejestrowane w celu obliczenia metryk sukcesu.

- ID: US-008
- Tytuł: Manualne tworzenie fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki poprzez wpisanie pytania i odpowiedzi.
- Kryteria akceptacji:
  - W interfejsie znajduje się opcja "Dodaj fiszkę manualnie".
  - Formularz zawiera dwa pola: "Pytanie" (awers) i "Odpowiedź" (rewers).
  - Po wypełnieniu i zapisaniu, nowa fiszka jest dodawana do talii użytkownika.
  - Atrybut `created_by` dla tej fiszki jest ustawiony na `manual`.

- ID: US-009
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować treść pytania lub odpowiedzi na istniejącej fiszce, aby poprawić błędy lub dostosować ją do swoich potrzeb.
- Kryteria akceptacji:
  - Przy każdej fiszce na liście znajduje się przycisk "Edytuj".
  - Po kliknięciu przycisku użytkownik może modyfikować zawartość pól pytania i odpowiedzi.
  - Zmiany są zapisywane w bazie danych.

- ID: US-010
- Tytuł: Usuwanie fiszki
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia fiszki, której już nie potrzebuję.
- Kryteria akceptacji:
  - Przy każdej fiszce znajduje się przycisk "Usuń".
  - Przed usunięciem system wyświetla okno dialogowe z prośbą o potwierdzenie operacji.
  - Po potwierdzeniu fiszka jest trwale usuwana z bazy danych.

- ID: US-011
- Tytuł: Przeglądanie wszystkich fiszek
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich zaakceptowanych fiszek, aby mieć przegląd moich materiałów do nauki.
- Kryteria akceptacji:
  - W aplikacji istnieje dedykowana sekcja lub widok "Moje fiszki".
  - Lista wyświetla pytanie i odpowiedź dla każdej fiszki.
  - Lista zawiera opcje sortowania lub filtrowania (np. po dacie dodania).

- ID: US-012
- Tytuł: Obsługa generowania fiszek z nieodpowiedniego tekstu
- Opis: Jako użytkownik, chcę otrzymać informację zwrotną, jeśli tekst, który wkleiłem, jest zbyt krótki lub nie nadaje się do wygenerowania fiszek.
- Kryteria akceptacji:
  - System definiuje minimalną długość tekstu wejściowego.
  - Jeśli tekst jest zbyt krótki, po kliknięciu "Generuj fiszki" wyświetlany jest komunikat, np. "Wprowadzony tekst jest zbyt krótki, aby wygenerować fiszki".
  - Proces generowania nie jest uruchamiany.

- ID: US-013
- Tytuł: Sesja nauki z algorytmem powtórek
- Opis: Jako zalogowany użytkownik chcę, aby dodane fiszki były dostępne w widoku "Sesja nauki" opartym na zewnętrznym algorytmie, aby móc efektywnie się uczyć (spaced repetition).
- Kryteria akceptacji:
  - W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki fiszek.
  - Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył.
  - Użytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę.
  - Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki.

- ID: US-014
- Tytuł: Bezpieczny dostęp i autoryzacja
- Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje fiszki nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
- Kryteria akceptacji:
  - Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki.
  - Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia.

## 6. Metryki sukcesu
- Wskaźnik akceptacji fiszek AI: Procent fiszek wygenerowanych przez AI, które zostały zaakceptowane przez użytkowników. Cel: 75%. Mierzony poprzez stosunek liczby kliknięć "Zatwierdź" do całkowitej liczby wygenerowanych fiszek.
- Stosunek tworzenia fiszek (AI vs. manualnie): Procent fiszek w systemie utworzonych za pomocą AI w porównaniu do tych stworzonych manualnie. Cel: 75% fiszek tworzonych z wykorzystaniem AI. Mierzony za pomocą atrybutu `created_by`.
- Koszty operacyjne LLM: Regularne monitorowanie kosztów zużycia API modelu językowego w celu zapewnienia rentowności i skalowalności projektu.
- Wydajność systemu: Śledzenie kluczowych wskaźników wydajności, takich jak średni czas odpowiedzi serwera podczas generowania fiszek oraz ogólna stabilność aplikacji.
- Adopcja przez społeczność open-source: Po opublikowaniu kodu, śledzenie liczby gwiazdek, forków i kontrybucji w repozytorium projektu (np. na GitHub) jako wskaźnik zainteresowania i zaangażowania społeczności.
