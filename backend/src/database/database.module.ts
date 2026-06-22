import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

/**
 * Database = SQLite.
 *
 * Uses TypeORM's pure-JS `sqljs` driver (no native compilation) persisted to a
 * SQLite file on disk (DATABASE_FILE, default ./data/squash.sqlite). Entities are
 * auto-loaded; `synchronize` builds the schema on boot (use migrations in prod).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        type: 'sqljs' as const,
        location: process.env.DATABASE_FILE ?? 'data/squash.sqlite',
        autoSave: true,
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
