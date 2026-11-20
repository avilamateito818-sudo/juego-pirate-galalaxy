import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.vite/**',
      'server/prisma/migrations/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Regla 2 & Regla 3 de ARCHITECTURE.md: /shared es 100% puro y determinista
  {
    files: ['shared/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.es2022
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'three',
                'three/*',
                '@react-three/*',
                'react',
                'react-dom',
                'zustand',
                'colyseus',
                'colyseus.js',
                '@colyseus/*',
                '@prisma/client',
                'prisma',
                'express',
                '@starcorsair/client',
                '@starcorsair/server',
                '../client*',
                '../server*',
                '../../client*',
                '../../server*'
              ],
              message:
                'VIOLACIÓN ARCHITECTURE.md (Regla 3): /shared debe permanecer 100% puro sin dependencias de cliente, servidor, renderizado, red ni BD.'
            }
          ]
        }
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'VIOLACIÓN ARCHITECTURE.md (Regla 2): Prohibido Math.random() en /shared. Pasa rngRoll como parámetro explícito.'
        },
        {
          object: 'Date',
          property: 'now',
          message:
            'VIOLACIÓN ARCHITECTURE.md (Regla 2): Prohibido Date.now() en /shared. Pasa nowMs/dt como parámetro explícito.'
        }
      ]
    }
  },
  // Regla 3 de ARCHITECTURE.md: /client no puede importar /server ni Prisma
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@starcorsair/server',
                '@prisma/client',
                'prisma',
                'colyseus',
                '@colyseus/ws-transport',
                'express',
                '../server*',
                '../../server*'
              ],
              message:
                'VIOLACIÓN ARCHITECTURE.md (Regla 3): /client no puede importar módulos de /server ni de Prisma.'
            }
          ]
        }
      ]
    }
  },
  // Regla 3 de ARCHITECTURE.md: /server no puede importar /client, React ni Three.js
  {
    files: ['server/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@starcorsair/client',
                'react',
                'react-dom',
                'three',
                'three/*',
                '@react-three/*',
                'zustand',
                'colyseus.js',
                '../client*',
                '../../client*'
              ],
              message:
                'VIOLACIÓN ARCHITECTURE.md (Regla 3): /server no puede importar módulos de /client, React ni Three.js.'
            }
          ]
        }
      ]
    }
  }
);
