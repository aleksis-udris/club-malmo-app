import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'INTERNAL_ERROR' }
    if (status >= 500) this.log.error(exception)
    res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body)
  }
}
