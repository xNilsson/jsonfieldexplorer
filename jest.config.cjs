module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(cjs|js|jsx)$": "babel-jest",
  },
  testMatch: ["**/*.test.js", "**/*.test.cjs"],
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/setup.js"],
};
