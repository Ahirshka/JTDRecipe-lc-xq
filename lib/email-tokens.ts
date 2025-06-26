import { nanoid } from "nanoid"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface EmailToken {
  id: string
  user_id: string
  token: string
  type: "email_verification" | "password_reset"
  expires_at: Date
  used: boolean
  created_at: Date
}

export class EmailTokenService {
  // Generate a secure token
  private generateToken(): string {
    return nanoid(32)
  }

  // Create email verification token
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await sql`
      INSERT INTO email_tokens (id, user_id, token, type, expires_at, used, created_at)
      VALUES (${nanoid()}, ${userId}, ${token}, 'email_verification', ${expiresAt.toISOString()}, false, ${new Date().toISOString()})
    `

    return token
  }

  // Create password reset token
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Invalidate any existing password reset tokens for this user
    await sql`
      UPDATE email_tokens 
      SET used = true 
      WHERE user_id = ${userId} AND type = 'password_reset' AND used = false
    `

    await sql`
      INSERT INTO email_tokens (id, user_id, token, type, expires_at, used, created_at)
      VALUES (${nanoid()}, ${userId}, ${token}, 'password_reset', ${expiresAt.toISOString()}, false, ${new Date().toISOString()})
    `

    return token
  }

  // Verify token
  async verifyToken(
    token: string,
    type: "email_verification" | "password_reset",
  ): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      const result = await sql`
        SELECT user_id, expires_at, used
        FROM email_tokens
        WHERE token = ${token} AND type = ${type}
        LIMIT 1
      `

      if (result.length === 0) {
        return { valid: false, error: "Invalid token" }
      }

      const tokenData = result[0]

      if (tokenData.used) {
        return { valid: false, error: "Token has already been used" }
      }

      if (new Date() > new Date(tokenData.expires_at)) {
        return { valid: false, error: "Token has expired" }
      }

      return { valid: true, userId: tokenData.user_id }
    } catch (error) {
      console.error("Token verification error:", error)
      return { valid: false, error: "Token verification failed" }
    }
  }

  // Mark token as used
  async markTokenAsUsed(token: string): Promise<void> {
    await sql`
      UPDATE email_tokens 
      SET used = true 
      WHERE token = ${token}
    `
  }

  // Clean up expired tokens (run this periodically)
  async cleanupExpiredTokens(): Promise<void> {
    await sql`
      DELETE FROM email_tokens 
      WHERE expires_at < ${new Date().toISOString()} OR used = true
    `
  }
}

export const emailTokenService = new EmailTokenService()
