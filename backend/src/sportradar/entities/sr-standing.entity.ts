import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

// A season standings row (Sportradar v2 /seasons/{id}/standings.json).
@Entity('sr_standings')
@Index('uniq_standing', ['seasonId', 'competitorId'], { unique: true })
export class SrStanding {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar' })
  seasonId: string

  @Column({ type: 'varchar' })
  competitorId: string

  @Column({ type: 'varchar' })
  competitorName: string

  @Column({ type: 'varchar', nullable: true })
  countryCode: string | null

  @Column({ type: 'int' })
  rank: number

  @Column({ type: 'int', default: 0 })
  played: number

  @Column({ type: 'int', default: 0 })
  won: number

  @Column({ type: 'int', default: 0 })
  lost: number

  @Column({ type: 'int', default: 0 })
  points: number
}
