// Helper function to decode the JWT token and get the userId
// The token contains user info encoded in it (set by the backend)
// We decode it to get the userId without needing to call the API

export const getUserIdFromToken = (token: string): string => {
  // JWT token has 3 parts separated by dots: header.payload.signature
  // We only need the middle part (payload) which contains user info
  const payload = JSON.parse(atob(token.split('.')[1]))
  
  // Our backend sets 'sub' as the userId in auth.service.ts:
  // const payload = { sub: user.id, email: user.email }
  return payload.sub
}