import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.test.json" }
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!uuid)"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

export default config;
