// Disable colors in test environment
process.env.NO_COLOR = "1";

// Mock stdout.isTTY to be false in tests
process.stdout.isTTY = false;
