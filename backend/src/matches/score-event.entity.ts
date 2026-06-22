import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('score_events')
@Index('uniq_event_seq', ['matchId', 'seq'], { unique: true })
export class ScoreEvent {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar' })
  matchId: string

  @Column({ type: 'int' })
  seq: number

  @Column({ type: 'varchar' })
  type: string

  @Column({ type: 'simple-json' })
  payload: Record<string, unknown>

  @Column({ type: 'varchar', nullable: true })
  sessionId: string | null

  @CreateDateColumn()
  createdAt: Date
}
