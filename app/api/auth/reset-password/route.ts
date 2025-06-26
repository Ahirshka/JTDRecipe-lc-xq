import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Token and password are required",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      )
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain uppercase, lowercase, number, and special character",
        },
        { status: 400 },
      )
    }

    // Find and validate token
    const tokens = await sql`
      SELECT et.id, et.user_id, et.expires_at, u.email, u.username
      FROM email_tokens et
      JOIN users u ON et.user_id = u.id
      WHERE et.token = ${token} 
        AND et.type = 'password_reset'
        AND et.used = false
        AND et.expires_at > NOW()
      LIMIT 1
    `

    if (tokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token",
        },
        { status: 400 },
      )
    }

    const tokenData = tokens[0]

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Start transaction
    await sql.begin(async (sql) => {
      // Update user password
      await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword},
            updated_at = NOW()
        WHERE id = ${tokenData.user_id}
      `

      // Mark token as used
      await sql`
        UPDATE email_tokens 
        SET used = true, 
            used_at = NOW()
        WHERE id = ${tokenData.id}
      `

      // Invalidate all other password reset tokens for this user
      await sql`
        UPDATE email_tokens 
        SET used = true, 
            used_at = NOW()
        WHERE user_id = ${tokenData.user_id} 
          AND type = 'password_reset' 
          AND used = false
          AND id != ${tokenData.id}
      `

      // Invalidate all user sessions (force re-login)
      await sql`
        UPDATE user_sessions 
        SET expires_at = NOW()
        WHERE user_id = ${tokenData.user_id}
      `
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset password",
      },
      { status: 500 },
    )
  }
}
