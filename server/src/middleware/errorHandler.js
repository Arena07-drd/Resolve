export function notFound(_request, response) {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found.',
    },
  })
}

export function errorHandler(error, _request, response, _next) {
  if (error?.code === 11000) {
    return response.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists.',
      },
    })
  }

  console.error('Unhandled request error:', error?.name ?? 'UnknownError')

  return response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  })
}
