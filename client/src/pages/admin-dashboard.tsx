import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useContext, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  LogOut,
  Trash2,
  UserX
} from "lucide-react";

interface AdminStats {
  totalCreators: number;
  activeCreators: number;
  paidCreators: number;
  platformRevenue: number;
  creators: any[];
  recentActivity: any[];
}

export default function AdminDashboard() {
  const authContext = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Redirect non-admin users
  useEffect(() => {
    if (authContext?.user && !authContext.user.isAdmin) {
      setLocation("/auth");
    }
  }, [authContext?.user, setLocation]);

  const handleLogout = () => {
    authContext?.logout();
    setLocation("/auth");
  };

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setLocation("/auth");
          throw new Error("Admin access required");
        }
      }
      return response.json() as Promise<AdminStats>;
    }
  });

  const { data: allCreators } = useQuery({
    queryKey: ['/api/admin/creators'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/creators");
      return response.json();
    }
  });

  // Fetch all users for user management
  const { data: allUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // User deletion mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `User deleted successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreatorStatusToggle = async (creatorId: number, isActive: boolean) => {
    try {
      await apiRequest("PUT", `/api/admin/creators/${creatorId}`, {
        isActive: !isActive
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Failed to update creator status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Platform management and analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {authContext?.user?.username} (Administrator)
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalCreators || 0}</div>
              <p className="text-xs text-muted-foreground">
                Platform registered creators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.activeCreators || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently active stores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.paidCreators || 0}</div>
              <p className="text-xs text-muted-foreground">
                Creators on paid plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${adminStats?.platformRevenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                Monthly recurring revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Creator Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Creator Management</CardTitle>
            <CardDescription>
              Manage creator accounts and monitor platform activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allCreators?.map((creator: any) => (
                <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {creator.storeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{creator.storeName}</h3>
                      <p className="text-sm text-gray-600">@{creator.storeHandle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={creator.planType === 'free' ? 'secondary' : 'default'}>
                          {creator.planType}
                        </Badge>
                        <Badge variant={creator.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {creator.subscriptionStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {creator.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreatorStatusToggle(creator.id, creator.isActive)}
                    >
                      {creator.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>
                Monthly revenue by subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Starter Plans ($14.99)</span>
                  <span className="text-sm text-gray-600">
                    ${(adminStats?.paidCreators || 0) * 14.99}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pro Plans ($29.99)</span>
                  <span className="text-sm text-gray-600">$0</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Total MRR</span>
                  <span>${adminStats?.platformRevenue || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Platform health and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Payment System</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Healthy
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">API Integration</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending Setup
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Management</CardTitle>
                <CardDescription>
                  Manage creator accounts and monitor platform activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allCreators?.map((creator: any) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {creator.storeName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{creator.storeName}</h3>
                          <p className="text-sm text-gray-600">@{creator.storeHandle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={creator.planType === 'free' ? 'secondary' : 'default'}>
                              {creator.planType}
                            </Badge>
                            <Badge variant={creator.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                              {creator.subscriptionStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {creator.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreatorStatusToggle(creator.id, creator.isActive)}
                        >
                          {creator.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage all platform users. Delete accounts when necessary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.isAdmin && (
                              <Badge variant="default" className="bg-red-100 text-red-800">
                                Admin
                              </Badge>
                            )}
                            {user.isCreator && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Creator
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {user.role || 'user'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isAdmin ? 'destructive' : 'secondary'}>
                          {user.isAdmin ? 'Administrator' : 'Regular User'}
                        </Badge>
                        
                        {!user.isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <UserX className="h-5 w-5 text-red-500" />
                                  Delete User Account
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete user <strong>{user.username}</strong>? This action will:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Permanently delete the user account</li>
                                    <li>Remove all associated creator data (if applicable)</li>
                                    <li>Delete all products and orders</li>
                                    <li>This action cannot be undone</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {user.isAdmin && (
                          <Badge variant="outline" className="text-gray-500">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!allUsers?.length && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}