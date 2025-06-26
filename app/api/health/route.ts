import { NextResponse } from "next/server"

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: process.env.DATABASE_URL ? "configured" : "not configured",
        email: process.env.RESEND_API_KEY ? "configured" : "not configured",
        domain: process.env.NEXT_PUBLIC_APP_URL ? "configured" : "not configured",
      },
    }

    return NextResponse.json({
      success: true,
      message: "Application is healthy",
      details: `Uptime: ${Math.floor(health.uptime)} seconds`,
      health,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
