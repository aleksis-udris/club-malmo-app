import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type MatchStatus = 'CONFIGURED' | 'LIVE' | 'FINISHED' | 'ABANDONED'

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'int' })
  courtId: number

  @Column({ type: 'varchar', default: 'CONFIGURED' })
  status: MatchStatus

  @Column({ type: 'varchar' })
  homeName: string

  @Column({ type: 'varchar' })
  awayName: string

  @Column({ type: 'varchar', default: '' })
  draw: string

  @Column({ type: 'int', default: 0 })
  homeGames: number

  @Column({ type: 'int', default: 0 })
  awayGames: number

  @Column({ type: 'int', default: 0 })
  homePoints: number

  @Column({ type: 'int', default: 0 })
  awayPoints: number

  @Column({ type: 'int', default: 0 })
  homeFouls: number

  @Column({ type: 'int', default: 0 })
  awayFouls: number

  @Column({ type: 'varchar', default: 'home' })
  serving: 'home' | 'away'

  @Column({ type: 'int', default: 1 })
  rubber: number

  @Column({ type: 'varchar', nullable: true })
  winner: 'home' | 'away' | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
