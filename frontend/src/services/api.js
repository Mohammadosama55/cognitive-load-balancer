import axios from 'axios'
import store from '../store'
import { logout } from '../store/slices/authSlice'

const api = axios.create({
  baseURL: '/api'
})

// Add token to requests
api.interceptors.request.use((config) => {
  const state = store.getState()
  const token = state.auth.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

export default api
