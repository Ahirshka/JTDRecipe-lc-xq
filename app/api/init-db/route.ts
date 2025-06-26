import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/neon"

export async function POST() {
  try {
    await initializeDatabase()
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with sample data",
    })
  } catch (error) {
    console.error("Database initialization failed:", error)

    // Fix: Proper error handling without 'in' operator
    let errorMessage = "Unknown error"
    if (error) {
      if (typeof error === "string") {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null) {
        errorMessage = String(error)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return POST() // Allow GET requests too for easier testing
}
