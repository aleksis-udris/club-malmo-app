import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import type { DeviceClass, Role } from '../common/types'

export type DeviceStatus = 'PENDING' | 'APPROVED' | 'REVOKED'

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  deviceClass: DeviceClass

  @Column({ type: 'varchar' })
  role: Role

  @Column({ type: 'varchar', default: 'PENDING' })
  status: DeviceStatus

  @Column({ type: 'varchar', nullable: true })
  label: string | null

  // SHA-256 of the registration token (never the token itself).
  @Column({ type: 'varchar', nullable: true })
  registrationTokenHash: string | null

  @Column({ type: 'varchar', nullable: true })
  fingerprint: string | null

  @Column({ type: 'varchar', nullable: true })
  enrollmentCode: string | null

  @Column({ type: 'int', default: 0 })
  anomalyCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
