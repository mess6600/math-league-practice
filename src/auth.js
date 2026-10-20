/** Family accounts — add the second twin here later. */
export const USERS = [
  {
    username: 'Amrit',
    password: '2020',
    displayName: 'Amrit',
    twin: 1,
  },
]

const SESSION_KEY = 'mlp:session'

export function findUser(username) {
  const u = String(username || '').trim()
  return USERS.find((x) => x.username.toLowerCase() === u.toLowerCase()) || null
}

export function login(username, password) {
  const user = findUser(username)
  if (!user || user.password !== String(password)) {
    return { ok: false, error: 'Wrong username or password' }
  }
  const session = {
    username: user.username,
    displayName: user.displayName,
    twin: user.twin,
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, session }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
