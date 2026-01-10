import React, { useState, useEffect } from 'react';
import { Users, Search, Truck, User, Phone, Mail,CircleDashed, Star, Calendar, Award, PlusCircle, Upload, Filter, Lock, Edit, Trash2 } from 'lucide-react';
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
import api from '@/api/api';

type DriverStatus = 'active' | 'ontrip' | 'inactive';
type VehicleType = 'bus' | 'truck' | 'cab' | 'car';
type VehicleStatus = 'active' |'inactive' |'service' | 'idle' | 'maintenance' | 'out-of-service';
type UserRole = 'admin' | 'driver' | 'user';
type VehicleLocationStatus = 'tracked' | 'untracked' ;

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
  photo?: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  name: string;
  type: VehicleType;
  capacity: number;
  status: VehicleStatus;
  vehicle_location_status: VehicleLocationStatus;
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

const ProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
   const isAdmin = user?.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');

  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isEditVehicleDialogOpen, setIsEditVehicleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', username: '', password: '', role: 'user' as UserRole, photo: null as File | null
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: '', registrationNumber: '', model: '', type: 'car' as VehicleType, 
    capacity: 0, lastServiceDate: '', nextServiceDate: '', status: 'active' as VehicleStatus
  });


  const fetchData = async (endpoint: string, setter: Function) => {
  try {
    setLoading(true);
    const res = await api.get(`/v1/profiles/${endpoint}`);
    const data = res.data;
    if (data.success) setter(data[endpoint]);
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
  } 
  finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') fetchData('users', setUsers);
      else if (activeTab === 'drivers') fetchData('drivers', setDrivers);
      else if (activeTab === 'vehicles') fetchData('vehicles', setVehicles);
    }
  }, [activeTab, isAdmin]);



  const handleUserSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!userForm.username.trim() || !userForm.password.trim()) {
    toast({
      title: 'Validation Error',
      description: 'Username and password are required.',
      variant: 'destructive',
    });
    return;
  }

  const formData = new FormData();
  formData.append('username', userForm.username.trim());
  formData.append('password', userForm.password);
  if (userForm.name) formData.append('name', userForm.name.trim());
  if (userForm.email) formData.append('mailId', userForm.email.trim());
  if (userForm.phone) formData.append('phoneNumber', userForm.phone.trim());
  formData.append('role', userForm.role.toUpperCase());
  if (userForm.photo) formData.append('photo', userForm.photo);

  try {
    const res = await api.post('/v1/profiles/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast({
      title: 'Success!',
      description: `User "${userForm.username}" created successfully.`,
    });

    setIsUserDialogOpen(false);
    
    const createdRole = userForm.role;
    
    setUserForm({
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'user',
      photo: null,
    });

    // Refresh the appropriate list based on created role
    if (createdRole === 'driver') {
      fetchData('drivers', setDrivers);
    } else {
      fetchData('users', setUsers);
    }
  } catch (err: any) {
    console.error('User creation error:', err);
    toast({
      title: 'Failed',
      description: err.response?.data?.message || 'Unable to create user',
      variant: 'destructive',
    });
  }
};

const handleVehicleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload = {
    vehicleName: vehicleForm.vehicleName.trim(),
    registrationNumber: vehicleForm.registrationNumber.trim(),
    model: vehicleForm.model.trim() || 'Unknown Model',
    type: vehicleForm.type.toUpperCase(),
    capacity: vehicleForm.capacity.toString(),
    lastServiceDate: vehicleForm.lastServiceDate,
    nextServiceDate: vehicleForm.nextServiceDate,
    status: vehicleForm.status.toUpperCase().replace('-', '_'),
  };

  try {
    const res = await api.post('/v1/profiles/vehicles/create', payload);

    toast({
      title: 'Success!',
      description: `Vehicle "${res.data.vehicleName}" created successfully.`,
    });

    setIsVehicleDialogOpen(false);
    setVehicleForm({
      vehicleName: '',
      registrationNumber: '',
      model: '',
      type: 'car',
      capacity: 0,
      lastServiceDate: '',
      nextServiceDate: '',
      status: 'active',
    });

    fetchData('vehicles', setVehicles);
  } catch (err: any) {
    toast({
      title: 'Failed',
      description: err.response?.data?.message || 'Unable to create vehicle',
      variant: 'destructive',
    });
  }
};
const handleUserUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingUser) return;

  const payload = {
    name: userForm.name.trim(),
    mailId: userForm.email.trim(),
    phoneNumber: userForm.phone.trim(),
    role: userForm.role.toUpperCase(),
  };

  try {
    await api.put(`/v1/profiles/users/${editingUser.id}`, payload);

    toast({ title: 'Success!', description: 'User updated successfully.' });

    setIsEditUserDialogOpen(false);
    setEditingUser(null);
    fetchData('users', setUsers);
  } catch (err: any) {
    toast({
      title: 'Failed',
      description: err.response?.data?.message || 'Unable to update user',
      variant: 'destructive',
    });
  }
};
const handleDriverUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingDriver) return;

  const payload = {
    name: userForm.name.trim(),
    mailId: userForm.email.trim(),
    phoneNumber: userForm.phone.trim(),
    status: editingDriver.status,
    role: 'DRIVER',
  };

  try {
    await api.put(`/v1/profiles/drivers/${editingDriver.id}`, payload);

    toast({ title: 'Success!', description: 'Driver updated successfully.' });

    setIsEditUserDialogOpen(false);
    setEditingDriver(null);
    fetchData('drivers', setDrivers);
  } catch (err: any) {
    toast({
      title: 'Failed',
      description: err.response?.data?.message || 'Unable to update driver',
      variant: 'destructive',
    });
  }
};
const handleVehicleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingVehicle) return;

  const payload = {
    vehicleName: vehicleForm.vehicleName.trim(),
    registrationNumber: vehicleForm.registrationNumber.trim(),
    model: vehicleForm.model.trim(),
    type: vehicleForm.type.toUpperCase(),
    capacity: vehicleForm.capacity.toString(),
    lastServiceDate: vehicleForm.lastServiceDate,
    nextServiceDate: vehicleForm.nextServiceDate,
    status: vehicleForm.status.toUpperCase().replace('-', '_'),
  };

  try {
    await api.put(`/v1/profiles/vehicles/${editingVehicle.id}`, payload);

    toast({ title: 'Success!', description: 'Vehicle updated successfully.' });

    setIsEditVehicleDialogOpen(false);
    setEditingVehicle(null);
    fetchData('vehicles', setVehicles);
  } catch (err: any) {
    toast({
      title: 'Update Failed',
      description: err.response?.data?.message || 'Unable to update vehicle',
      variant: 'destructive',
    });
  }
};
const handleDeleteUser = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  await api.delete(`/v1/profiles/users/${id}`);
  toast({ title: 'User deleted' });
  fetchData('users', setUsers);
};

const handleDeleteDriver = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  await api.delete(`/v1/profiles/drivers/${id}`);
  toast({ title: 'Driver deleted' });
  fetchData('drivers', setDrivers);
};

const handleDeleteVehicle = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  await api.delete(`/v1/profiles/vehicles/${id}`);
  toast({ title: 'Vehicle deleted' });
  fetchData('vehicles', setVehicles);
};

const handleEditUser = (user: SystemUser) => {
  setEditingUser(user);
  setEditingDriver(null);

  setUserForm({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',        
    username: user.username || '',
    password: '',
    role: user.role,
    photo: null,
  });

  setIsEditUserDialogOpen(true);
};
const handleEditDriver = (driver: Driver) => {
  setEditingDriver(driver);
  setEditingUser(null);

  setUserForm({
    name: driver.name || '',
    email: driver.email || '',
    phone: driver.phone || '',     
    username: '',
    password: '',
    role: 'driver',
    photo: null,
  });

  setIsEditUserDialogOpen(true);
};
const handleEditVehicle = (vehicle: Vehicle) => {
  setEditingVehicle(vehicle);

  setVehicleForm({
    vehicleName: vehicle.name || '',
    registrationNumber: vehicle.plateNumber || '',
    model: vehicle.model || '',
    type: vehicle.type,
    capacity: vehicle.capacity || 0,
    lastServiceDate: vehicle.lastServiceDate || '',
    nextServiceDate: vehicle.nextServiceDate || '',
    status: vehicle.status,
  });

  setIsEditVehicleDialogOpen(true);
};



  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = vehicleTypeFilter === 'all' || v.type === vehicleTypeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string, type: 'driver' | 'vehicle' | 'role') => {
    const colors = {
      driver: {
        'active': 'bg-green-500/20 text-green-700 border-green-500/30',
        'inactive': 'bg-red-500/20 text-red-700 border-red-500/30',
        'on-trip': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
        'off-duty': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
        'on-leave': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      },
      vehicle: {
        'active': 'bg-green-500/20 text-green-700 border-green-500/30',
        'inactive': 'bg-red-500/20 text-red-700 border-red-500/30',
        'tracked': 'bg-green-500/20 text-green-700 border-green-500/30',
        'untracked': 'bg-red-500/20 text-red-700 border-red-500/30',
        'idle': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
        'maintenance': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
        'out-of-service': 'bg-red-500/20 text-red-700 border-red-500/30'
      },
      role: {
        'admin': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
        'manager': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
        'driver': 'bg-green-500/20 text-green-700 border-green-500/30',
        'user': 'bg-gray-500/20 text-gray-700 border-gray-500/30'
      }
    };
    return colors[type][status] || '';
  };

  const getVehicleIcon = (type: VehicleType) => ({ bus: '🚌', truck: '🚛', cab: '🚕', car: '🚗' }[type]);
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CircleDashed className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium">Loading Profiles...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Profiles</h1>
          <p className="text-muted-foreground mt-1">Manage users, drivers and vehicles</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            {activeTab === 'users' && (
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><PlusCircle className="w-4 h-4" />Create User</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-6">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                          {userForm.photo ? (
                            <img src={URL.createObjectURL(userForm.photo)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <label htmlFor="userPhoto" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload className="w-4 h-4 text-primary-foreground" />
                        </label>
                        <input id="userPhoto" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setUserForm({ ...userForm, photo: e.target.files[0] })} className="hidden" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userName">Full Name *</Label>
                      <Input id="userName" required placeholder="John Doe" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role *</Label>
                      <Select value={userForm.role} onValueChange={(value: UserRole) => setUserForm({ ...userForm, role: value })}>
                        <SelectTrigger id="userRole"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="userPhone" type="tel" required placeholder="+1 234 567 8900" className="pl-10" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email ID *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="userEmail" type="email" required placeholder="john@example.com" className="pl-10" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="username" required placeholder="johndoe" className="pl-10" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="password" type="password" required placeholder="••••••••" className="pl-10" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Create User</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'vehicles' && (
              <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><PlusCircle className="w-4 h-4" />Add Vehicle</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Add New Vehicle</DialogTitle></DialogHeader>
                  <form onSubmit={handleVehicleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleName">Vehicle Name *</Label>
                        <Input id="vehicleName" required placeholder="Fleet Bus 01" value={vehicleForm.vehicleName} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number *</Label>
                        <Input id="registrationNumber" required placeholder="ABC-1234" value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select value={vehicleForm.type} onValueChange={(value: VehicleType) => setVehicleForm({ ...vehicleForm, type: value })}>
                          <SelectTrigger id="vehicleType"><SelectValue /></SelectTrigger>
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
                        <Input id="capacity" type="number" min="1" required placeholder="50" value={vehicleForm.capacity || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastServiceDate">Last Service Date *</Label>
                        <Input id="lastServiceDate" type="date" required value={vehicleForm.lastServiceDate} onChange={(e) => setVehicleForm({ ...vehicleForm, lastServiceDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextServiceDate">Next Service Date *</Label>
                        <Input id="nextServiceDate" type="date" required value={vehicleForm.nextServiceDate} onChange={(e) => setVehicleForm({ ...vehicleForm, nextServiceDate: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleStatus">Status *</Label>
                      <Select value={vehicleForm.status} onValueChange={(value: VehicleStatus) => setVehicleForm({ ...vehicleForm, status: value })}>
                        <SelectTrigger id="vehicleStatus"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="idle">Idle</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="out-of-service">Out of Service</SelectItem>
                        </SelectContent>
                      </Select>

                      
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Add Vehicle</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>Edit {editingDriver ? 'Driver' : 'User'}</DialogTitle></DialogHeader>
    <form onSubmit={editingDriver ? handleDriverUpdate : handleUserUpdate} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="editUserName">Full Name *</Label>
        <Input id="editUserName" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
      </div>

      {editingDriver ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="editDriverStatus">Driver Status *</Label>
            <Select 
              value={editingDriver.status} 
              onValueChange={(value: DriverStatus) => setEditingDriver({ ...editingDriver, status: value })}
            >
              <SelectTrigger id="editDriverStatus"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ONTRIP">On Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDriverRole">Change Role *</Label>
            <Select 
              value={userForm.role} 
              onValueChange={(value: UserRole) => setUserForm({ ...userForm, role: value })}
            >
              <SelectTrigger id="editDriverRole"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="editUserRole">Role *</Label>
          <Select value={userForm.role} onValueChange={(value: UserRole) => setUserForm({ ...userForm, role: value })}>
            <SelectTrigger id="editUserRole"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editUserPhone">Phone Number *</Label>
          <Input id="editUserPhone" type="tel" required value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editUserEmail">Email ID *</Label>
          <Input id="editUserEmail" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          setIsEditUserDialogOpen(false);
          setEditingUser(null);
          setEditingDriver(null);
        }}>Cancel</Button>
        <Button type="submit">Update</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>



      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditVehicleDialogOpen} onOpenChange={setIsEditVehicleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          <form onSubmit={handleVehicleUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Name *</Label>
                <Input required value={vehicleForm.vehicleName} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Registration Number *</Label>
                <Input required value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type *</Label>
                <Select value={vehicleForm.type} onValueChange={(value: VehicleType) => setVehicleForm({ ...vehicleForm, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">🚌 Bus</SelectItem>
                    <SelectItem value="truck">🚛 Truck</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="cab">🚕 Cab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity *</Label>
                <Input type="number" min="1" required value={vehicleForm.capacity || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Last Service Date *</Label>
                <Input type="date" required value={vehicleForm.lastServiceDate} onChange={(e) => setVehicleForm({ ...vehicleForm, lastServiceDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Next Service Date *</Label>
                <Input type="date" required value={vehicleForm.nextServiceDate} onChange={(e) => setVehicleForm({ ...vehicleForm, nextServiceDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={vehicleForm.status} onValueChange={(value: VehicleStatus) => setVehicleForm({ ...vehicleForm, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out-of-service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditVehicleDialogOpen(false);
                setEditingVehicle(null);
              }}>Cancel</Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
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
              <SelectItem value="driver">Driver</SelectItem>
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
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="ontrip">On Trip</SelectItem>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" />Users
          </TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />Drivers
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4 mr-2" />Vehicles
          </TabsTrigger>
        </TabsList>

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
                <Card key={user.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <CardContent className="p-0">
                    <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent relative">
                      <Badge className={`absolute top-3 right-3 capitalize ${getStatusColor(user.role, 'role')}`}>{user.role}</Badge>
                    </div>
                    
                    <div className="px-4 -mt-10 relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                        {user.photo ? (
                          <img src={`http://localhost:8080${user.photo}`} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{user.name}</h3>
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
                const assignedVehicle = driver.assignedVehicle ? vehicles.find(v => v.id === driver.assignedVehicle) : null;

                return (
                  <Card key={driver.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                    <CardContent className="p-0">
                      <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent relative">
                        <Badge className={`absolute top-3 right-3 capitalize ${getStatusColor(driver.status, 'driver')}`}>
                          {driver.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="px-4 -mt-10 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                          {driver.photo ? (
                            <img src={`http://localhost:8080${driver.photo}`} alt={driver.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-3">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{driver.name}</h3>
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

                        {assignedVehicle && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-primary mb-1">Assigned Vehicle</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getVehicleIcon(assignedVehicle.type)}</span>
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
                const assignedDriver = vehicle.assignedDriver ? drivers.find(d => d.id === vehicle.assignedDriver) : null;

                return (
                  <Card key={vehicle.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getVehicleIcon(vehicle.type)}</div>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">{vehicle.name}</h3>
                            <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 ">
                          <Badge className={`capitalize ${getStatusColor(vehicle.vehicle_location_status, 'vehicle')}`}>
                            {vehicle.vehicle_location_status.replace('-', ' ')}
                          </Badge>

                          <Badge className={`capitalize ${getStatusColor(vehicle.status, 'vehicle')}`}>
                            {vehicle.status.replace('-', ' ')}
                          </Badge>
                        </div>

                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{vehicle.model}</p>
                      {/* ---- */}

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

                      <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Service</span>
                          <span>{new Date(vehicle.lastServiceDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Next Service</span>
                      <span className={new Date(vehicle.nextServiceDate) < new Date() ? 'text-destructive' : ''}>
                        {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

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

  {/* User Detail Dialog with Edit/Delete */}
<Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>User Details</DialogTitle>
    </DialogHeader>
    {selectedUser && (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {selectedUser.photo ? (
              <img src={`http://localhost:8080${selectedUser.photo}`} alt={selectedUser.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{selectedUser.name}</h3>
            <Badge className={getStatusColor(selectedUser.role, 'role')}>{selectedUser.role}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">User ID</Label>
            <p className="font-medium">{selectedUser.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Username</Label>
            <p className="font-medium">@{selectedUser.username}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{selectedUser.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Phone</Label>
            <p className="font-medium">{selectedUser.phone}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Created Date</Label>
            <p className="font-medium">{new Date(selectedUser.createdDate).toLocaleDateString()}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between pt-3 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this user?')) {
                  handleDeleteUser(selectedUser.id);
                  setSelectedUser(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                handleEditUser(selectedUser);
                setSelectedUser(null);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>

{/* Driver Detail Dialog with Edit/Delete */}
<Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Driver Details</DialogTitle>
    </DialogHeader>
    {selectedDriver && (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {selectedDriver.photo ? (
              <img src={`http://localhost:8080${selectedDriver.photo}`} alt={selectedDriver.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
            <Badge className={getStatusColor(selectedDriver.status, 'driver')}>{selectedDriver.status}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Driver ID</Label>
            <p className="font-medium">{selectedDriver.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">License Number</Label>
            <p className="font-medium">{selectedDriver.licenseNumber}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{selectedDriver.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Phone</Label>
            <p className="font-medium">{selectedDriver.phone}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Total Trips</Label>
            <p className="font-medium">{selectedDriver.totalTrips}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Rating</Label>
            <p className="font-medium flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {selectedDriver.rating}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between pt-3 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this driver?')) {
                  handleDeleteDriver(selectedDriver.id);
                  setSelectedDriver(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                handleEditDriver(selectedDriver);
                setSelectedDriver(null);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Driver
            </Button>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>

{/* Vehicle Detail Dialog with Edit/Delete */}
<Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Vehicle Details</DialogTitle>
    </DialogHeader>
    {selectedVehicle && (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{getVehicleIcon(selectedVehicle.type)}</div>
          <div>
            <h3 className="text-xl font-bold">{selectedVehicle.name}</h3>
            <p className="text-muted-foreground">{selectedVehicle.plateNumber}</p>
            <Badge className={getStatusColor(selectedVehicle.status, 'vehicle')}>{selectedVehicle.status.replace('-', ' ')}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Vehicle ID</Label>
            <p className="font-medium">{selectedVehicle.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Model</Label>
            <p className="font-medium">{selectedVehicle.model}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Type</Label>
            <p className="font-medium capitalize">{selectedVehicle.type}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Capacity</Label>
            <p className="font-medium">{selectedVehicle.capacity}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Last Service</Label>
            <p className="font-medium">{new Date(selectedVehicle.lastServiceDate).toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Next Service</Label>
            <p className="font-medium">{new Date(selectedVehicle.nextServiceDate).toLocaleDateString()}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between pt-3 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this vehicle?')) {
                  handleDeleteVehicle(selectedVehicle.id);
                  setSelectedVehicle(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                handleEditVehicle(selectedVehicle);
                setSelectedVehicle(null);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Vehicle
            </Button>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>

</div>
  );
};

export default ProfilesPage;