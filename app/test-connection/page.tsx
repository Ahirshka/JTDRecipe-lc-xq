"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Database,
  Mail,
  Globe,
  Settings,
  Zap,
  Shield,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error" | "warning"
  message: string
  details?: string
  duration?: number
  error?: string
}

interface TestSuite {
  environment: TestResult
  database: TestResult
  email: TestResult
  domain: TestResult
}

export default function TestConnectionPage() {
  const [tests, setTests] = useState<TestSuite>({
    environment: { name: "Environment Variables", status: "pending", message: "Ready to test configuration" },
    database: { name: "Database Connection", status: "pending", message: "Ready to test Neon PostgreSQL" },
    email: { name: "Email Service", status: "pending", message: "Ready to test Resend API" },
    domain: { name: "Domain & SSL", status: "pending", message: "Ready to test justthedamnrecipe.net" },
  })

  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState("")
  const { toast } = useToast()

  const updateTest = (testName: keyof TestSuite, updates: Partial<TestResult>) => {
    setTests((prev) => ({
      ...prev,
      [testName]: { ...prev[testName], ...updates },
    }))
  }

  const runTest = async (testName: keyof TestSuite, endpoint: string, testDescription: string) => {
    const startTime = Date.now()
    setCurrentTest(testDescription)
    updateTest(testName, { status: "running", message: "Testing..." })

    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      const duration = Date.now() - startTime

      if (data.success) {
        updateTest(testName, {
          status: "success",
          message: data.message || "Test passed",
          details: data.details,
          duration,
        })
      } else {
        updateTest(testName, {
          status: "error",
          message: data.message || "Test failed",
          details: data.details,
          error: data.error,
          duration,
        })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTest(testName, {
        status: "error",
        message: "Connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setProgress(0)
    setCurrentTest("Initializing test suite...")

    // Reset all tests
    setTests({
      environment: { name: "Environment Variables", status: "pending", message: "Preparing..." },
      database: { name: "Database Connection", status: "pending", message: "Waiting..." },
      email: { name: "Email Service", status: "pending", message: "Waiting..." },
      domain: { name: "Domain & SSL", status: "pending", message: "Waiting..." },
    })

    try {
      // Test 1: Environment Variables
      setProgress(10)
      await runTest("environment", "/api/test/env-check", "Checking environment variables...")
      setProgress(25)

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Test 2: Database Connection
      await runTest("database", "/api/test/database", "Testing database connection...")
      setProgress(50)

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Test 3: Email Service
      await runTest("email", "/api/test/email-connection", "Testing email service...")
      setProgress(75)

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Test 4: Domain & SSL
      await runTest("domain", "/api/test/domain", "Testing domain connectivity...")
      setProgress(100)

      setCurrentTest("Tests completed!")

      toast({
        title: "Tests Complete",
        description: "All connection tests have finished running",
      })
    } catch (error) {
      toast({
        title: "Test Error",
        description: "An error occurred while running tests",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
      setCurrentTest("")
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Passed</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Running</Badge>
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            Pending
          </Badge>
        )
    }
  }

  const getTestIcon = (testName: keyof TestSuite) => {
    switch (testName) {
      case "environment":
        return <Settings className="h-6 w-6 text-blue-600" />
      case "database":
        return <Database className="h-6 w-6 text-green-600" />
      case "email":
        return <Mail className="h-6 w-6 text-purple-600" />
      case "domain":
        return <Globe className="h-6 w-6 text-orange-600" />
    }
  }

  const allTestsComplete = Object.values(tests).every(
    (test) => test.status === "success" || test.status === "error" || test.status === "warning",
  )

  const hasErrors = Object.values(tests).some((test) => test.status === "error")
  const allPassed = Object.values(tests).every((test) => test.status === "success")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Connection Diagnostics</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive testing suite to identify and resolve the "Loading..." issue on justthedamnrecipe.net
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Test Suite Controls
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Run comprehensive diagnostics to identify configuration issues
                </CardDescription>
              </div>
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-md"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isRunning && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Progress</span>
                  <span className="text-blue-600">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
                {currentTest && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{currentTest}</span>
                  </div>
                )}
              </div>
            )}

            {allTestsComplete && (
              <Alert
                className={`border-2 ${
                  allPassed
                    ? "border-green-200 bg-green-50"
                    : hasErrors
                      ? "border-red-200 bg-red-50"
                      : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base font-medium">
                  {allPassed
                    ? "🎉 All tests passed! Your connection setup is working correctly."
                    : hasErrors
                      ? "❌ Some tests failed. Check the details below and use the quick actions to fix issues."
                      : "⚠️ Tests completed with warnings. Review the results below."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="grid gap-6">
          {Object.entries(tests).map(([key, test]) => (
            <Card
              key={key}
              className={`transition-all duration-300 shadow-md border-0 ${
                test.status === "running" ? "ring-2 ring-blue-300 shadow-lg" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-50 rounded-lg">{getTestIcon(key as keyof TestSuite)}</div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{test.name}</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">{test.message}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.duration && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{test.duration}ms</span>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {(test.details || test.error) && (
                <CardContent className="pt-0">
                  {test.details && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                      <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Details:
                      </p>
                      <p className="text-gray-700 leading-relaxed">{test.details}</p>
                    </div>
                  )}

                  {test.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Error:
                      </p>
                      <p className="text-red-700 font-mono text-sm bg-red-100 p-2 rounded border">{test.error}</p>
                    </div>
                  )}

                  {/* Quick Actions based on test type */}
                  <div className="flex flex-wrap gap-3">
                    {key === "environment" && test.status === "error" && (
                      <Button size="sm" variant="outline" asChild className="bg-blue-50 hover:bg-blue-100">
                        <a href="/setup-environment">
                          <Settings className="w-4 h-4 mr-2" />
                          Setup Environment
                        </a>
                      </Button>
                    )}

                    {key === "database" && test.status === "error" && (
                      <Button size="sm" variant="outline" asChild className="bg-green-50 hover:bg-green-100">
                        <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Neon Console
                        </a>
                      </Button>
                    )}

                    {key === "email" && test.status === "error" && (
                      <>
                        <Button size="sm" variant="outline" asChild className="bg-purple-50 hover:bg-purple-100">
                          <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Resend API Keys
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="bg-purple-50 hover:bg-purple-100">
                          <a href="/test-email-system">
                            <Mail className="w-4 h-4 mr-2" />
                            Test Email System
                          </a>
                        </Button>
                      </>
                    )}

                    {key === "domain" && test.status === "error" && (
                      <>
                        <Button size="sm" variant="outline" asChild className="bg-orange-50 hover:bg-orange-100">
                          <a href="/dns-settings">
                            <Globe className="w-4 h-4 mr-2" />
                            DNS Settings
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="bg-orange-50 hover:bg-orange-100">
                          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Vercel Dashboard
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Summary Grid */}
        {allTestsComplete && (
          <Card className="mt-8 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <CardTitle className="text-xl">Test Summary</CardTitle>
              <CardDescription>Overview of all connection tests and their results</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(tests).map(([key, test]) => (
                  <div key={key} className="text-center p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-center mb-3">{getStatusIcon(test.status)}</div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">{test.name}</p>
                    <p className="text-xs text-gray-500">
                      {test.duration ? `Completed in ${test.duration}ms` : "Not executed"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-xl">Troubleshooting Guide</CardTitle>
            <CardDescription>Common solutions and next steps based on test results</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Environment Variables Failed
                  </h3>
                  <ul className="text-sm space-y-1 text-red-800">
                    <li>• Visit the Setup Environment page</li>
                    <li>• Add missing variables to Vercel dashboard</li>
                    <li>• Redeploy your application</li>
                    <li>• Re-run tests to verify fixes</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Connection Issues
                  </h3>
                  <ul className="text-sm space-y-1 text-yellow-800">
                    <li>• Check your DATABASE_URL format</li>
                    <li>• Verify Neon database is active</li>
                    <li>• Ensure SSL parameters are correct</li>
                    <li>• Test connection in Neon console</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Service Problems
                  </h3>
                  <ul className="text-sm space-y-1 text-purple-800">
                    <li>• Verify your Resend API key is valid</li>
                    <li>• Check FROM_EMAIL configuration</li>
                    <li>• Ensure domain is verified in Resend</li>
                    <li>• Test email templates separately</li>
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domain & SSL Issues
                  </h3>
                  <ul className="text-sm space-y-1 text-orange-800">
                    <li>• Check DNS configuration settings</li>
                    <li>• Verify SSL certificate is valid</li>
                    <li>• Review Vercel domain settings</li>
                    <li>• Test domain accessibility manually</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        <Card className="mt-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Direct links to fix common issues and configure your application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild className="h-auto p-6 bg-blue-50 hover:bg-blue-100 border-blue-200">
                <a href="/setup-environment">
                  <div className="text-center">
                    <Settings className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <p className="font-semibold text-blue-900">Setup Environment</p>
                    <p className="text-xs text-blue-700 mt-1">Configure missing variables</p>
                  </div>
                </a>
              </Button>

              <Button variant="outline" asChild className="h-auto p-6 bg-green-50 hover:bg-green-100 border-green-200">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <div className="text-center">
                    <ExternalLink className="w-8 h-8 mx-auto mb-3 text-green-600" />
                    <p className="font-semibold text-green-900">Vercel Dashboard</p>
                    <p className="text-xs text-green-700 mt-1">Manage deployment settings</p>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                asChild
                className="h-auto p-6 bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                <a href="/dns-settings">
                  <div className="text-center">
                    <Globe className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                    <p className="font-semibold text-purple-900">DNS Settings</p>
                    <p className="text-xs text-purple-700 mt-1">Configure domain settings</p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
