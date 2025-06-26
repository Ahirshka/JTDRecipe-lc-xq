import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { emailService } from "@/lib/email-service"
import { emailTokenService } from "@/lib/email-tokens"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Find user
    const users = await sql`
      SELECT id, username, email, is_verified
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a verification email has been sent",
      })
    }

    const user = users[0]

    if (user.is_verified) {
      return NextResponse.json(
        {
          success: false,
          error: "This email address is already verified",
        },
        { status: 400 },
      )
    }

    // Generate new verification token
    const verificationToken = await emailTokenService.createEmailVerificationToken(user.id)

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(user.email, user.username, verificationToken)

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send verification email",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to resend verification email",
      },
      { status: 500 },
    )
  }
}
