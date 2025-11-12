# REST API Plan - 10xCards

## 1. Resources

The API manages the following main resources mapped to database tables:

- **Auth** - User authentication and authorization (uses Supabase Auth, table: `users`)
- **Generations** - Stores metadata and results of AI generation requests(table: `generations`)
- **Flashcards** - User's flashcards for study (table: `flashcards`)
- **Generation Error Logs** - Error tracking for AI generation (table: `generation_error_logs`)


## 2. Endpoints

### 2.2. Flashcards

- **GET `/api/flashcards`**
  - **Description**: Retrieve a paginated, filtered, and sortable list of flashcards for the authenticated user.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 10)
    - `sort` (e.g., `created_at`)
    - `order` (`asc` or `desc`)
    - Optional filters (e.g., `source`, `generation_id`).
  - **Response JSON**:
    ```json
    {
      "data": [
        { "id": 1, "front": "Question", "back": "Answer", "source": "manual", "created_at": "...", "updated_at": "..." }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 100 }
    }
    ```
  - **Errors**: 401 Unauthorized if token is invalid.

- **GET `/api/flashcards/{id}`**
  - **Description**: Retrieve details for a specific flashcard.
  - **Response JSON**: Flashcard object.
  - **Errors**: 404 Not Found, 401 Unauthorized.

- **POST `/api/flashcards`**
  - **Description**: Create one or more flashcards (manually or from AI generation).
  - **Request JSON**:
    ```json
    {
      "flashcards": [
        {
          "front": "Question 1",
          "back": "Answer 1",
          "source": "manual",
          "generation_id": null
        },
        {
          "front": "Question 2",
          "back": "Answer 2",
          "source": "ai-full",
          "generation_id": 123
        }
      ]
    }
    ```
  - **Response JSON**:
    ```json
    {
      "flashcards": [
        { "id": 1, "front": "Question 1", "back": "Answer 1", "source": "manual", "generation_id": null },
        { "id": 2, "front": "Question 2", "back": "Answer 2", "source": "ai-full", "generation_id": 123 }
      ]
    }
    ```
  - **Validations**:
    - `front` maximum length: 200 characters.
    - `back` maximum length: 500 characters.
    - `source`: Must be one of `ai-full`, `ai-edited`, or `manual`.
    - `generation_id`: Required for `ai-full` and `ai-edited` sources, must be null for `manual` source.
  - **Errors**: 400 for invalid inputs, including validation errors for any flashcard in the array.

- **PATCH `/api/flashcards/{id}`**
  - **Description**: Edit an existing flashcard.
  - **Request JSON**: Fields to update.
  - **Response JSON**: Updated flashcard object.
  - **Errors**: 400 for invalid input, 404 if flashcard not found, 401 Unauthorized.

  - **Validations**:
    - `front` maximum length: 200 characters.
    - `back` maximum length: 500 characters.
    - `source`: Must be one of `ai-edited`, or `manual`.

- **DELETE `/api/flashcards/{id}`**
  - **Description**: Delete a flashcard.
  - **Response JSON**: Success message.
  - **Errors**: 404 if flashcard not found, 401 Unauthorized.

### 2.3. Generations

- **POST `/api/generations`**
  - **Description**: Initiate the AI generation process for flashcards proposals based on user-provided text.
  - **Request JSON**:
    ```json
    {
      "source_text": "User provided text (1000 to 10000 characters)"
    }
    ```
  - **Business Logic**:
    - Validate that `source_text` length is between 1000 and 10000 characters.
    - Call the AI service to generate flashcards proposals.
    - Store the generation metadata and return flashcard proposals to the user.
  - **Response JSON**:
    ```json
    {
      "generation_id": 123,
      "flashcards_proposals": [
         { "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
      ],
      "generated_count": 5
    }
    ```
  - **Errors**:
    - 400: Invalid input.
    - 500: AI service errors (logs recorded in `generation_error_logs`).

- **GET `/api/generations`**
  - **Description**: Retrieve a list of generation requests for the authenticated user.
  - **Query Parameters**: Supports pagination as needed.
  - **Response JSON**: List of generation objects with metadata.

- **GET `/api/generations/{id}`**
  - **Description**: Retrieve detailed information of a specific generation including its flashcards.
  - **Response JSON**: Generation details and associated flashcards.
  - **Errors**: 404 Not Found.

### 2.4. Generation Error Logs

*(Used internally or by admin users)*

- **GET `/api/generation-error-logs`**
  - **Description**: Retrieve error logs for AI flashcard generation for the authenticated user or admin.
  - **Response JSON**: List of error log objects.
  - **Errors**:
    - 401 Unauthorized if token is invalid.
    - 403 Forbidden if access is restricted to admin users.


## 3. Authentication and Authorization


## 4. Validation and Business Logic

### 4.1 Input Validation Rules

#### Flashcard Validation:
- **front:**
  - Required: Yes
  - Type: String
  - Length: 1-200 characters
  - Cannot be empty or whitespace only

- **back:**
  - Required: Yes
  - Type: String
  - Length: 1-500 characters
  - Cannot be empty or whitespace only

- **source:**
  - Required: Yes (auto-set on create)
  - Type: Varchar
  - Values: 'manual', 'ai-full', 'ai-edited'

#### Generation Validation:
- **text:**
  - Required: Yes
  - Type: String
  - Length: 1000-10000 characters
  - Cannot be empty or whitespace only

- **model:**
  - Required: Yes
  - Type: String
  - Must be valid AI model identifier

#### Authentication Validation:
- **email:**
  - Required: Yes
  - Type: String
  - Format: Valid email address (RFC 5322)
  - Must be unique in database

- **password:**
  - Required: Yes
  - Type: String
  - Minimum length: 8 characters
  - Should contain mix of letters, numbers, and symbols (recommended)

#### Review Validation:
- **rating:**
  - Required: Yes
  - Type: Integer
  - Range: 1-4
  - Values: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

### 4.2 Business Logic Implementation

#### 4.2.1 Source Tracking Logic

**On Flashcard Creation:**
- Manual creation: Set source = 'manual'
- AI generation acceptance (unedited): Set source = 'ai-full'
- AI generation acceptance (edited): Set source = 'ai-edited'

**On Flashcard Update:**
```
IF current source == 'ai-full' AND (front changed OR back changed):
  - Update source to 'ai-edited'
  - IF generation_id exists:
    - Decrement generation.accepted_unedited_count
    - Increment generation.accepted_edited_count
```

**Purpose:**
- Track flashcard origin for metrics (RF-012)
- Calculate AI acceptance rate (75% target)
- Measure AI vs manual creation ratio (75% target)

#### 4.2.2 Generation Statistics

**On AI Generation:**
- Create generation record with:
  - generated_count: Number of flashcards returned by AI
  - source_text_hash: Hash of input text (for deduplication tracking)
  - source_text_length: Character count of input
  - generation_duration: Time taken in milliseconds
  - model: AI model identifier

**On Flashcard Acceptance:**
- When user accepts unedited flashcards:
  - Increment generation.accepted_unedited_count
- When user accepts edited flashcards:
  - Increment generation.accepted_edited_count

**Rejection:**
- Flashcards not accepted are not created in database
- Count difference between generated_count and (accepted_unedited + accepted_edited) = rejected count

**Purpose:**
- Monitor AI effectiveness
- Track acceptance rates for success metrics
- Analyze which models perform best

#### 4.2.3 FSRS Algorithm Integration

**Flashcard Default Values (New Cards):**
```json
{
  "due": "NOW()",
  "stability": 0,
  "difficulty": 0,
  "last_reviewed_at": null
}
```

**On Review:**
1. Calculate new FSRS parameters based on:
   - Current stability
   - Current difficulty
   - Rating (1-4)
   - Time since last review
   
2. Update flashcard:
   - due: Calculated next review date
   - stability: New stability value
   - difficulty: New difficulty value
   - last_reviewed_at: Current timestamp

3. Return next review estimates for all ratings

**FSRS Library:**
- Use external FSRS library (e.g., `ts-fsrs` for TypeScript)
- Library handles complex calculation logic
- API endpoints provide interface to library

**Performance:**
- Index on due date enables efficient queries for study sessions
- Study session retrieves WHERE due <= NOW() ORDER BY due ASC

#### 4.2.4 Error Logging

**On Generation Failure:**
1. Catch exception from AI service
2. Create record in generation_error_logs:
   - user_id: Authenticated user
   - model: Model that failed
   - source_text_hash: Hash of input text
   - source_text_length: Length of input
   - error_code: Categorized error code
   - error_message: Full error message
