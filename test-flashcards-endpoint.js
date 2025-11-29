/**
 * Test script for Flashcards API endpoints
 *
 * Tests all CRUD operations:
 * - POST /api/flashcards (create)
 * - GET /api/flashcards (list with pagination)
 * - GET /api/flashcards/:id (get by id)
 * - PATCH /api/flashcards/:id (update)
 * - DELETE /api/flashcards/:id (delete)
 */

const BASE_URL = "http://localhost:3000";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { error: error.message };
  }
}

// Test data
const testFlashcards = {
  flashcards: [
    {
      front: "What is JavaScript?",
      back: "A programming language for web development",
      source: "manual",
      generation_id: null
    },
    {
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
      source: "manual",
      generation_id: null
    }
  ]
};

async function runTests() {
  console.log("🚀 Starting Flashcards API Tests\n");
  console.log("=" .repeat(60));

  // Test 1: Create flashcards (POST)
  console.log("\n🧪 TEST 1: Create flashcards (POST /api/flashcards)");
  console.log("=" .repeat(60));
  const createResult = await apiCall('/api/flashcards', {
    method: 'POST',
    body: JSON.stringify(testFlashcards),
  });

  if (createResult.status !== 201) {
    console.error("❌ Create test failed!");
    return;
  }

  const createdFlashcards = createResult.data.flashcards;
  const testId = createdFlashcards[0].id;
  console.log(`\n✅ Created ${createdFlashcards.length} flashcards. Test ID: ${testId}`);

  // Test 2: List flashcards (GET with default params)
  console.log("\n🧪 TEST 2: List flashcards - default params (GET /api/flashcards)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards');

  // Test 3: List flashcards with filters
  console.log("\n🧪 TEST 3: List flashcards - with pagination (GET /api/flashcards?page=1&limit=5)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards?page=1&limit=5');

  // Test 4: List flashcards with sorting
  console.log("\n🧪 TEST 4: List flashcards - with sorting (GET /api/flashcards?sort=created_at&order=asc)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards?sort=created_at&order=asc');

  // Test 5: List flashcards with source filter
  console.log("\n🧪 TEST 5: List flashcards - filter by source (GET /api/flashcards?source=manual)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards?source=manual');

  // Test 6: Get single flashcard (GET by ID)
  console.log(`\n🧪 TEST 6: Get flashcard by ID (GET /api/flashcards/${testId})`);
  console.log("=" .repeat(60));
  await apiCall(`/api/flashcards/${testId}`);

  // Test 7: Update flashcard (PATCH)
  console.log(`\n🧪 TEST 7: Update flashcard (PATCH /api/flashcards/${testId})`);
  console.log("=" .repeat(60));
  const updateData = {
    front: "What is JavaScript? (Updated)",
    back: "A versatile programming language for web development",
  };
  await apiCall(`/api/flashcards/${testId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  // Test 8: Verify update
  console.log(`\n🧪 TEST 8: Verify update (GET /api/flashcards/${testId})`);
  console.log("=" .repeat(60));
  await apiCall(`/api/flashcards/${testId}`);

  // Test 9: Delete flashcard (DELETE)
  console.log(`\n🧪 TEST 9: Delete flashcard (DELETE /api/flashcards/${testId})`);
  console.log("=" .repeat(60));
  await apiCall(`/api/flashcards/${testId}`, {
    method: 'DELETE',
  });

  // Test 10: Verify deletion (should return 404)
  console.log(`\n🧪 TEST 10: Verify deletion - should return 404 (GET /api/flashcards/${testId})`);
  console.log("=" .repeat(60));
  await apiCall(`/api/flashcards/${testId}`);

  // Edge case tests
  console.log("\n🧪 TEST 11: Edge case - Invalid ID (GET /api/flashcards/invalid)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards/invalid');

  console.log("\n🧪 TEST 12: Edge case - Non-existent ID (GET /api/flashcards/999999)");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards/999999');

  console.log("\n🧪 TEST 13: Edge case - Invalid JSON body");
  console.log("=" .repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }

  console.log("\n🧪 TEST 14: Edge case - Empty flashcards array");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards', {
    method: 'POST',
    body: JSON.stringify({ flashcards: [] }),
  });

  console.log("\n🧪 TEST 15: Edge case - Missing required fields");
  console.log("=" .repeat(60));
  await apiCall('/api/flashcards', {
    method: 'POST',
    body: JSON.stringify({ flashcards: [{ front: "Test" }] }),
  });

  console.log("\n" + "=" .repeat(60));
  console.log("✅ All tests completed!");
  console.log("=" .repeat(60));
}

// Run tests
runTests().catch(console.error);

