module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "plugin:react/recommended",
        "plugin:vue/vue3-recommended",
        "plugin:@typescript-eslint/recommended",
        "airbnb"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    "rules": {
        "prefer-const": 0,
        "no-param-reassign": 0,
        "@typescript-eslint/no-var-requires": 0,
        "import/no-dynamic-require": 0,
        "global-require": 0,
        "import/extensions": 0,
        "consistent-return": 0,
        "import/prefer-default-export": 0,
        "import/no-unresolved": 0,
        "max-len": 0,
        "@typescript-eslint/ban-types": 0,
        "class-methods-use-this": 0,
        "import/no-import-module-exports": 0,
        "no-nested-ternary": 0,
        "no-console": 0,
        "no-restricted-syntax": 0,
        "react/jsx-filename-extension": 0,
        "react/function-component-definition": 0,
        "@typescript-eslint/ban-ts-comment": 0,
        "object-curly-newline": 0,
        "@typescript-eslint/no-explicit-any": 0
    }
}
