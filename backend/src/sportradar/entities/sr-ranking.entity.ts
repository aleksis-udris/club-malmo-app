import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity('sr_rankings')
@Index('uniq_ranking', ['rankingType', 'week', 'playerId'], { unique: true })
export class SrRanking {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar' })
  rankingType: string

  @Column({ type: 'varchar' })
  week: string

  @Column({ type: 'varchar' })
  playerId: string

  @Column({ type: 'varchar' })
  playerName: string

  @Column({ type: 'int' })
  rank: number

  @Column({ type: 'int', default: 0 })
  points: number
}
