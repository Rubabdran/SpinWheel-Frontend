const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export async function fetchNearest({ lat, lng, category, limit = 50 }) {
  const url = new URL(BASE + '/api/places/nearest')
  url.searchParams.set('lat', lat)
  url.searchParams.set('lng', lng)
  url.searchParams.set('category', category)
  url.searchParams.set('limit', limit)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}