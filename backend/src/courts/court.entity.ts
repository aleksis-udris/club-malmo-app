import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

export type CourtStatus = 'OFFLINE' | 'IDLE' | 'PAIRED' | 'LIVE' | 'FINISHED'

@Entity('courts')
export class Court {
  @PrimaryColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: 'IDLE' })
  status: CourtStatus

  @Column({ type: 'varchar', nullable: true })
  currentMatchId: string | null

  @UpdateDateColumn()
  updatedAt: Date
}
