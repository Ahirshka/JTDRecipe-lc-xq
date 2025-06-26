import { type NextRequest, NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth-actions"

export async function POST(request: NextRequest) {
  try {
    await logoutUser()

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
      },
      { status: 500 },
    )
  }
}
