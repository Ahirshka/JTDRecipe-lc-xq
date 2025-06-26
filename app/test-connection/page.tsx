"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

interface HealthCheck {
  timestamp: string
  status: string
  checks: {
    database: { status: string; message: string }
    environment: { status: string; message: string }
    email: { status: string; message: string }
  }
}

interface DNSStatus {
  domain: string
  accessible: boolean
  ssl_valid: boolean
  response_time: number
  status_code: number
  error?: string
}

export default function TestConnectionPage() {
  const [healthData, setHealthData] = useState<HealthCheck | null>(null)
  const [dnsData, setDNSData] = useState<DNSStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/health")
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      const data = await response.json()
      setHealthData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runDNSCheck = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test/dns-status")
      if (!response.ok) {
        throw new Error(`DNS check failed: ${response.status}`)
      }
      const data = await response.json()
      setDNSData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    await runHealthCheck()
    await runDNSCheck()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-500">
            Healthy
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connection Diagnostics</h1>
        <p className="text-muted-foreground">
          Test your application's connectivity to database, email service, and domain configuration.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={runAllTests} disabled={loading} className="flex items-center gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Run All Tests
        </Button>
        <Button variant="outline" onClick={runHealthCheck} disabled={loading}>
          Health Check Only
        </Button>
        <Button variant="outline" onClick={runDNSCheck} disabled={loading}>
          DNS Check Only
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Test Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {healthData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(healthData.status)}
                  Application Health Check
                </CardTitle>
                <CardDescription>Last checked: {new Date(healthData.timestamp).toLocaleString()}</CardDescription>
              </div>
              {getStatusBadge(healthData.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.checks.database.status)}
                  <span className="font-medium">Database Connection</span>
                </div>
                <div className="text-right">
                  {getStatusBadge(healthData.checks.database.status)}
                  <p className="text-sm text-muted-foreground mt-1">{healthData.checks.database.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.checks.environment.status)}
                  <span className="font-medium">Environment Variables</span>
                </div>
                <div className="text-right">
                  {getStatusBadge(healthData.checks.environment.status)}
                  <p className="text-sm text-muted-foreground mt-1">{healthData.checks.environment.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.checks.email.status)}
                  <span className="font-medium">Email Service</span>
                </div>
                <div className="text-right">
                  {getStatusBadge(healthData.checks.email.status)}
                  <p className="text-sm text-muted-foreground mt-1">{healthData.checks.email.message}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {dnsData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dnsData.accessible ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Domain Connectivity
            </CardTitle>
            <CardDescription>Testing: {dnsData.domain}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Domain Accessible:</span>
                  {dnsData.accessible ? (
                    <Badge variant="default" className="bg-green-500">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="destructive">No</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>SSL Certificate:</span>
                  {dnsData.ssl_valid ? (
                    <Badge variant="default" className="bg-green-500">
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Invalid</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-mono">{dnsData.response_time}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Code:</span>
                  <span className="font-mono">{dnsData.status_code}</span>
                </div>
              </div>
            </div>
            {dnsData.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{dnsData.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common fixes for connection issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/setup-environment" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Configure Environment Variables
              </a>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/dns-settings" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Check DNS Settings
              </a>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/test-email-system" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Test Email System
              </a>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                className="flex items-center gap-2"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Open Vercel Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
