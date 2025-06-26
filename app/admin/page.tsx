"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AdminModerationPanel } from "@/components/admin-moderation-panel"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Users, ChefHat, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingRecipes: number
  publishedRecipes: number
  totalRecipes: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingRecipes: 0,
    publishedRecipes: 0,
    totalRecipes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, moderate recipes, and monitor site activity</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{loading ? "..." : stats.activeUsers} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{loading ? "..." : stats.pendingRecipes}</div>
              <p className="text-xs text-muted-foreground">Recipes awaiting moderation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Recipes</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.publishedRecipes}</div>
              <p className="text-xs text-muted-foreground">Live on the website</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">All recipe submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Priority Alert */}
        {stats.pendingRecipes > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Action Required</h3>
                  <p className="text-yellow-700">
                    {stats.pendingRecipes} recipe{stats.pendingRecipes !== 1 ? "s" : ""} waiting for your review
                  </p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-auto">
                  {stats.pendingRecipes} pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Recipe Moderation
              {stats.pendingRecipes > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-1">
                  {stats.pendingRecipes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="space-y-6">
            <AdminModerationPanel />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-8 h-8 text-orange-500" />
                  <div>
                    <h3 className="font-semibold">Test Recipe Submission</h3>
                    <p className="text-sm text-muted-foreground">Submit a test recipe for moderation</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">User Analytics</h3>
                    <p className="text-sm text-muted-foreground">View user activity and engagement</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Site Health</h3>
                    <p className="text-sm text-muted-foreground">Monitor system status and performance</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
