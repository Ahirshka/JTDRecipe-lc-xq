"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnvStatus {
  [key: string]: {
    configured: boolean
    value?: string
    description: string
    required: boolean
  }
}

export default function SetupEnvironmentPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const environmentVariables = {
    DATABASE_URL: {
      value:
        "postgresql://neondb_owner:npg_XNsY8WRioeC9@ep-restless-glitter-a4wrq0fc-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
      description: "Your Neon PostgreSQL database connection string",
      required: true,
    },
    RESEND_API_KEY: {
      value: "re_xxxxxxxxx",
      description: "Your Resend API key for sending emails",
      required: true,
    },
    FROM_EMAIL: {
      value: "contact@justthedamnrecipe.net",
      description: "Email address for sending system emails",
      required: true,
    },
    JWT_SECRET: {
      value: "your_super_secret_jwt_key_minimum_32_characters_long_random_string",
      description: "Secret key for JWT token signing (32+ characters)",
      required: true,
    },
    NEXT_PUBLIC_APP_URL: {
      value: "https://justthedamnrecipe.net",
      description: "Your application's public URL",
      required: true,
    },
  }

  const checkEnvironmentStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test/env-check")
      if (response.ok) {
        const data = await response.json()
        setEnvStatus(data.environment_variables)
      }
    } catch (error) {
      console.error("Failed to check environment status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironmentStatus()
  }, [])

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${name} copied to clipboard`,
    })
  }

  const getStatusIcon = (configured: boolean) => {
    return configured ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (configured: boolean) => {
    return configured ? (
      <Badge variant="default" className="bg-green-500">
        Configured
      </Badge>
    ) : (
      <Badge variant="destructive">Missing</Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Environment Setup</h1>
        <p className="text-muted-foreground">
          Configure your environment variables to fix the "Loading..." issue on your homepage.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={checkEnvironmentStatus} disabled={loading} className="flex items-center gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Status
        </Button>
        <Button variant="outline" asChild>
          <a href="https://vercel.com/dashboard" target="_blank" className="flex items-center gap-2" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open Vercel Dashboard
          </a>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables Status</CardTitle>
          <CardDescription>
            These variables must be configured in your Vercel dashboard for your application to work properly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(environmentVariables).map(([key, config]) => {
              const status = envStatus?.[key]
              const isConfigured = status?.configured || false

              return (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(isConfigured)}
                      <span className="font-medium font-mono text-sm">{key}</span>
                      {getStatusBadge(isConfigured)}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    <div className="mt-2 p-2 bg-muted rounded font-mono text-xs break-all">{config.value}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.value, key)}
                    className="ml-4 flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How to Add Environment Variables to Vercel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Open Vercel Dashboard</p>
                <p className="text-sm text-muted-foreground">Go to your project → Settings → Environment Variables</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Add Each Variable</p>
                <p className="text-sm text-muted-foreground">Click "Add New" and paste the name and value from above</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Select All Environments</p>
                <p className="text-sm text-muted-foreground">
                  Make sure to select Production, Preview, and Development
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Redeploy</p>
                <p className="text-sm text-muted-foreground">
                  Go to Deployments → Click "Redeploy" on your latest deployment
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help Getting These Values?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <a href="https://console.neon.tech" target="_blank" className="flex items-center gap-2" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Neon Database Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                className="flex items-center gap-2"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Resend API Keys
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/test-connection" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Test Connection
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dns-settings" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                DNS Settings
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
