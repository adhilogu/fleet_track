import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockSchedules, mockVehicles, mockDrivers, getDriverById, getVehicleById, Schedule } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    vehicleId: '',
    driverId: '',
    route: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
    endTime: '',
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = 
      schedule.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.startLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.endLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      case 'completed': return 'status-online';
      case 'in-progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'scheduled': return 'status-maintenance';
      case 'cancelled': return 'status-alert';
    }
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.vehicleId || !newSchedule.driverId || !newSchedule.route) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const schedule: Schedule = {
      id: `SCH${String(schedules.length + 1).padStart(3, '0')}`,
      ...newSchedule,
      status: 'scheduled',
    };

    setSchedules([schedule, ...schedules]);
    setIsDialogOpen(false);
    setNewSchedule({
      vehicleId: '',
      driverId: '',
      route: '',
      startLocation: '',
      endLocation: '',
      startTime: '',
      endTime: '',
    });

    toast({
      title: 'Schedule created',
      description: `New schedule "${schedule.route}" has been created`,
    });
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <Select
                      value={newSchedule.vehicleId}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, vehicleId: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockVehicles.filter(v => v.status !== 'maintenance').map((vehicle) => (
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
                      value={newSchedule.driverId}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, driverId: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDrivers.filter(d => d.status !== 'on-leave').map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Route Name</Label>
                  <Input
                    placeholder="e.g., Downtown Express Route A"
                    value={newSchedule.route}
                    onChange={(e) => setNewSchedule({ ...newSchedule, route: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Location</Label>
                    <Input
                      placeholder="Start point"
                      value={newSchedule.startLocation}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startLocation: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Location</Label>
                    <Input
                      placeholder="End point"
                      value={newSchedule.endLocation}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endLocation: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
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
              <Card key={schedule.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Status & Route */}
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

                    {/* Vehicle & Driver */}
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

                    {/* Time & Status */}
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
    </div>
  );
};

export default AssignmentsPage;
