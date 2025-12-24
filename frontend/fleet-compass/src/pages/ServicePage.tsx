import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Truck,
  DollarSign,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockServiceRecords, mockVehicles, getVehicleById, ServiceRecord } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ServicePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [records, setRecords] = useState<ServiceRecord[]>(mockServiceRecords);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const filteredRecords = records.filter((record) => {
    const vehicle = getVehicleById(record.vehicleId);
    const matchesSearch = 
      record.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingServices = records.filter(r => r.status === 'pending' || r.status === 'overdue');
  const overdueServices = records.filter(r => r.status === 'overdue');
  const completedServices = records.filter(r => r.status === 'completed');

  const getStatusColor = (status: ServiceRecord['status']) => {
    switch (status) {
      case 'completed': return 'status-online';
      case 'pending': return 'status-maintenance';
      case 'overdue': return 'status-alert';
    }
  };

  const getTypeIcon = (type: ServiceRecord['type']) => {
    switch (type) {
      case 'oil-change': return '🛢️';
      case 'tire-rotation': return '🔄';
      case 'brake-service': return '🛑';
      case 'engine-check': return '⚙️';
      case 'full-service': return '🔧';
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedVehicle) {
      toast({
        title: 'Select a vehicle',
        description: 'Please select a vehicle to update',
        variant: 'destructive',
      });
      return;
    }

    const updatedRecords = records.map(record => 
      record.vehicleId === selectedVehicle && record.status !== 'completed'
        ? { ...record, status: 'completed' as const, notes: updateNotes || record.notes }
        : record
    );

    setRecords(updatedRecords);
    setIsUpdateDialogOpen(false);
    setSelectedVehicle('');
    setUpdateNotes('');

    toast({
      title: 'Service updated',
      description: 'Vehicle service status has been updated',
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Service & Maintenance' : 'Vehicle Status'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Track and manage fleet maintenance' : 'View vehicle service history'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Service
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border">
              <DialogHeader>
                <DialogTitle>Update Vehicle Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Notes</Label>
                  <Textarea
                    placeholder="Enter service notes..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    className="bg-secondary border-border min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleUpdateStatus}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Mark as Completed
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{pendingServices.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueServices.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{completedServices.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle ID, plate, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <Wrench className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="oil-change">Oil Change</SelectItem>
            <SelectItem value="tire-rotation">Tire Rotation</SelectItem>
            <SelectItem value="brake-service">Brake Service</SelectItem>
            <SelectItem value="engine-check">Engine Check</SelectItem>
            <SelectItem value="full-service">Full Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <Card className="lg:col-span-2 glass border-border">
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No service records found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const vehicle = getVehicleById(record.vehicleId);

            return (
              <Card key={record.id} className="glass border-border hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getTypeIcon(record.type)}</div>
                      <div>
                        <h3 className="font-semibold capitalize">{record.type.replace('-', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">{record.id}</p>
                      </div>
                    </div>
                    <Badge className={cn('capitalize', getStatusColor(record.status))}>
                      {record.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {vehicle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>{vehicle.plateNumber} - {vehicle.model}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Service Date: {new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Next Due: {new Date(record.nextDueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-success" />
                      <span>${record.cost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{record.notes}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Vehicles Needing Service */}
      {isAdmin && overdueServices.length > 0 && (
        <Card className="glass border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Vehicles Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueServices.map((record) => {
                const vehicle = getVehicleById(record.vehicleId);
                return (
                  <div key={record.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-destructive" />
                      <span className="font-medium">{vehicle?.plateNumber}</span>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">{record.type.replace('-', ' ')}</p>
                    <p className="text-xs text-destructive mt-1">Due: {new Date(record.nextDueDate).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServicePage;
