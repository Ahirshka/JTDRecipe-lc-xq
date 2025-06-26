import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: "Database URL not configured",
        details: "DATABASE_URL environment variable is missing",
        error: "Missing DATABASE_URL environment variable",
      })
    }

    // Validate DATABASE_URL format
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
      return NextResponse.json({
        success: false,
        message: "Invalid database URL format",
        details: "DATABASE_URL must start with postgresql:// or postgres://",
        error: "Invalid URL format",
      })
    }

    // Test database connection
    const sql = neon(dbUrl)

    // Simple connection test
    const startTime = Date.now()
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    const connectionTime = Date.now() - startTime

    if (!result || result.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Database query failed",
        details: "Connection established but query returned no results",
        error: "Empty query result",
      })
    }

    // Test if required tables exist
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'recipes', 'user_sessions', 'email_tokens')
    `

    const existingTables = tableCheck.map((row) => row.table_name)
    const requiredTables = ["users", "recipes", "user_sessions", "email_tokens"]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    let tableStatus = "All required tables exist"
    if (missingTables.length > 0) {
      tableStatus = `Missing tables: ${missingTables.join(", ")}`
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      details: `Connected in ${connectionTime}ms. ${tableStatus}`,
      data: {
        connection_time: connectionTime,
        database_time: result[0].timestamp,
        existing_tables: existingTables,
        missing_tables: missingTables,
        tables_complete: missingTables.length === 0,
      },
    })
  } catch (error) {
    console.error("Database test error:", error)

    let errorMessage = "Database connection failed"
    let errorDetails = "Unknown database error"

    if (error instanceof Error) {
      errorMessage = error.message

      // Provide specific error guidance
      if (error.message.includes("authentication failed")) {
        errorDetails = "Database authentication failed. Check your username and password in DATABASE_URL"
      } else if (error.message.includes("connection refused")) {
        errorDetails = "Database server is not accessible. Check your host and port in DATABASE_URL"
      } else if (error.message.includes("timeout")) {
        errorDetails = "Database connection timed out. Check your network connection and database availability"
      } else if (error.message.includes("SSL")) {
        errorDetails = "SSL connection issue. Ensure your DATABASE_URL includes proper SSL parameters"
      } else if (error.message.includes("database") && error.message.includes("does not exist")) {
        errorDetails = "Database does not exist. Check the database name in your DATABASE_URL"
      } else {
        errorDetails = `Database error: ${error.message}`
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        details: errorDetails,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
