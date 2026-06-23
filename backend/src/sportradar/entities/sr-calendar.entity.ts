import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

// A squash event (a Sportradar season = a tournament edition) for the calendar.
@Entity('sr_calendar')
export class SrCalendarEvent {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', nullable: true })
  gender: string | null // men | women | mixed

  @Column({ type: 'varchar', nullable: true })
  countryCode: string | null

  @Column({ type: 'varchar', nullable: true })
  countryName: string | null

  @Column({ type: 'varchar', nullable: true })
  startDate: string | null // 'YYYY-MM-DD'

  @Column({ type: 'varchar', nullable: true })
  endDate: string | null

  @Column({ type: 'varchar', nullable: true })
  venue: string | null

  @Column({ type: 'boolean', default: false })
  isSweden: boolean

  @UpdateDateColumn()
  syncedAt: Date
}
