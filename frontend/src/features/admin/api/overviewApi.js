import { httpClient } from '@/api/httpClient'

// Calls of the admin overview (scenario 26). The contract is docs/api/admin.md, "Tổng quan".

/** @param {{ from: string, to: string }} period @returns {Promise<import('../types').AdminStats>} */
export async function getStats({ from, to }) {
  const { data } = await httpClient.get('/api/admin/stats', { params: { from, to } })
  return data
}
