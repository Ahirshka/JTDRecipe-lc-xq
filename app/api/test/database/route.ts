import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    await initializeDatabase()

    // Test basic database connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      details: `Connected to PostgreSQL`,
      timestamp: result[0].current_time,
      version: result[0].db_version.split(" ")[0],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
