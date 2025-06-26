import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token is required",
        },
        { status: 400 },
      )
    }

    // Check if token exists and is valid
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

    return NextResponse.json({
      success: true,
      message: "Token is valid",
    })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify reset token",
      },
      { status: 500 },
    )
  }
}
