import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type SessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

@Entity('pairing_sessions')
export class PairingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'int' })
  courtId: number

  // SHA-256 of the court-scoped pairing token (raw token returned once).
  @Column({ type: 'varchar' })
  tokenHash: string

  @Column({ type: 'varchar', nullable: true })
  deviceId: string | null

  @Column({ type: 'varchar', nullable: true })
  label: string | null

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: SessionStatus

  @Column({ type: 'datetime' })
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date
}
