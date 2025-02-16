const config = {
  '!({services}/**/*.ts)': ['prettier --ignore-unknown --write'],
  '{services}/**/*.ts': ['prettier --ignore-unknown --write', 'eslint --fix'],
};

export default config;
