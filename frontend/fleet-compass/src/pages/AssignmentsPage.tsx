import React, { useState, useRef, useEffect } from 'react';
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
  Navigation
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
  DialogFooter,
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
import { mockSchedules, mockVehicles, mockDrivers, getDriverById, getVehicleById, Schedule } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';

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
      // Using Nominatim for geocoding
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
          <Search className="w-4 h-4" />
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
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  // Form state - Default location: Chennai, India
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

  // Get only active vehicles and drivers
  const activeVehicles = mockVehicles.filter(v => v.status === 'active');
  const activeDrivers = mockDrivers.filter(d => d.status === 'active');

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = 
      schedule.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.startLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.endLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    
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
    setIsEditMode(false);
  };

  const handleCreateSchedule = () => {
    if (!formData.vehicleId || !formData.driverId || !formData.assignmentName) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const schedule: Schedule = {
      id: `SCH${String(schedules.length + 1).padStart(3, '0')}`,
      vehicleId: formData.vehicleId,
      driverId: formData.driverId,
      route: formData.assignmentName,
      startLocation: formData.startAddress,
      endLocation: formData.endAddress,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: 'scheduled',
    };

    setSchedules([schedule, ...schedules]);
    setIsCreateDialogOpen(false);
    resetForm();

    toast({
      title: 'Assignment created',
      description: `New assignment "${schedule.route}" has been created`,
    });
  };

  const handleUpdateSchedule = () => {
    if (!selectedSchedule) return;

    const updatedSchedules = schedules.map(s => 
      s.id === selectedSchedule.id 
        ? { ...s, ...formData }
        : s
    );

    setSchedules(updatedSchedules);
    setIsDetailDialogOpen(false);
    setIsEditMode(false);
    resetForm();

    toast({
      title: 'Assignment updated',
      description: 'Assignment has been successfully updated',
    });
  };

  const handleDeleteSchedule = () => {
    if (!selectedSchedule) return;

    setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
    setIsDetailDialogOpen(false);
    setSelectedSchedule(null);

    toast({
      title: 'Assignment deleted',
      description: 'Assignment has been removed',
      variant: 'destructive',
    });
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      vehicleId: schedule.vehicleId,
      driverId: schedule.driverId,
      assignmentName: schedule.route,
      startAddress: schedule.startLocation,
      startLatitude: 13.0827,
      startLongitude: 80.2707,
      endAddress: schedule.endLocation,
      endLatitude: 13.0878,
      endLongitude: 80.2785,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    setIsEditMode(false);
    setIsDetailDialogOpen(true);
  };

  const getStatusIcon = (status: Schedule['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress': return <Play className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'in-progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'scheduled': return 'bg-warning/20 text-warning border-warning/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
    }
  };

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
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              {vehicle.plateNumber} - {vehicle.model}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {driver.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Create Assignment
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
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
          { label: 'Scheduled', value: schedules.filter(s => s.status === 'scheduled').length, color: 'text-warning' },
          { label: 'In Progress', value: schedules.filter(s => s.status === 'in-progress').length, color: 'text-primary' },
          { label: 'Completed', value: schedules.filter(s => s.status === 'completed').length, color: 'text-success' },
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
              <p className="text-lg font-medium">No schedules found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedules.map((schedule) => {
            const vehicle = getVehicleById(schedule.vehicleId);
            const driver = getDriverById(schedule.driverId);

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
                          {schedule.route}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{schedule.startLocation}</span>
                          <span>→</span>
                          <span>{schedule.endLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {vehicle && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                          <Truck className="w-4 h-4 text-primary" />
                          <span className="text-sm">{vehicle.plateNumber}</span>
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
                          {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(schedule.startTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={cn('capitalize', getStatusColor(schedule.status))}>
                        {schedule.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail/Edit Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
          resetForm();
        }
      }}>
        <DialogContent className="glass-strong border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditMode ? 'Edit Assignment' : 'Assignment Details'}</span>
              {!isEditMode && isAdmin && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditMode(true);
                    }}
                    className="border-border"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this assignment?')) {
                        handleDeleteSchedule();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isEditMode ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Select
                    value={formData.driverId}
                    onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assignment Name</Label>
                <Input
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSchedule} className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          ) : (
            selectedSchedule && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Assignment Name</Label>
                    <p className="font-semibold">{selectedSchedule.route}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={cn('capitalize w-fit', getStatusColor(selectedSchedule.status))}>
                      {selectedSchedule.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="glass border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle</p>
                          <p className="font-semibold">
                            {getVehicleById(selectedSchedule.vehicleId)?.plateNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getVehicleById(selectedSchedule.vehicleId)?.model}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Driver</p>
                          <p className="font-semibold">
                            {getDriverById(selectedSchedule.driverId)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getDriverById(selectedSchedule.driverId)?.phone}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Location Details</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                        <Navigation className="w-5 h-5 text-success mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Start Location</p>
                          <p className="text-sm text-muted-foreground">{selectedSchedule.startLocation}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordinates: {formData.startLatitude.toFixed(6)}, {formData.startLongitude.toFixed(6)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                        <MapPin className="w-5 h-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">End Location</p>
                          <p className="text-sm text-muted-foreground">{selectedSchedule.endLocation}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordinates: {formData.endLatitude.toFixed(6)}, {formData.endLongitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Start Time</p>
                      </div>
                      <p className="font-semibold">
                        {new Date(selectedSchedule.startTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">End Time</p>
                      </div>
                      <p className="font-semibold">
                        {new Date(selectedSchedule.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">Assignment ID</p>
                      <p className="text-sm text-muted-foreground">{selectedSchedule.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentsPage;