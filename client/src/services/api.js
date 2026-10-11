import axios from 'axios'

const tokenKey = 'resolveToken'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new Event('resolve:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error) {
  const errorData = error.response?.data?.error

  if (errorData) {
    if (errorData.details && typeof errorData.details === 'object') {
      const messages = Object.entries(errorData.details)
        .flatMap(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            return msgs.map((message) => `${field}: ${message}`)
          }
          return `${field}: ${msgs}`
        })
        .filter(Boolean)

      if (messages.length > 0) {
        return messages.join('. ')
      }
    }

    if (errorData.message) {
      return errorData.message
    }
  }

  if (error.message) {
    return error.message
  }

  return 'Request failed. Please try again.'
}

export default api

