import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Truck,
  User,
  CheckCircle2,
  AlertCircle,
  Play,
  X,
  Edit,
  Trash2,
  Navigation,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'http://localhost:8080/api';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location Picker Component
const LocationPicker: React.FC<{
  position: [number, number];
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  label: string;
}> = ({ position, onLocationSelect, label }) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
    });
    return null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMarkerPosition(newPos);
        onLocationSelect(parseFloat(lat), parseFloat(lon), display_name);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-secondary border-border"
        />
        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      <div className="h-64 rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={markerPosition}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={markerPosition} />
          <MapClickHandler />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Click on map to select location or search above
      </p>
    </div>
  );
};

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'ADMIN';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [editedSchedule, setEditedSchedule] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    assignmentName: '',
    startAddress: '',
    startLatitude: 13.0827,
    startLongitude: 80.2707,
    endAddress: '',
    endLatitude: 13.0878,
    endLongitude: 80.2785,
    startTime: '',
    endTime: '',
  });

  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<{ 
    id: number;
    name: string; 
    reg: string;
    model?: string;
  } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('jwt_token');
    console.log('🔑 Token status:', authToken ? 'Found' : 'Not found');
    
    if (authToken) {
      return {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      };
    }
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const config = getAuthHeaders();

      // Fetch assignments
      let assignmentsData = [];
      try {
        const assignmentsRes = await axios.get(`${API_BASE_URL}/assignments`, config);
        assignmentsData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
        console.log('✅ Assignments loaded:', assignmentsData.length);
      } catch (error: any) {
        console.error('❌ Error fetching assignments:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to view assignments',
            variant: 'destructive',
          });
        }
      }

      // Fetch vehicles with proper data extraction
      let vehiclesData = [];
      try {
        const vehiclesRes = await axios.get(`${API_BASE_URL}/v1/profiles/vehicles`, config);
        console.log('🚗 Raw vehicles response:', vehiclesRes.data);
        
        // Handle different API response formats
        let rawVehicles = [];
        if (vehiclesRes.data.success && Array.isArray(vehiclesRes.data.vehicles)) {
          rawVehicles = vehiclesRes.data.vehicles;
        } else if (Array.isArray(vehiclesRes.data)) {
          rawVehicles = vehiclesRes.data;
        }
        
        // Normalize vehicle data
        vehiclesData = rawVehicles.map((vehicle: any) => ({
          id: vehicle.id,
          vehicleName: vehicle.vehicleName || vehicle.name || 'Unknown Vehicle',
          registrationNumber: vehicle.registrationNumber || vehicle.reg || vehicle.registration || 'N/A',
          model: vehicle.model || 'N/A',
          type: vehicle.type || 'UNKNOWN',
          capacity: vehicle.capacity || 0,
          status: vehicle.status || 'INACTIVE',
          fuelLevel: vehicle.fuelLevel || 0,
          mileage: vehicle.mileage || 0,
          currentLocation: vehicle.currentLocation || 'Unknown',
          lastServiceDate: vehicle.lastServiceDate,
          nextServiceDate: vehicle.nextServiceDate,
        }));
        
        console.log('✅ Processed vehicles:', vehiclesData.length);
        console.log('📊 Vehicle details:', vehiclesData.map(v => ({
          id: v.id,
          name: v.vehicleName,
          reg: v.registrationNumber
        })));
        
      } catch (error: any) {
        console.error('❌ Error fetching vehicles:', error);
      }

      // Fetch drivers with proper data extraction
      let driversData = [];
      try {
        const driversRes = await axios.get(`${API_BASE_URL}/v1/profiles/drivers`, config);
        console.log('👤 Raw drivers response:', driversRes.data);
        
        // Handle different API response formats
        let rawDrivers = [];
        if (driversRes.data.success && Array.isArray(driversRes.data.drivers)) {
          rawDrivers = driversRes.data.drivers;
        } else if (Array.isArray(driversRes.data)) {
          rawDrivers = driversRes.data;
        }
        
        // Normalize driver data
        driversData = rawDrivers.map((driver: any) => ({
          id: driver.id,
          name: driver.name || driver.username || 'Unknown Driver',
          phoneNumber: driver.phoneNumber || driver.phone || 'N/A',
          mailId: driver.mailId || driver.email || 'N/A',
          role: driver.role || 'DRIVER',
          status: driver.status || 'INACTIVE',
          totalTrips: driver.totalTrips || 0,
          ratings: driver.ratings || 0,
          profilePhoto: driver.profilePhoto,
        }));
        
        console.log('✅ Processed drivers:', driversData.length);
        console.log('📊 Driver details:', driversData.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phoneNumber
        })));
        
      } catch (error: any) {
        console.error('❌ Error fetching drivers:', error);
        
        // Fallback to users endpoint
        try {
          const usersRes = await axios.get(`${API_BASE_URL}/v1/profiles/users`, config);
          console.log('👥 Raw users response:', usersRes.data);
          
          let rawUsers = [];
          if (usersRes.data.success && Array.isArray(usersRes.data.users)) {
            rawUsers = usersRes.data.users;
          } else if (Array.isArray(usersRes.data)) {
            rawUsers = usersRes.data;
          }
          
          // Filter and normalize driver users
          driversData = rawUsers
            .filter((u: any) => u.role === 'DRIVER')
            .map((driver: any) => ({
              id: driver.id,
              name: driver.name || driver.username || 'Unknown Driver',
              phoneNumber: driver.phoneNumber || driver.phone || 'N/A',
              mailId: driver.mailId || driver.email || 'N/A',
              role: driver.role || 'DRIVER',
              status: driver.status || 'INACTIVE',
              totalTrips: driver.totalTrips || 0,
              ratings: driver.ratings || 0,
              profilePhoto: driver.profilePhoto,
            }));
          
          console.log('✅ Drivers from users (filtered):', driversData.length);
        } catch (fallbackError) {
          console.error('❌ Error fetching users from fallback:', fallbackError);
        }
      }

      setSchedules(assignmentsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);

      console.log('📦 Final data loaded:', {
        assignments: assignmentsData.length,
        vehicles: vehiclesData.length,
        drivers: driversData.length,
        activeVehicles: vehiclesData.filter((v: any) => v.status === 'ACTIVE').length,
        activeDrivers: driversData.filter((d: any) => d.status === 'ACTIVE').length,
      });

      if (driversData.length === 0) {
        toast({
          title: 'No Drivers Found',
          description: 'Please create active driver users in the Profiles section first.',
          variant: 'destructive',
        });
      }

      if (vehiclesData.length === 0) {
        toast({
          title: 'No Vehicles Found',
          description: 'Please create active vehicles in the Profiles section first.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter active vehicles and drivers
  const activeVehicles = vehicles.filter(v => {
    const status = typeof v.status === 'string' 
      ? v.status.toUpperCase().replace('-', '_')
      : v.status;
    return status === 'ACTIVE';
  });

  const activeDrivers = drivers.filter(d => {
    const status = typeof d.status === 'string'
      ? d.status.toUpperCase().replace('-', '_')
      : d.status;
    const role = typeof d.role === 'string'
      ? d.role.toUpperCase()
      : d.role;
    return status === 'ACTIVE' && role === 'DRIVER';
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = 
      schedule.assignmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.startLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.dropLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter.toUpperCase().replace('-', '_');
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      assignmentName: '',
      startAddress: '',
      startLatitude: 13.0827,
      startLongitude: 80.2707,
      endAddress: '',
      endLatitude: 13.0878,
      endLongitude: 80.2785,
      startTime: '',
      endTime: '',
    });
    setSelectedVehicleDetails(null);
  };

  const handleCreateSchedule = async () => {
    if (!formData.vehicleId || !formData.driverId || !formData.assignmentName) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const config = getAuthHeaders();
      console.log('🚀 Creating assignment with token:', config.headers?.Authorization ? 'Present' : 'Missing');
      
      const payload = {
        vehicle: { id: parseInt(formData.vehicleId) },
        driver: { id: parseInt(formData.driverId) },
        assignmentName: formData.assignmentName,
        startLatitude: formData.startLatitude,
        startLongitude: formData.startLongitude,
        endLatitude: formData.endLatitude,
        endLongitude: formData.endLongitude,
        startLocation: formData.startAddress,
        dropLocation: formData.endAddress,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'IN_PROGRESS'
      };

      console.log('📝 Payload:', payload);

      const response = await axios.post(`${API_BASE_URL}/assignments`, payload, config);
      console.log('✅ Assignment created:', response.data);
      
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchAllData();
    } catch (error: any) {
      console.error('❌ Error creating assignment:', error);
      console.error('Response:', error.response);
      
      const errorMsg = error.response?.status === 403 
        ? 'Authentication required. Please log in again.' 
        : error.response?.data?.message || 'Failed to create assignment';
        
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editedSchedule || !selectedSchedule) return;

    setSubmitting(true);
    try {
      const config = getAuthHeaders();
      const payload = {
        vehicle: { id: parseInt(editedSchedule.vehicleId) },
        driver: { id: parseInt(editedSchedule.driverId) },
        assignmentName: editedSchedule.assignmentName,
        startLatitude: editedSchedule.startLatitude,
        startLongitude: editedSchedule.startLongitude,
        endLatitude: editedSchedule.endLatitude,
        endLongitude: editedSchedule.endLongitude,
        startLocation: editedSchedule.startAddress,
        dropLocation: editedSchedule.endAddress,
        startTime: editedSchedule.startTime,
        endTime: editedSchedule.endTime,
      };

      await axios.put(`${API_BASE_URL}/assignments/${selectedSchedule.id}`, payload, config);

      toast({
        title: 'Success',
        description: 'Assignment updated successfully',
      });

      setIsDetailDialogOpen(false);
      setIsEditMode(false);
      setEditedSchedule(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      const errorMsg = error.response?.status === 403 
        ? 'Authentication required. Please log in again.' 
        : error.response?.data?.message || 'Failed to update assignment';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    setSubmitting(true);
    try {
      const config = getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/assignments/${selectedSchedule.id}`, config);

      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });

      setIsDetailDialogOpen(false);
      setSelectedSchedule(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      const errorMsg = error.response?.status === 403 
        ? 'Authentication required. Please log in again.' 
        : error.response?.data?.message || 'Failed to delete assignment';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsEditMode(false);
    setEditedSchedule(null);
    setIsDetailDialogOpen(true);
  };

  const getVehicleById = (id: number) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log(`🔍 Found vehicle ${id}:`, {
        name: vehicle.vehicleName,
        reg: vehicle.registrationNumber
      });
    } else {
      console.warn(`⚠️ Vehicle ${id} not found`);
    }
    return vehicle;
  };

  const getDriverById = (id: number) => {
    const driver = drivers.find(d => d.id === id);
    if (driver) {
      console.log(`🔍 Found driver ${id}:`, {
        name: driver.name,
        phone: driver.phoneNumber
      });
    } else {
      console.warn(`⚠️ Driver ${id} not found`);
    }
    return driver;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Play className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success/20 text-success border-success/30';
      case 'IN_PROGRESS': return 'bg-primary/20 text-primary border-primary/30';
      case 'CANCELLED': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.toLowerCase().replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Assignments & Schedules' : 'My Assignments'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage and monitor all fleet schedules' : 'View your assigned routes and schedules'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle (Active Only)</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select active vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span className="font-medium">ID: {vehicle.id}</span>
                            <span>•</span>
                            <span>{vehicle.vehicleName || 'N/A'}</span>
                            <span>•</span>
                            <span className="text-muted-foreground">{vehicle.registrationNumber}</span>
                          </div>
                        </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeVehicles.length === 0 && (
                      <p className="text-xs text-destructive">No active vehicles available</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Driver (Active Only)</Label>
                    <Select
                      value={formData.driverId}
                      onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select active driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">ID: {driver.id}</span>
                              <span>•</span>
                              <span>{driver.name}</span>
                              <span>•</span>
                              <span className="text-muted-foreground text-xs">{driver.phoneNumber}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeDrivers.length === 0 && (
                      <p className="text-xs text-destructive">No active drivers available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assignment Name *</Label>
                  <Input
                    placeholder="e.g., Downtown Express Route A"
                    value={formData.assignmentName}
                    onChange={(e) => setFormData({ ...formData, assignmentName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <Tabs defaultValue="start" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="start">Start Location</TabsTrigger>
                    <TabsTrigger value="end">End Location</TabsTrigger>
                  </TabsList>
                  <TabsContent value="start" className="space-y-4">
                    <LocationPicker
                      position={[formData.startLatitude, formData.startLongitude]}
                      onLocationSelect={(lat, lng, address) => 
                        setFormData({ 
                          ...formData, 
                          startLatitude: lat, 
                          startLongitude: lng,
                          startAddress: address 
                        })
                      }
                      label="Select Start Point"
                    />
                    <Input
                      placeholder="Start location address"
                      value={formData.startAddress}
                      onChange={(e) => setFormData({ ...formData, startAddress: e.target.value })}
                      className="bg-secondary border-border"
                    />
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {formData.startLatitude.toFixed(6)}, {formData.startLongitude.toFixed(6)}
                    </div>
                  </TabsContent>
                  <TabsContent value="end" className="space-y-4">
                    <LocationPicker
                      position={[formData.endLatitude, formData.endLongitude]}
                      onLocationSelect={(lat, lng, address) => 
                        setFormData({ 
                          ...formData, 
                          endLatitude: lat, 
                          endLongitude: lng,
                          endAddress: address 
                        })
                      }
                      label="Select End Point"
                    />
                    <Input
                      placeholder="End location address"
                      value={formData.endAddress}
                      onChange={(e) => setFormData({ ...formData, endAddress: e.target.value })}
                      className="bg-secondary border-border"
                    />
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {formData.endLatitude.toFixed(6)}, {formData.endLongitude.toFixed(6)}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreateSchedule}
                  disabled={submitting || activeVehicles.length === 0 || activeDrivers.length === 0}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Assignment'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search routes, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: schedules.length, color: 'text-foreground' },
          { label: 'In Progress', value: schedules.filter(s => s.status === 'IN_PROGRESS').length, color: 'text-primary' },
          { label: 'Completed', value: schedules.filter(s => s.status === 'COMPLETED').length, color: 'text-success' },
          { label: 'Cancelled', value: schedules.filter(s => s.status === 'CANCELLED').length, color: 'text-destructive' },
        ].map((stat) => (
          <Card key={stat.label} className="glass border-border">
            <CardContent className="p-4 text-center">
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <Card className="glass border-border">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No assignments found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedules.map((schedule) => {
            const vehicle = getVehicleById(schedule.vehicle?.id);
            const driver = getDriverById(schedule.driver?.id);

            return (
              <Card 
                key={schedule.id} 
                className="glass border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                onClick={() => handleViewSchedule(schedule)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        'p-3 rounded-xl border flex items-center justify-center',
                        getStatusColor(schedule.status)
                      )}>
                        {getStatusIcon(schedule.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {schedule.assignmentName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{schedule.startLocation}</span>
                          <span>→</span>
                          <span>{schedule.dropLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {vehicle && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                            <Truck className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{vehicle.id}</span>
                            <span className="text-xs">-</span>
                            <span className="text-sm">{vehicle.vehicleName || 'Unknown'}</span>
                            <span className="text-xs">-</span>
                            <span className="text-xs text-muted-foreground">{vehicle.registrationNumber}</span>
                          </div>
                        )}
                      {driver && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                          <User className="w-4 h-4 text-accent" />
                          <span className="text-sm">{driver.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.startTime ? new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.startTime ? new Date(schedule.startTime).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge className={cn('capitalize', getStatusColor(schedule.status))}>
                        {getStatusLabel(schedule.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
          setEditedSchedule(null);
        }
      }}>
        <DialogContent className="glass-strong border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-4 rounded-xl border flex items-center justify-center',
                  getStatusColor(selectedSchedule.status)
                )}>
                  {getStatusIcon(selectedSchedule.status)}
                </div>
                <div className="flex-1">
                  {isEditMode && editedSchedule ? (
                    <Input
                      value={editedSchedule.assignmentName}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, assignmentName: e.target.value })}
                      className="text-xl font-bold mb-2"
                      placeholder="Assignment name"
                    />
                  ) : (
                    <h3 className="text-xl font-bold">{selectedSchedule.assignmentName}</h3>
                  )}
                  <p className="text-sm text-muted-foreground">ID: {selectedSchedule.id}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-sm text-muted-foreground">Status:</Label>
                    <Badge className={cn('capitalize', getStatusColor(selectedSchedule.status))}>
                      {getStatusLabel(selectedSchedule.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  {isEditMode && editedSchedule ? (
                    <Select
                        value={editedSchedule.vehicleId?.toString()}
                        onValueChange={(value) => setEditedSchedule({ ...editedSchedule, vehicleId: value })}
                      >
                        <SelectTrigger className="mt-2 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{vehicle.id}</span>
                                <span>-</span>
                                <span>{vehicle.vehicleName || 'Unknown'}</span>
                                <span>-</span>
                                <span className="text-muted-foreground">{vehicle.registrationNumber}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  ) : (
                    <Card className="glass border-border mt-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Truck className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-semibold">
                                {getVehicleById(selectedSchedule.vehicle?.id)?.id} - {' '}
                                {getVehicleById(selectedSchedule.vehicle?.id)?.vehicleName || 'Unknown Vehicle'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getVehicleById(selectedSchedule.vehicle?.id)?.registrationNumber}
                                {' • '}
                                {getVehicleById(selectedSchedule.vehicle?.id)?.model}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Driver</Label>
                  {isEditMode && editedSchedule ? (
                    <Select
                      value={editedSchedule.driverId?.toString()}
                      onValueChange={(value) => setEditedSchedule({ ...editedSchedule, driverId: value })}
                    >
                      <SelectTrigger className="mt-2 bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Card className="glass border-border mt-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <User className="w-8 h-8 text-accent" />
                          <div>
                            <p className="font-semibold">
                              {getDriverById(selectedSchedule.driver?.id)?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getDriverById(selectedSchedule.driver?.id)?.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Location Details</Label>
                {isEditMode && editedSchedule ? (
                  <div className="mt-2">
                    <Tabs defaultValue="start" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="start">Start Location</TabsTrigger>
                        <TabsTrigger value="end">End Location</TabsTrigger>
                      </TabsList>
                      <TabsContent value="start" className="space-y-4">
                        <LocationPicker
                          position={[editedSchedule.startLatitude, editedSchedule.startLongitude]}
                          onLocationSelect={(lat, lng, address) => 
                            setEditedSchedule({ 
                              ...editedSchedule, 
                              startLatitude: lat, 
                              startLongitude: lng,
                              startAddress: address 
                            })
                          }
                          label="Select Start Point"
                        />
                        <Input
                          placeholder="Start location address"
                          value={editedSchedule.startAddress}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, startAddress: e.target.value })}
                          className="bg-secondary border-border"
                        />
                        <div className="text-xs text-muted-foreground">
                          Coordinates: {editedSchedule.startLatitude.toFixed(6)}, {editedSchedule.startLongitude.toFixed(6)}
                        </div>
                      </TabsContent>
                      <TabsContent value="end" className="space-y-4">
                        <LocationPicker
                          position={[editedSchedule.endLatitude, editedSchedule.endLongitude]}
                          onLocationSelect={(lat, lng, address) => 
                            setEditedSchedule({ 
                              ...editedSchedule, 
                              endLatitude: lat, 
                              endLongitude: lng,
                              endAddress: address 
                            })
                          }
                          label="Select End Point"
                        />
                        <Input
                          placeholder="End location address"
                          value={editedSchedule.endAddress}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, endAddress: e.target.value })}
                          className="bg-secondary border-border"
                        />
                        <div className="text-xs text-muted-foreground">
                          Coordinates: {editedSchedule.endLatitude.toFixed(6)}, {editedSchedule.endLongitude.toFixed(6)}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                      <Navigation className="w-5 h-5 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Start Location</p>
                        <p className="text-sm text-muted-foreground">{selectedSchedule.startLocation}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedSchedule.startLatitude?.toFixed(6)}, {selectedSchedule.startLongitude?.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                      <MapPin className="w-5 h-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">End Location</p>
                        <p className="text-sm text-muted-foreground">{selectedSchedule.dropLocation}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedSchedule.endLatitude?.toFixed(6)}, {selectedSchedule.endLongitude?.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Time</Label>
                  {isEditMode && editedSchedule ? (
                    <Input
                      type="datetime-local"
                      value={editedSchedule.startTime}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, startTime: e.target.value })}
                      className="mt-2 bg-secondary border-border"
                    />
                  ) : (
                    <div className="p-4 rounded-lg bg-secondary mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">
                        {selectedSchedule.startTime ? new Date(selectedSchedule.startTime).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">End Time</Label>
                  {isEditMode && editedSchedule ? (
                    <Input
                      type="datetime-local"
                      value={editedSchedule.endTime}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, endTime: e.target.value })}
                      className="mt-2 bg-secondary border-border"
                    />
                  ) : (
                    <div className="p-4 rounded-lg bg-secondary mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">
                        {selectedSchedule.endTime ? new Date(selectedSchedule.endTime).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  disabled={submitting}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this assignment?')) {
                      handleDeleteSchedule();
                    }
                  }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Assignment
                </Button>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditMode(false);
                          setEditedSchedule(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateSchedule} 
                        disabled={submitting}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => {
                      setIsEditMode(true);
                      setEditedSchedule({
                        vehicleId: selectedSchedule.vehicle?.id,
                        driverId: selectedSchedule.driver?.id,
                        assignmentName: selectedSchedule.assignmentName,
                        startAddress: selectedSchedule.startLocation,
                        startLatitude: selectedSchedule.startLatitude || 13.0827,
                        startLongitude: selectedSchedule.startLongitude || 80.2707,
                        endAddress: selectedSchedule.dropLocation,
                        endLatitude: selectedSchedule.endLatitude || 13.0878,
                        endLongitude: selectedSchedule.endLongitude || 80.2785,
                        startTime: selectedSchedule.startTime,
                        endTime: selectedSchedule.endTime,
                      });
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Assignment
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

export default AssignmentsPage;