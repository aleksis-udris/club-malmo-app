export type DeviceClass = 'MOBILE' | 'TABLET' | 'TV' | 'DESKTOP'
export type Role = 'ROLE_TV' | 'ROLE_CONTROLLER' | 'ROLE_ADMIN' | 'ROLE_SERVICE'

export interface VerifiedSession {
  deviceId: string
  role: Role
  deviceClass: DeviceClass
}
