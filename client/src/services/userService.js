import api from './api.js'

export async function getUsers() {
  const response = await api.get('/users')
  return response.data.users
}

