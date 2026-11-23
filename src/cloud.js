const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const sessionKey = 'studyspace-supabase-session'

const headers = (token, extra = {}) => ({ apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra })
const request = async (path, options = {}, token) => {
  if (!url || !key) throw new Error('Cloud sync has not been configured yet.')
  const response = await fetch(`${url}${path}`, { ...options, headers: headers(token, options.headers) })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.msg || data?.message || 'Cloud request failed.')
  return data
}

export const cloudReady = () => Boolean(url && key)
export const getSession = () => JSON.parse(localStorage.getItem(sessionKey) || 'null')
export const signOut = () => localStorage.removeItem(sessionKey)
export function startGoogleSignIn() {
  if (!cloudReady()) throw new Error('Cloud sync has not been configured yet.')
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  window.location.assign(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`)
}
export async function consumeOAuthRedirect() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const error = params.get('error_description') || params.get('error')
  const accessToken = params.get('access_token')
  if (!accessToken && !error) return null
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
  if (error) throw new Error(error)
  const user = await request('/auth/v1/user', {}, accessToken)
  const session = { access_token: accessToken, user, expires_at: Number(params.get('expires_in') || 0) + Math.floor(Date.now() / 1000) }
  localStorage.setItem(sessionKey, JSON.stringify(session))
  return session
}
const usernameToEmail = username => `${username.trim().toLowerCase()}@studyspace.local`
export async function signIn(username, password, isSignUp = false) {
  const cleanUsername = username.trim().toLowerCase()
  if (!/^[a-z0-9_-]{3,30}$/.test(cleanUsername)) throw new Error('Use 3–30 letters, numbers, hyphens, or underscores for your username.')
  const path = isSignUp ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password'
  const data = await request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: usernameToEmail(cleanUsername), password, ...(isSignUp ? { data: { username: cleanUsername } } : {}) }) })
  if (!data.access_token) return { needsConfirmation: true }
  const session = { access_token: data.access_token, user: data.user, expires_at: data.expires_at }
  localStorage.setItem(sessionKey, JSON.stringify(session))
  return { session }
}
export async function pullCards(session) {
  const rows = await request(`/rest/v1/studyspace_cards?select=payload&user_id=eq.${session.user.id}`, {}, session.access_token)
  return rows.map(row => row.payload)
}
export async function pushCards(cards, session) {
  if (!cards.length) return
  const rows = cards.map(card => ({ id: card.id, user_id: session.user.id, payload: card, updated_at: new Date().toISOString() }))
  await request('/rest/v1/studyspace_cards?on_conflict=id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) }, session.access_token)
}
export async function removeCloudCard(id, session) {
  await request(`/rest/v1/studyspace_cards?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }, session.access_token)
}
