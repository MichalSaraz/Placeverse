// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';
import eslintConfigPrettier from 'eslint-config-prettier';

export default withNuxt({
  rules: {
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'any',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    // Prettier compatibility rules
    'vue/max-attributes-per-line': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/html-indent': 'off',
    'vue/html-quotes': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/mustache-interpolation-spacing': 'off',
    'vue/no-multi-spaces': 'off',
    'vue/no-spaces-around-equal-signs-in-attribute': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    ...eslintConfigPrettier.rules,
  },
  ignores: ['**/*.sql'],
});
