import request from './request'

export function getDashboardStats() {
  return request.get('/dashboard/stats')
}

export function getAbnormalUsers() {
  return request.get('/dashboard/abnormal-users')
}

export function getCustomerList(keyword) {
  return request.get('/customers', { params: keyword ? { keyword } : {} })
}

export function getCustomerRiskData(id) {
  return request.get(`/customers/${id}/risk-data`)
}
