import { type NextRequest, NextResponse } from "next/server"
import { emailTokenService } from "@/lib/email-tokens"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    // Verify the token
    const verification = await emailTokenService.verifyToken(token, "email_verification")

    if (!verification.valid) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 400 })
    }

    // Mark user as verified
    await sql`
      UPDATE users 
      SET is_verified = true 
      WHERE id = ${verification.userId}
    `

    // Mark token as used
    await emailTokenService.markTokenAsUsed(token)

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Email verification failed",
      },
      { status: 500 },
    )
  }
}
