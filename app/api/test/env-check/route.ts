import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = {
      DATABASE_URL: {
        configured: !!process.env.DATABASE_URL,
        description: "PostgreSQL database connection string",
        required: true,
      },
      RESEND_API_KEY: {
        configured: !!process.env.RESEND_API_KEY,
        description: "Resend API key for email service",
        required: true,
      },
      FROM_EMAIL: {
        configured: !!process.env.FROM_EMAIL,
        description: "Email address for sending system emails",
        required: true,
      },
      JWT_SECRET: {
        configured: !!process.env.JWT_SECRET,
        description: "Secret key for JWT token signing",
        required: true,
      },
      NEXT_PUBLIC_APP_URL: {
        configured: !!process.env.NEXT_PUBLIC_APP_URL,
        description: "Public URL of the application",
        required: true,
      },
    }

    const configuredCount = Object.values(requiredEnvVars).filter((env) => env.configured).length
    const totalCount = Object.keys(requiredEnvVars).length
    const missingVariables = Object.entries(requiredEnvVars)
      .filter(([_, config]) => !config.configured)
      .map(([name, _]) => name)

    return NextResponse.json({
      success: configuredCount === totalCount,
      status: configuredCount === totalCount ? "complete" : "incomplete",
      configured_count: configuredCount,
      total_count: totalCount,
      environment_variables: Object.fromEntries(
        Object.entries(requiredEnvVars).map(([name, config]) => [
          name,
          {
            name,
            configured: config.configured,
            description: config.description,
            required: config.required,
          },
        ]),
      ),
      missing_variables: missingVariables,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: `Environment check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
