import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Truck, 
  User, 
  Phone, 
  Mail, 
  Star,
  Calendar,
  Award,
  MapPin,
  Plus,
  Upload,
  Filter,
  Lock,
  Car
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
type DriverStatus = 'active' | 'on-trip' | 'off-duty' | 'on-leave';
type VehicleType = 'bus' | 'truck' | 'cab' | 'car';
type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'out-of-service';
type UserRole = 'admin' | 'driver' | 'manager' | 'user';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: DriverStatus;
  totalTrips: number;
  rating: number;
  joinedDate: string;
  assignedVehicle?: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  name: string;
  type: VehicleType;
  capacity: number;
  status: VehicleStatus;
  lastServiceDate: string;
  nextServiceDate: string;
  assignedDriver?: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: UserRole;
  photo?: string;
  createdDate: string;
}

// Mock data (replace with API calls later)
const mockDrivers: Driver[] = [
  {
    id: 'DRV001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 234 567 8900',
    licenseNumber: 'DL-123456',
    status: 'active',
    totalTrips: 245,
    rating: 4.8,
    joinedDate: '2023-01-15',
    assignedVehicle: 'VEH001'
  },
  {
    id: 'DRV002',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 234 567 8901',
    licenseNumber: 'DL-789012',
    status: 'on-trip',
    totalTrips: 312,
    rating: 4.9,
    joinedDate: '2022-11-20'
  }
];

const mockVehicles: Vehicle[] = [
  {
    id: 'VEH001',
    name: 'Fleet Bus 01',
    plateNumber: 'ABC-1234',
    model: 'Mercedes-Benz Sprinter',
    type: 'bus',
    capacity: 50,
    status: 'active',
    lastServiceDate: '2024-11-15',
    nextServiceDate: '2025-02-15',
    assignedDriver: 'DRV001'
  },
  {
    id: 'VEH002',
    name: 'Cargo Truck 02',
    plateNumber: 'XYZ-5678',
    model: 'Ford Transit',
    type: 'truck',
    capacity: 2000,
    status: 'maintenance',
    lastServiceDate: '2024-12-01',
    nextServiceDate: '2025-03-01'
  },
  {
    id: 'VEH003',
    name: 'City Car 03',
    plateNumber: 'DEF-9012',
    model: 'Toyota Camry',
    type: 'car',
    capacity: 5,
    status: 'active',
    lastServiceDate: '2024-12-10',
    nextServiceDate: '2025-03-10'
  }
];

const mockUsers: SystemUser[] = [
  {
    id: 'USR001',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+1 234 567 8900',
    username: 'admin',
    role: 'admin',
    createdDate: '2023-01-01'
  },
  {
    id: 'USR002',
    name: 'Manager Mike',
    email: 'mike@example.com',
    phone: '+1 234 567 8902',
    username: 'manager_mike',
    role: 'manager',
    createdDate: '2023-03-15'
  }
];

const ProfilesPage: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Real admin check from authenticated user
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');

  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<SystemUser | null>(null);
  const [editedDriver, setEditedDriver] = useState<Driver | null>(null);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  // View detail dialogs
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'user' as UserRole,
    photo: null as File | null
  });

  // Driver & Vehicle forms (unchanged)
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver' as UserRole,
    username: '',
    password: '',
    photo: null as File | null
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: '',
    registrationNumber: '',
    type: 'bus' as VehicleType,
    capacity: 0,
    lastServiceDate: '',
    nextServiceDate: '',
    status: 'active' as VehicleStatus
  });

  // Filtering logic (unchanged)
  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredDrivers = mockDrivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredVehicles = mockVehicles.filter((v) => {
    const matchesSearch = v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = vehicleTypeFilter === 'all' || v.type === vehicleTypeFilter;
    return matchesSearch && matchesType;
  });

  // Helper functions (unchanged)
  const getVehicleById = (id: string) => mockVehicles.find(v => v.id === id);
  const getDriverById = (id: string) => mockDrivers.find(d => d.id === id);

  const getDriverStatusColor = (status: DriverStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'on-trip': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'off-duty': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      case 'on-leave': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    }
  };

  const getVehicleStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'idle': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'out-of-service': return 'bg-red-500/20 text-red-700 border-red-500/30';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'driver': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'user': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getVehicleTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'truck': return '🚛';
      case 'cab': return '🚕';
      case 'car': return '🚗';
    }
  };

  // UPDATED: User creation with proper auth & toast
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }

    if (!userForm.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Password is required.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: userForm.name.trim() || "Default User",
      username: userForm.username.trim(),
      password: userForm.password,
      mailId: userForm.email.trim() || "-",
      phoneNumber: userForm.phone.trim() || "-",
      role: userForm.role.toUpperCase() // Sends "ADMIN", "DRIVER", etc.
    };

    const authToken = token || localStorage.getItem('jwtToken') || localStorage.getItem('token');

    if (!authToken) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to create a user.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/v1/profiles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const createdUser = await response.json();
        toast({
          title: "Success!",
          description: `User "${createdUser.username}" created successfully.`,
        });

        setIsUserDialogOpen(false);
        setUserForm({
          name: '',
          email: '',
          phone: '',
          username: '',
          password: '',
          role: 'user',
          photo: null
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Failed to create user",
          description: errorData.message || `Error: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("User creation error:", error);
      toast({
        title: "Network Error",
        description: "Unable to connect to server.",
        variant: "destructive",
      });
    }
  };

  // Other handlers (unchanged for now)
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Vehicle Added", description: "This is a placeholder." });
    setIsVehicleDialogOpen(false);
    setVehicleForm({
      vehicleName: '',
      registrationNumber: '',
      type: 'bus',
      capacity: 0,
      lastServiceDate: '',
      nextServiceDate: '',
      status: 'active'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserForm({ ...userForm, photo: e.target.files[0] });
    }
  };

  // Placeholder handlers
  const handleDeleteUser = (userId: string) => { console.log('Delete user:', userId); setSelectedUser(null); };
  const handleDeleteDriver = (driverId: string) => { console.log('Delete driver:', driverId); setSelectedDriver(null); };
  const handleDeleteVehicle = (vehicleId: string) => { console.log('Delete vehicle:', vehicleId); setSelectedVehicle(null); };
  const handleUpdateUser = () => { console.log('Update user:', editedUser); setEditMode(false); setSelectedUser(null); };
  const handleUpdateDriver = () => { console.log('Update driver:', editedDriver); setEditMode(false); setSelectedDriver(null); };
  const handleUpdateVehicle = () => { console.log('Update vehicle:', editedVehicle); setEditMode(false); setSelectedVehicle(null); };
  const handleDriverStatusUpdate = (newStatus: DriverStatus) => { if (selectedDriver) setSelectedDriver({ ...selectedDriver, status: newStatus }); };
  const handleVehicleStatusUpdate = (newStatus: VehicleStatus) => { if (selectedVehicle) setSelectedVehicle({ ...selectedVehicle, status: newStatus }); };

  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, drivers and vehicles
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            {activeTab === 'users' && (
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                          {userForm.photo ? (
                            <img 
                              src={URL.createObjectURL(userForm.photo)} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <label htmlFor="userPhoto" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload className="w-4 h-4 text-primary-foreground" />
                        </label>
                        <input
                          id="userPhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="userName">Full Name *</Label>
                      <Input
                        id="userName"
                        required
                        placeholder="John Doe"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role *</Label>
                      <Select
                        value={userForm.role}
                        onValueChange={(value: UserRole) => setUserForm({ ...userForm, role: value })}
                      >
                        <SelectTrigger id="userRole">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Phone and Email */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="userPhone"
                            type="tel"
                            required
                            placeholder="+1 234 567 8900"
                            className="pl-10"
                            value={userForm.phone}
                            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email ID *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="userEmail"
                            type="email"
                            required
                            placeholder="john@example.com"
                            className="pl-10"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Username and Password */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="username"
                            required
                            placeholder="johndoe"
                            className="pl-10"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="pl-10"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsUserDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Create User
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'vehicles' && (
              <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleVehicleSubmit} className="space-y-6">
                    {/* Vehicle Name and Registration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleName">Vehicle Name *</Label>
                        <Input
                          id="vehicleName"
                          required
                          placeholder="Fleet Bus 01"
                          value={vehicleForm.vehicleName}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number *</Label>
                        <Input
                          id="registrationNumber"
                          required
                          placeholder="ABC-1234"
                          value={vehicleForm.registrationNumber}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Type and Capacity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select
                          value={vehicleForm.type}
                          onValueChange={(value: VehicleType) => setVehicleForm({ ...vehicleForm, type: value })}
                        >
                          <SelectTrigger id="vehicleType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bus">🚌 Bus</SelectItem>
                            <SelectItem value="truck">🚛 Truck</SelectItem>
                            <SelectItem value="car">🚗 Car</SelectItem>
                            <SelectItem value="cab">🚕 Cab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity *</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          required
                          placeholder="50"
                          value={vehicleForm.capacity || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Service Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastServiceDate">Last Service Date *</Label>
                        <Input
                          id="lastServiceDate"
                          type="date"
                          required
                          value={vehicleForm.lastServiceDate}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, lastServiceDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextServiceDate">Next Service Date *</Label>
                        <Input
                          id="nextServiceDate"
                          type="date"
                          required
                          value={vehicleForm.nextServiceDate}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, nextServiceDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="vehicleStatus">Status *</Label>
                      <Select
                        value={vehicleForm.status}
                        onValueChange={(value: VehicleStatus) => setVehicleForm({ ...vehicleForm, status: value })}
                      >
                        <SelectTrigger id="vehicleStatus">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="idle">Idle</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="out-of-service">Out of Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsVehicleDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add Vehicle
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {activeTab === 'users' && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        )}

        {activeTab === 'drivers' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-trip">On Trip</SelectItem>
              <SelectItem value="off-duty">Off Duty</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        )}

        {activeTab === 'vehicles' && (
          <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="cab">Cab</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4 mr-2" />
            Vehicles
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <Card className="col-span-full glass border-border">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No users found</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-0">
                    {/* Header with gradient */}
                    <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent relative">
                      <Badge className={`absolute top-3 right-3 capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </div>
                    
                    {/* Avatar */}
                    <div className="px-4 -mt-10 relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-secondary border-4 border-card flex items-center justify-center">
                        {user.photo ? (
                          <img src={user.photo} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.id}</p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>@{user.username}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(user.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.length === 0 ? (
              <Card className="col-span-full glass border-border">
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No drivers found</p>
                </CardContent>
              </Card>
            ) : (
              filteredDrivers.map((driver) => {
                const assignedVehicle = driver.assignedVehicle ? getVehicleById(driver.assignedVehicle) : null;

                return (
                  <Card 
                    key={driver.id} 
                    className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <CardContent className="p-0">
                      {/* Header with gradient */}
                      <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent relative">
                        <Badge className={`absolute top-3 right-3 capitalize ${getDriverStatusColor(driver.status)}`}>
                          {driver.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      {/* Avatar */}
                      <div className="px-4 -mt-10 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-secondary border-4 border-card flex items-center justify-center">
                          <User className="w-10 h-10 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 pt-3">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {driver.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{driver.id}</p>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{driver.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{driver.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-muted-foreground" />
                            <span>{driver.licenseNumber}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="p-2 rounded-lg bg-secondary text-center">
                            <p className="text-lg font-bold text-primary">{driver.totalTrips}</p>
                            <p className="text-xs text-muted-foreground">Trips</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-warning fill-warning" />
                              <span className="text-lg font-bold">{driver.rating}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                          </div>
                        </div>

                        {/* Assigned Vehicle */}
                        {assignedVehicle && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-primary mb-1">Assigned Vehicle</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getVehicleTypeIcon(assignedVehicle.type)}</span>
                              <div>
                                <p className="font-medium text-sm">{assignedVehicle.plateNumber}</p>
                                <p className="text-xs text-muted-foreground">{assignedVehicle.model}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {new Date(driver.joinedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.length === 0 ? (
              <Card className="col-span-full glass border-border">
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No vehicles found</p>
                </CardContent>
              </Card>
            ) : (
              filteredVehicles.map((vehicle) => {
                const assignedDriver = vehicle.assignedDriver ? getDriverById(vehicle.assignedDriver) : null;

                return (
                  <Card 
                    key={vehicle.id} 
                    className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getVehicleTypeIcon(vehicle.type)}</div>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {vehicle.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
                          </div>
                        </div>
                        <Badge className={`capitalize ${getVehicleStatusColor(vehicle.status)}`}>
                          {vehicle.status.replace('-', ' ')}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{vehicle.model}</p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-secondary">
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">{vehicle.type}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary">
                          <p className="text-xs text-muted-foreground">Capacity</p>
                          <p className="font-medium">{vehicle.capacity}</p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Service</span>
                          <span>{new Date(vehicle.lastServiceDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Next Service</span>
                          <span className={
                            new Date(vehicle.nextServiceDate) < new Date() ? 'text-destructive' : ''
                          }>
                            {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Assigned Driver */}
                      {assignedDriver && (
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                          <p className="text-xs text-accent mb-1">Assigned Driver</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{assignedDriver.name}</p>
                              <p className="text-xs text-muted-foreground">{assignedDriver.id}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
<Dialog open={!!selectedUser} onOpenChange={(open) => {
  if (!open) {
    setSelectedUser(null);
    setEditMode(false);
    setEditedUser(null);
  }
}}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>User Details</DialogTitle>
    </DialogHeader>
    {selectedUser && (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            {selectedUser.photo ? (
              <img src={selectedUser.photo} alt={selectedUser.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            {editMode && editedUser ? (
              <Input
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <h3 className="text-xl font-bold">{selectedUser.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm text-muted-foreground">Role:</Label>
              {editMode && editedUser ? (
                <Select 
                  value={editedUser.role} 
                  onValueChange={(value: UserRole) => setEditedUser({ ...editedUser, role: value })}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">User ID</Label>
            <p className="font-medium">{selectedUser.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Username</Label>
            {editMode && editedUser ? (
              <Input
                value={editedUser.username}
                onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
              />
            ) : (
              <p className="font-medium">@{selectedUser.username}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            {editMode && editedUser ? (
              <Input
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedUser.email}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Phone</Label>
            {editMode && editedUser ? (
              <Input
                value={editedUser.phone}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedUser.phone}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Created Date</Label>
            <p className="font-medium">{new Date(selectedUser.createdDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="destructive"
            onClick={() => handleDeleteUser(selectedUser.id)}
          >
            Delete User
          </Button>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setEditedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setEditMode(true);
                setEditedUser({ ...selectedUser });
              }}>
                Edit User
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Driver Detail Dialog */}
<Dialog open={!!selectedDriver} onOpenChange={(open) => {
  if (!open) {
    setSelectedDriver(null);
    setEditMode(false);
    setEditedDriver(null);
  }
}}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Driver Details</DialogTitle>
    </DialogHeader>
    {selectedDriver && (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="flex-1">
            {editMode && editedDriver ? (
              <Input
                value={editedDriver.name}
                onChange={(e) => setEditedDriver({ ...editedDriver, name: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <Select 
                value={editMode && editedDriver ? editedDriver.status : selectedDriver.status} 
                onValueChange={(value: DriverStatus) => {
                  if (editMode && editedDriver) {
                    setEditedDriver({ ...editedDriver, status: value });
                  } else {
                    handleDriverStatusUpdate(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-trip">On Trip</SelectItem>
                  <SelectItem value="off-duty">Off Duty</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Driver ID</Label>
            <p className="font-medium">{selectedDriver.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">License Number</Label>
            {editMode && editedDriver ? (
              <Input
                value={editedDriver.licenseNumber}
                onChange={(e) => setEditedDriver({ ...editedDriver, licenseNumber: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedDriver.licenseNumber}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            {editMode && editedDriver ? (
              <Input
                type="email"
                value={editedDriver.email}
                onChange={(e) => setEditedDriver({ ...editedDriver, email: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedDriver.email}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Phone</Label>
            {editMode && editedDriver ? (
              <Input
                value={editedDriver.phone}
                onChange={(e) => setEditedDriver({ ...editedDriver, phone: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedDriver.phone}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Total Trips</Label>
            {editMode && editedDriver ? (
              <Input
                type="number"
                value={editedDriver.totalTrips}
                onChange={(e) => setEditedDriver({ ...editedDriver, totalTrips: parseInt(e.target.value) || 0 })}
              />
            ) : (
              <p className="font-medium">{selectedDriver.totalTrips}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Rating</Label>
            {editMode && editedDriver ? (
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={editedDriver.rating}
                onChange={(e) => setEditedDriver({ ...editedDriver, rating: parseFloat(e.target.value) || 0 })}
              />
            ) : (
              <p className="font-medium flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                {selectedDriver.rating}
              </p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Joined Date</Label>
            <p className="font-medium">{new Date(selectedDriver.joinedDate).toLocaleDateString()}</p>
          </div>
          {selectedDriver.assignedVehicle && (
            <div>
              <Label className="text-muted-foreground">Assigned Vehicle</Label>
              <p className="font-medium">{getVehicleById(selectedDriver.assignedVehicle)?.plateNumber}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="destructive"
            onClick={() => handleDeleteDriver(selectedDriver.id)}
          >
            Delete Driver
          </Button>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setEditedDriver(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateDriver}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setEditMode(true);
                setEditedDriver({ ...selectedDriver });
              }}>
                Edit Driver
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>


      {/* Vehicle Detail Dialog */}
<Dialog open={!!selectedVehicle} onOpenChange={(open) => {
  if (!open) {
    setSelectedVehicle(null);
    setEditMode(false);
    setEditedVehicle(null);
  }
}}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Vehicle Details</DialogTitle>
    </DialogHeader>
    {selectedVehicle && (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{getVehicleTypeIcon(editMode && editedVehicle ? editedVehicle.type : selectedVehicle.type)}</div>
          <div className="flex-1">
            {editMode && editedVehicle ? (
              <Input
                value={editedVehicle.name}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, name: e.target.value })}
                className="text-xl font-bold mb-2"
              />
            ) : (
              <h3 className="text-xl font-bold">{selectedVehicle.name}</h3>
            )}
            {editMode && editedVehicle ? (
              <Input
                value={editedVehicle.plateNumber}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, plateNumber: e.target.value })}
                className="text-sm mb-2"
              />
            ) : (
              <p className="text-muted-foreground">{selectedVehicle.plateNumber}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <Select 
                value={editMode && editedVehicle ? editedVehicle.status : selectedVehicle.status} 
                onValueChange={(value: VehicleStatus) => {
                  if (editMode && editedVehicle) {
                    setEditedVehicle({ ...editedVehicle, status: value });
                  } else {
                    handleVehicleStatusUpdate(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out-of-service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Vehicle ID</Label>
            <p className="font-medium">{selectedVehicle.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Model</Label>
            {editMode && editedVehicle ? (
              <Input
                value={editedVehicle.model}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, model: e.target.value })}
              />
            ) : (
              <p className="font-medium">{selectedVehicle.model}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Type</Label>
            {editMode && editedVehicle ? (
              <Select 
                value={editedVehicle.type} 
                onValueChange={(value: VehicleType) => setEditedVehicle({ ...editedVehicle, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">🚌 Bus</SelectItem>
                  <SelectItem value="truck">🚛 Truck</SelectItem>
                  <SelectItem value="car">🚗 Car</SelectItem>
                  <SelectItem value="cab">🚕 Cab</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium capitalize">{selectedVehicle.type}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Capacity</Label>
            {editMode && editedVehicle ? (
              <Input
                type="number"
                value={editedVehicle.capacity}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, capacity: parseInt(e.target.value) || 0 })}
              />
            ) : (
              <p className="font-medium">{selectedVehicle.capacity}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Last Service</Label>
            {editMode && editedVehicle ? (
              <Input
                type="date"
                value={editedVehicle.lastServiceDate}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, lastServiceDate: e.target.value })}
              />
            ) : (
              <p className="font-medium">{new Date(selectedVehicle.lastServiceDate).toLocaleDateString()}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground">Next Service</Label>
            {editMode && editedVehicle ? (
              <Input
                type="date"
                value={editedVehicle.nextServiceDate}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, nextServiceDate: e.target.value })}
              />
            ) : (
              <p className="font-medium">{new Date(selectedVehicle.nextServiceDate).toLocaleDateString()}</p>
            )}
          </div>
          {selectedVehicle.assignedDriver && (
            <div className="col-span-2">
              <Label className="text-muted-foreground">Assigned Driver</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{getDriverById(selectedVehicle.assignedDriver)?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.assignedDriver}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="destructive"
            onClick={() => handleDeleteVehicle(selectedVehicle.id)}
          >
            Delete Vehicle
          </Button>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setEditedVehicle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateVehicle}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setEditMode(true);
                setEditedVehicle({ ...selectedVehicle });
              }}>
                Edit Vehicle
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
};

export default ProfilesPage;