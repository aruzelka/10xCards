#!/usr/bin/env node

const text1000 = "a".repeat(1000);
const text500 = "a".repeat(500);
const text11000 = "a".repeat(11000);

const tests = [
  {
    name: "Valid request (1000 chars)",
    data: { source_text: text1000 },
    expectedStatus: 201
  },
  {
    name: "Invalid - too short (500 chars)",
    data: { source_text: text500 },
    expectedStatus: 400
  },
  {
    name: "Invalid - too long (11000 chars)",
    data: { source_text: text11000 },
    expectedStatus: 400
  },
  {
    name: "Invalid - missing source_text",
    data: {},
    expectedStatus: 400
  },
  {
    name: "Invalid - empty JSON",
    data: null,
    expectedStatus: 400,
    rawBody: ""
  }
];

async function runTest(test) {
  console.log(`\n🧪 Test: ${test.name}`);

  try {
    const response = await fetch("http://localhost:3000/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: test.rawBody !== undefined ? test.rawBody : JSON.stringify(test.data)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    const status = response.status;
    const passed = status === test.expectedStatus;

    console.log(`   Status: ${status} ${passed ? "✅" : "❌ (expected " + test.expectedStatus + ")"}`);
    console.log(`   Response:`, JSON.stringify(responseData, null, 2));

    return passed;
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing POST /api/generations endpoint\n");
  console.log("=" .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("🎉 All tests passed!");
  }
}

main();

