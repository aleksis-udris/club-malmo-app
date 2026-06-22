import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'

// Mirror of a Sportradar sport_event (match). Historical rows are frozen.
@Entity('sr_events')
export class SrEvent {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Index()
  @Column({ type: 'varchar' })
  status: string // not_started | live | closed | cancelled

  @Column({ type: 'datetime', nullable: true })
  scheduled: Date | null

  @Column({ type: 'varchar', nullable: true })
  tournamentId: string | null

  @Column({ type: 'varchar', nullable: true })
  homeName: string | null

  @Column({ type: 'varchar', nullable: true })
  awayName: string | null

  @Column({ type: 'boolean', default: false })
  isHistorical: boolean

  @Column({ type: 'simple-json' })
  payload: Record<string, unknown>

  @UpdateDateColumn()
  syncedAt: Date
}
