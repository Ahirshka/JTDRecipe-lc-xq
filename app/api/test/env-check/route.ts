import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Define required environment variables
    const requiredEnvVars = {
      DATABASE_URL: {
        description: "Neon PostgreSQL database connection string",
        required: true,
      },
      RESEND_API_KEY: {
        description: "Resend API key for sending emails",
        required: true,
      },
      FROM_EMAIL: {
        description: "Email address for sending system emails",
        required: true,
      },
      JWT_SECRET: {
        description: "Secret key for JWT token signing",
        required: true,
      },
      NEXT_PUBLIC_APP_URL: {
        description: "Public URL of the application",
        required: true,
      },
    }

    const environmentVariables: Record<string, any> = {}
    const missingVariables: string[] = []
    let configuredCount = 0

    // Check each environment variable
    for (const [varName, config] of Object.entries(requiredEnvVars)) {
      const value = process.env[varName]
      const isConfigured = Boolean(value && value.trim() !== "")

      environmentVariables[varName] = {
        name: varName,
        configured: isConfigured,
        description: config.description,
        required: config.required,
      }

      if (isConfigured) {
        configuredCount++
      } else if (config.required) {
        missingVariables.push(varName)
      }
    }

    const totalCount = Object.keys(requiredEnvVars).length
    const isComplete = missingVariables.length === 0

    return NextResponse.json({
      success: isComplete,
      status: isComplete ? "complete" : "incomplete",
      message: isComplete
        ? "All environment variables are configured"
        : `${missingVariables.length} environment variables are missing`,
      configured_count: configuredCount,
      total_count: totalCount,
      environment_variables: environmentVariables,
      missing_variables: missingVariables,
      details: isComplete
        ? "All required environment variables are present and configured"
        : `Missing variables: ${missingVariables.join(", ")}. Add these to your Vercel environment variables.`,
    })
  } catch (error) {
    console.error("Environment check error:", error)

    return NextResponse.json({
      success: false,
      status: "error",
      message: "Failed to check environment variables",
      error: error instanceof Error ? error.message : "Unknown error",
      configured_count: 0,
      total_count: 0,
      environment_variables: {},
      missing_variables: [],
    })
  }
}
