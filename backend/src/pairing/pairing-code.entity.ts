import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('pairing_codes')
// Requirement 6: no two ACTIVE codes may collide (partial unique index).
@Index('uniq_active_code', ['code'], { unique: true, where: '"isActive" = 1' })
@Index('uniq_active_per_court', ['courtId'], { unique: true, where: '"isActive" = 1' })
export class PairingCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'int' })
  courtId: number

  @Column({ type: 'varchar', length: 6 })
  code: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'varchar', nullable: true })
  reason: string | null

  @Column({ type: 'datetime' })
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date
}
