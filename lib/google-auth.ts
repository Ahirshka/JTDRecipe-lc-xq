// Google OAuth Configuration and Implementation
export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token: string
}

// Google OAuth Configuration - Updated to use the new redirect URI
export const googleConfig: GoogleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
  redirectUri: "https://www.justthedamnrecipe.net/oauth",
  scope: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ],
}

// Generate Google OAuth URL with provider parameter
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: "code",
    scope: googleConfig.scope.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: generateRandomState() + "|google", // Include provider in state
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}&provider=google`
}

// Generate random state for CSRF protection
const generateRandomState = (): string => {
  const array = new Uint32Array(4)
  crypto.getRandomValues(array)
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join("")
}

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<GoogleTokenResponse> => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: googleConfig.redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for token: ${error}`)
  }

  return response.json()
}

// Get user info from Google API
export const getGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  return response.json()
}

// Verify Google ID token (additional security)
export const verifyGoogleIdToken = async (idToken: string): Promise<any> => {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)

  if (!response.ok) {
    throw new Error("Invalid ID token")
  }

  const tokenInfo = await response.json()

  // Verify the token is for our application
  if (tokenInfo.aud !== googleConfig.clientId) {
    throw new Error("Token audience mismatch")
  }

  return tokenInfo
}

// Initialize Google OAuth (client-side)
export const initializeGoogleAuth = () => {
  // Store state in sessionStorage for verification
  const state = generateRandomState()
  sessionStorage.setItem("google_oauth_state", state)
  return state
}

// Verify OAuth state (CSRF protection)
export const verifyOAuthState = (receivedState: string): boolean => {
  const storedState = sessionStorage.getItem("google_oauth_state")
  sessionStorage.removeItem("google_oauth_state")

  // Extract the state part (before the pipe if provider is included)
  const stateOnly = receivedState.split("|")[0]

  return storedState === stateOnly
}
