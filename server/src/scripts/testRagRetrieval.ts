/**
 * RAG Retrieval Test Script
 * 
 * Tests the RAG system's ability to retrieve relevant references from:
 * - Chicago Manual of Style rules
 * - Genre-specific conventions
 * 
 * Prerequisites:
 * 1. GEMINI_API_KEY environment variable must be set
 * 2. Reference data must be ingested (run ingestReferences.ts first)
 * 
 * Usage:
 *   cd server
 *   npx tsx src/scripts/testRagRetrieval.ts
 */

import { queryChicagoManual, queryGenreRules, formatCitations } from '../utils/ragHelper';

interface TestResult {
  testName: string;
  passed: boolean;
  results: any[];
  error?: string;
}

async function testChicagoManualQueries(): Promise<TestResult[]> {
  const tests: TestResult[] = [];
  
  // Test 1: Serial comma query
  try {
    console.log('\n📝 Test 1: Querying Chicago Manual - Serial Comma');
    const results = await queryChicagoManual('serial comma oxford comma usage', { topK: 3, threshold: 0.7 });
    tests.push({
      testName: 'Serial Comma Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Serial Comma Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  // Test 2: Dialogue punctuation query
  try {
    console.log('\n📝 Test 2: Querying Chicago Manual - Dialogue Punctuation');
    const results = await queryChicagoManual('dialogue punctuation quotation marks', { topK: 3, threshold: 0.7 });
    tests.push({
      testName: 'Dialogue Punctuation Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Dialogue Punctuation Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  // Test 3: Grammar rules query
  try {
    console.log('\n📝 Test 3: Querying Chicago Manual - Subject-Verb Agreement');
    const results = await queryChicagoManual('subject verb agreement grammar', { topK: 3, threshold: 0.7 });
    tests.push({
      testName: 'Grammar Rules Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Grammar Rules Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  return tests;
}

async function testGenreQueries(): Promise<TestResult[]> {
  const tests: TestResult[] = [];
  
  // Test 4: Romance genre query
  try {
    console.log('\n💕 Test 4: Querying Romance Genre - HEA Requirements');
    const results = await queryGenreRules('romance', 'happily ever after ending requirements', { topK: 2, threshold: 0.7 });
    tests.push({
      testName: 'Romance HEA Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Romance HEA Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  // Test 5: Thriller genre query
  try {
    console.log('\n🔪 Test 5: Querying Thriller Genre - Pacing Rules');
    const results = await queryGenreRules('thriller', 'pacing tension chapter endings', { topK: 2, threshold: 0.7 });
    tests.push({
      testName: 'Thriller Pacing Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Thriller Pacing Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  // Test 6: Sci-Fi genre query
  try {
    console.log('\n🚀 Test 6: Querying Sci-Fi Genre - World-Building');
    const results = await queryGenreRules('scifi', 'world building technology rules', { topK: 2, threshold: 0.7 });
    tests.push({
      testName: 'Sci-Fi World-Building Query',
      passed: results.length > 0,
      results
    });
    console.log(`✅ Found ${results.length} results`);
    console.log('Citations:', formatCitations(results));
  } catch (error) {
    tests.push({
      testName: 'Sci-Fi World-Building Query',
      passed: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error:', error);
  }
  
  return tests;
}

async function runAllTests() {
  console.log('🧪 Starting RAG Retrieval Tests');
  console.log('================================\n');
  
  // Check prerequisites
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY environment variable is not set');
    console.error('Please set GEMINI_API_KEY before running this test');
    process.exit(1);
  }
  
  console.log('✅ GEMINI_API_KEY is configured');
  
  // Run tests
  const chicagoTests = await testChicagoManualQueries();
  const genreTests = await testGenreQueries();
  
  // Summary
  const allTests = [...chicagoTests, ...genreTests];
  const passedCount = allTests.filter(t => t.passed).length;
  const totalCount = allTests.length;
  
  console.log('\n================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================');
  console.log(`Total Tests: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  
  if (passedCount === totalCount) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Details:');
    allTests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.testName}: ${t.error || 'No results found'}`);
    });
  }
  
  // Detailed results
  console.log('\n================================');
  console.log('📋 DETAILED RESULTS');
  console.log('================================');
  allTests.forEach(test => {
    console.log(`\n${test.passed ? '✅' : '❌'} ${test.testName}`);
    if (test.passed && test.results.length > 0) {
      console.log(`  Found ${test.results.length} relevant references`);
      test.results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.citation} (score: ${r.score.toFixed(3)})`);
        console.log(`     "${r.summary}"`);
      });
    } else if (test.error) {
      console.log(`  Error: ${test.error}`);
    } else {
      console.log('  No results found (may indicate missing reference data)');
    }
  });
  
  console.log('\n================================');
  console.log('✅ Test run complete');
  console.log('================================\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});