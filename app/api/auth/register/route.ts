import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, confirmPassword } = body

    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    const result = await registerUser({
      username,
      email,
      password,
      confirmPassword,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        message: "Registration successful",
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
