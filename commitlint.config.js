/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['gitmoji'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};
