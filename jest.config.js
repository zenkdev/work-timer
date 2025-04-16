// eslint-disable-next-line no-undef
module.exports = {
  roots: ['src'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
