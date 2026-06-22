import { Column, Entity, PrimaryColumn } from 'typeorm'

// Gate that decides whether the sync layer may call origin (spec §6/A4).
@Entity('sr_sync_state')
export class SyncState {
  @PrimaryColumn({ type: 'varchar' })
  resourceKey: string

  @Column({ type: 'varchar', nullable: true })
  etag: string | null

  @Column({ type: 'varchar', nullable: true })
  contentHash: string | null

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  nextSyncAt: Date | null

  @Column({ type: 'int', default: 0 })
  failureCount: number

  @Column({ type: 'varchar', default: 'closed' })
  circuitState: string
}
