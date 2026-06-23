import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

// A Sportradar competitor (player), v2 /competitors/{id}/profile.json or season competitors.
@Entity('sr_competitors')
export class SrCompetitor {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', nullable: true })
  country: string | null

  @Column({ type: 'varchar', nullable: true })
  countryCode: string | null

  @Column({ type: 'varchar', nullable: true })
  gender: string | null

  @Column({ type: 'int', default: 0 })
  played: number

  @Column({ type: 'simple-json' })
  payload: Record<string, unknown>

  @UpdateDateColumn()
  syncedAt: Date
}
