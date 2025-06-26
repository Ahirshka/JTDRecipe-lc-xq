import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-actions"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (user) {
      return NextResponse.json({
        success: true,
        user,
      })
    } else {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
