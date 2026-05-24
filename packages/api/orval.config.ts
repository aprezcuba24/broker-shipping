import { defineConfig } from 'orval'

export default defineConfig({
  broker: {
    input: './openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/generated/endpoints.ts',
      schemas: './src/generated/models',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/client.ts',
          name: 'brokerFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
