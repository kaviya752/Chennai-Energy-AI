import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const fetchEnergy = (days = 7) => api.get(`/energy?days=${days}`).then(r => r.data)
export const fetchForecast = (horizon = 'day') => api.get(`/predict?horizon=${horizon}`).then(r => r.data)
export const fetchAnomalies = (days = 30) => api.get(`/anomalies?days=${days}`).then(r => r.data)
export const fetchRecommendations = () => api.get('/recommendations').then(r => r.data)
export const sendChat = (message, language, history) =>
  api.post('/chat', { message, language, history }).then(r => r.data)
