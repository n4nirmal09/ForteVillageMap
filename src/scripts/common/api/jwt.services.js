export const getToken = (key) => {
  return window.localStorage.getItem(key);
}

export const saveToken = (key, token) => {
  window.localStorage.setItem(key, token)
}

export const destroyToken = (key) => {
  window.localStorage.removeItem(key)
}

export default { getToken, saveToken, destroyToken }