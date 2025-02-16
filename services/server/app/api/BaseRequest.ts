import { FastifyRequest } from 'fastify';

export type BaseRequest<Body = unknown, Query = unknown> = FastifyRequest<{ Body?: Body; Querystring?: Query }>;
