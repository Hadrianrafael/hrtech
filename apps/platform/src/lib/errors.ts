export class AppError extends Error {
  constructor(
    message: string,
    public code = 'APP_ERROR',
    public status = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Registro não encontrado.') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Você não tem permissão para realizar esta ação.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class LimitExceededError extends AppError {
  constructor(message: string) {
    super(message, 'LIMIT_EXCEEDED', 402);
  }
}

export class NotConfiguredError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_CONFIGURED', 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Muitas tentativas. Aguarde um instante e tente novamente.') {
    super(message, 'RATE_LIMITED', 429);
  }
}
