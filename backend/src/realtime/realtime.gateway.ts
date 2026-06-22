import { Logger } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

/**
 * Real-time gateway. Rooms are `court:{id}`. The TV joins read-only; a controller
 * must present a valid session JWT in the handshake to join. State is pushed by
 * the domain services via RealtimeGateway.emitCourtState().
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly log = new Logger('RealtimeGateway')
  @WebSocketServer() server: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.log.log('WebSocket gateway ready (rooms: court:{id})')
  }

  async handleConnection(socket: Socket) {
    // Token optional for spectators/TVs (read-only); validated if present.
    const token = socket.handshake.auth?.token as string | undefined
    if (token) {
      try {
        const p = await this.jwt.verifyAsync(token, { secret: this.config.get('jwtSecret') })
        socket.data.role = p.role
        socket.data.deviceId = p.sub
      } catch {
        socket.data.role = 'GUEST'
      }
    }
  }

  @SubscribeMessage('court:join')
  joinCourt(@ConnectedSocket() socket: Socket, @MessageBody() body: { courtId: number }) {
    socket.join(`court:${body.courtId}`)
    return { ok: true, room: `court:${body.courtId}` }
  }

  emitCourtState(courtId: number, state: unknown) {
    this.server?.to(`court:${courtId}`).emit('court:state', state)
  }

  emitPairingCode(courtId: number, code: string, expiresAt: Date) {
    this.server?.to(`court:${courtId}`).emit('pairing:code', { code, expiresAt })
  }

  emitScore(courtId: number, board: unknown) {
    this.server?.to(`court:${courtId}`).emit('score:applied', board)
  }
}
