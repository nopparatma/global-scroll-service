import { defineConfig } from 'prisma/config';
import { env } from 'prisma/config';

export default defineConfig({
    engine: 'classic',
    datasource: {
        url: env('DATABASE_URL'),
    },
});
