/**
 * Jest setup file for Firebase emulator tests
 */

// Set environment variables for Firebase emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS = 'localhost:8080';

// Increase timeout for emulator operations
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// console.log = jest.fn();
