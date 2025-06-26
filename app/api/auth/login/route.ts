import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await loginUser(email, password)

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        message: "Login successful",
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
