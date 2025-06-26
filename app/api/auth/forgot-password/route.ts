import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { emailService } from "@/lib/email-service"
import { emailTokenService } from "@/lib/email-tokens"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, username, email, status
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    // Always return success to prevent email enumeration attacks
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent",
      })
    }

    const user = users[0]

    // Check if account is active
    if (user.status !== "active") {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent",
      })
    }

    // Generate password reset token
    const resetToken = await emailTokenService.createPasswordResetToken(user.id)

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(user.email, user.username, resetToken)

    if (!emailSent) {
      console.error("Failed to send password reset email to:", user.email)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send password reset email",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process password reset request",
      },
      { status: 500 },
    )
  }
}
