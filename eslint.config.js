import globals from 'globals';
export default [
  {ignores:['node_modules/**','dist/**','github-export/**','.backups/**','qa/**','social-kit/**','伯纳乌球场.html']},
  {
    files:['src/**/*.js','tests/**/*.{js,mjs}','tools/*.mjs','*.{js,mjs}'],
    languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{...globals.browser,...globals.node}},
    rules:{'no-undef':'error','no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],'no-unreachable':'error','no-constant-condition':'error','no-duplicate-imports':'error','no-dupe-keys':'error','no-self-assign':'error','valid-typeof':'error','constructor-super':'error','no-unsafe-optional-chaining':'error'},
  },
];
