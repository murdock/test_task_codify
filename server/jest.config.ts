import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json', transpileOnly: true }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
}
export default config
