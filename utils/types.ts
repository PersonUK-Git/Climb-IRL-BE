import type { Request, Response, NextFunction } from 'express';
import type { IUser } from '../models/User.js';

/**
 * Extended Express Request to include the authenticated user.
 */
export interface AuthRequest extends Request {
  user: IUser;
}

/**
 * Generic type for a request with a typed body.
 */
export interface TypedRequestBody<T> extends Request {
  body: T;
}

/**
 * Generic type for a request with a typed body and authenticated user.
 */
export interface AuthTypedRequest<T, P = any, Q = any> extends Request<P, any, T, Q> {
  user: IUser;
}

/**
 * Standard API Response structure if ever enforced.
 */
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}
