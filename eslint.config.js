import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // react-hooks v5 agrego esta regla pero el patron setLoading(true) dentro
      // de useEffect es valido y consistente en todo el proyecto.
      'react-hooks/set-state-in-effect': 'off',
      // Los archivos de router mezclan lazy-components y el objeto router — es esperado.
      'react-refresh/only-export-components': 'warn',
      // Convenciones de nombres del estándar del proyecto
      '@typescript-eslint/naming-convention': [
        'error',
        // Interfaces y tipos: UpperCamelCase sin prefijo I
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        { selector: 'typeAlias', format: ['PascalCase'] },
        // Enums: UpperCamelCase
        { selector: 'enum', format: ['PascalCase'] },
        // Variables locales y funciones: lowerCamelCase (o PascalCase para componentes)
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // Parámetros: lowerCamelCase
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
      // Prohibir any explícito (el estándar exige tipado estricto)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Siempre usar llaves en bloques
      curly: ['error', 'all'],
      // No console.log en producción (solo warn/error)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
])
