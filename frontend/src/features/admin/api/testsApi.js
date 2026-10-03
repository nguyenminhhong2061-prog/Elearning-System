import { httpClient } from '@/api/httpClient'

// Calls of the admin test pages (scenario 24). The contract is docs/api/admin.md, "Đề kiểm tra" (module C).

/** @returns {Promise<import('../types').AdminTestSummary[]>} */
export async function getTests() {
  const { data } = await httpClient.get('/api/admin/tests')
  return data
}

/** @returns {Promise<import('../types').AdminTest>} */
export async function getTest(id) {
  const { data } = await httpClient.get(`/api/admin/tests/${id}`)
  return data
}

export async function createTest(test) {
  const { data } = await httpClient.post('/api/admin/tests', test)
  return data
}

export async function updateTest(id, test) {
  const { data } = await httpClient.put(`/api/admin/tests/${id}`, test)
  return data
}

/** @param {number} id @param {{ title: string, startDate: string, endDate: string }} copy */
export async function duplicateTest(id, copy) {
  const { data } = await httpClient.post(`/api/admin/tests/${id}/duplicate`, copy)
  return data
}
