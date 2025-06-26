import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { emailService } from "./email-service"
import { emailTokenService } from "./email-tokens"

const sql = neon(process.env.DATABASE_URL!)

export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
}

export async function registerUser(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { username, email, password, confirmPassword } = data

    // Validation
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long" }
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { success: false, error: "Password must contain uppercase, lowercase, and number" }
    }

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return { success: false, error: "Username must be 3-30 characters, letters/numbers/underscores/hyphens only" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address" }
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE email = ${email.toLowerCase()} OR username = ${username.toLowerCase()}
      LIMIT 1
    `

    if (existingUsers.length > 0) {
      return { success: false, error: "User with this email or username already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    const userId = nanoid()

    // Create user (unverified initially)
    await sql`
      INSERT INTO users (id, username, email, password_hash, role, status, is_verified, created_at)
      VALUES (
        ${userId}, 
        ${username}, 
        ${email.toLowerCase()}, 
        ${hashedPassword}, 
        'user', 
        'active', 
        false, 
        ${new Date().toISOString()}
      )
    `

    // Create user profile
    await sql`
      INSERT INTO user_profiles (id, user_id, display_name, created_at, updated_at)
      VALUES (
        ${nanoid()}, 
        ${userId}, 
        ${username}, 
        ${new Date().toISOString()}, 
        ${new Date().toISOString()}
      )
    `

    // Generate email verification token
    const verificationToken = await emailTokenService.createEmailVerificationToken(userId)

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, username, verificationToken)

    if (!emailSent) {
      console.error("Failed to send verification email")
      // Don't fail registration if email fails, just log it
    }

    // Create session (allow login even before verification)
    const sessionToken = nanoid(32)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at)
      VALUES (${nanoid()}, ${userId}, ${sessionToken}, ${expiresAt.toISOString()}, ${new Date().toISOString()})
    `

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    const user: User = {
      id: userId,
      username,
      email: email.toLowerCase(),
      role: "user",
      status: "active",
      is_verified: false,
      created_at: new Date().toISOString(),
    }

    return { success: true, user }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Registration failed. Please try again." }
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Find user
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = users[0]

    // Check if account is active
    if (user.status !== "active") {
      return { success: false, error: "Account is suspended or inactive" }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session
    const sessionToken = nanoid(32)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at)
      VALUES (${nanoid()}, ${user.id}, ${sessionToken}, ${expiresAt.toISOString()}, ${new Date().toISOString()})
    `

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      created_at: user.created_at,
    }

    return { success: true, user: userData }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed. Please try again." }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const sessions = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status, u.is_verified, u.created_at
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} 
        AND s.expires_at > ${new Date().toISOString()}
      LIMIT 1
    `

    if (sessions.length === 0) {
      return null
    }

    return sessions[0] as User
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      // Delete session from database
      await sql`
        DELETE FROM user_sessions 
        WHERE session_token = ${sessionToken}
      `
    }

    // Clear session cookie
    cookieStore.delete("session_token")
  } catch (error) {
    console.error("Logout error:", error)
  }
}
