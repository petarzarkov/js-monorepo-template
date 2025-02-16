import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { HookHandlerDoneFunction } from 'fastify';
import { ServerResponse } from 'http';
import { REQUEST_ID_HEADER_KEY } from '@const';
import { BaseRequest } from '@api/BaseRequest';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  private logger = new Logger(this.constructor.name);

  use(req: BaseRequest, res: ServerResponse, next: HookHandlerDoneFunction) {
    const { method, originalUrl: url } = req;
    const requestId = req.headers[REQUEST_ID_HEADER_KEY] as string;

    this.logger.log({
      message: `<- ${method} ${url}`,
      requestId,
      request: {
        method: req.method,
        url,
        headers: req.headers,
        ...(!!req.query && {
          query: req.query,
        }),
        ...(!!req.body && {
          body: req.body,
        }),
      },
    });

    res.on('finish', () => {
      const { statusCode } = res;

      this.logger.log({
        message: `-> ${method} ${url} ${statusCode}`,
        requestId,
        response: {
          headers: res.getHeaders(),
        },
      });
    });

    next();
  }
}
