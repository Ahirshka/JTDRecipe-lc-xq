// Centralized OAuth Provider Configuration

export interface OAuthProviderConfig {
  name: string
  displayName: string
  clientId: string
  clientSecret?: string
  redirectUri: string
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string[]
  icon: string
  color: string
}

// Centralized redirect URI for all providers
const OAUTH_REDIRECT_URI = "https://www.justthedamnrecipe.net/oauth"

export const oauthProviders: Record<string, OAuthProviderConfig> = {
  google: {
    name: "google",
    displayName: "Google",
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: OAUTH_REDIRECT_URI,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
    icon: "🔍",
    color: "text-blue-600",
  },
  facebook: {
    name: "facebook",
    displayName: "Facebook",
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    redirectUri: OAUTH_REDIRECT_URI,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/v18.0/me",
    scope: ["email", "public_profile"],
    icon: "📘",
    color: "text-blue-700",
  },
  instagram: {
    name: "instagram",
    displayName: "Instagram",
    clientId: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || "",
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
    redirectUri: OAUTH_REDIRECT_URI,
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    userInfoUrl: "https://graph.instagram.com/me",
    scope: ["user_profile", "user_media"],
    icon: "📷",
    color: "text-pink-600",
  },
  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID || "",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
    redirectUri: OAUTH_REDIRECT_URI,
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token",
    userInfoUrl: "https://open.tiktokapis.com/v2/user/info",
    scope: ["user.info.basic"],
    icon: "🎵",
    color: "text-black",
  },
}

// Generate OAuth URL for any provider
export const generateOAuthUrl = (providerName: string): string => {
  const provider = oauthProviders[providerName]
  if (!provider) {
    throw new Error(`Unsupported OAuth provider: ${providerName}`)
  }

  const state = generateRandomState() + `|${providerName}`

  // Store state for verification
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`${providerName}_oauth_state`, state.split("|")[0])
  }

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: "code",
    scope: provider.scope.join(" "),
    state: state,
  })

  // Add provider-specific parameters
  if (providerName === "google") {
    params.append("access_type", "offline")
    params.append("prompt", "consent")
  }

  return `${provider.authUrl}?${params.toString()}&provider=${providerName}`
}

// Generate random state for CSRF protection
const generateRandomState = (): string => {
  const array = new Uint32Array(4)
  if (typeof window !== "undefined" && window.crypto) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff)
    }
  }
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join("")
}

// Verify OAuth state for any provider
export const verifyProviderOAuthState = (providerName: string, receivedState: string): boolean => {
  if (typeof window === "undefined") return false

  const storedState = sessionStorage.getItem(`${providerName}_oauth_state`)
  sessionStorage.removeItem(`${providerName}_oauth_state`)

  // Extract the state part (before the pipe)
  const stateOnly = receivedState.split("|")[0]

  return storedState === stateOnly
}
