import React, { useState, useEffect } from 'react';
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
  PlusCircle
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/api';


interface ServiceResponse {
  id: number;
  serviceName: string;
  vehicle: {
    id: number;
    registrationNumber: string;
    vehicleName: string;
  };
  serviceDate: string;
  nextServiceDate: string;
  notes: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'OVERDUE';
}

interface Vehicle {
  id: number;
  vehicleName: string;
  registrationNumber: string;
  type: string;
  status: string;
}

const ServicePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [records, setRecords] = useState<ServiceResponse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceResponse | null>(null);
  const [formData, setFormData] = useState<any>({
    vehicleId: '',
    serviceName: '',
    serviceDate: '',
    nextServiceDate: '',
    notes: '',
    amount: 0,
    status: 'PENDING',
  });
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<{ name: string; reg: string } | null>(null);


  // Fetch vehicles from API
  const fetchVehicles = async () => {
  try {
    const res = await api.get('/vehicles'); 
    // OR: '/v1/profiles/vehicles' 

    const data = res.data;
    setVehicles(Array.isArray(data) ? data : data.vehicles || []);
  } catch (err) {
    console.error('❌ Vehicle fetch error:', err);
    toast({
      title: 'Error',
      description: 'Failed to load vehicles',
      variant: 'destructive',
    });
  }
};


  // Fetch services from API
  const fetchServices = async () => {
  try {
    setLoading(true);

    const res = await api.get('/services');
    const data = res.data;

    setRecords(Array.isArray(data) ? data : data.services || []);
  } catch (err: any) {
    console.error('❌ Service fetch error:', err);

    toast({
      title: 'Connection Error',
      description:
        err.response?.data?.message ||
        'Failed to fetch services',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};


  // Create service API call
  const createServiceAPI = async (serviceData: any) => {
  const payload = {
    vehicle: { id: serviceData.vehicleId },
    serviceName: serviceData.serviceName,
    serviceDate: serviceData.serviceDate,
    nextServiceDate: serviceData.nextServiceDate,
    notes: serviceData.notes || '',
    amount: serviceData.amount,
    status: serviceData.status,
  };

  const res = await api.post('/services', payload);
  return res.data;
};

  
  // Update service API call
  const updateServiceAPI = async (id: number, serviceData: any) => {
  const payload = {
    vehicle: { id: serviceData.vehicleId },
    serviceName: serviceData.serviceName,
    serviceDate: serviceData.serviceDate,
    nextServiceDate: serviceData.nextServiceDate,
    notes: serviceData.notes,
    amount: serviceData.amount,
    status: serviceData.status,
  };

  const res = await api.put(`/services/${id}`, payload);
  return res.data;
};


  useEffect(() => {
    fetchVehicles();
    fetchServices();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch = 
      record.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || record.serviceName.toLowerCase().includes(typeFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingServices = records.filter(r => r.status === 'PENDING' || r.status === 'OVERDUE');
  const overdueServices = records.filter(r => r.status === 'OVERDUE');
  const completedServices = records.filter(r => r.status === 'COMPLETED');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-online';
      case 'pending': return 'status-maintenance';
      case 'overdue': return 'status-alert';
      default: return 'status-maintenance';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (name === 'vehicleId') {
      const vehicle = vehicles.find(v => v.id.toString() === value);
      if (vehicle) {
        setSelectedVehicleDetails({ 
          name: vehicle.vehicleName, 
          reg: vehicle.registrationNumber 
        });
      } else {
        setSelectedVehicleDetails(null);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      serviceName: '',
      serviceDate: '',
      nextServiceDate: '',
      notes: '',
      amount: 0,
      status: 'PENDING',
    });
    setSelectedVehicleDetails(null);
  };

  const handleAddService = async () => {
    if (!formData.vehicleId || !formData.serviceName || !formData.serviceDate) {
      toast({
        title: 'Required fields',
        description: 'Please fill vehicle, service name and service date',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newService = {
        vehicleId: Number(formData.vehicleId),
        serviceName: formData.serviceName,
        serviceDate: formData.serviceDate,
        nextServiceDate: formData.nextServiceDate || formData.serviceDate,
        notes: formData.notes || '',
        amount: Number(formData.amount) || 0,
        status: formData.status,
      };

      await createServiceAPI(newService);
      await fetchServices();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'New service record has been created',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create service',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateService = async () => {
    if (!selectedRecord) return;

    try {
      const updatedService = {
        vehicleId: Number(formData.vehicleId),
        serviceName: formData.serviceName,
        serviceDate: formData.serviceDate,
        nextServiceDate: formData.nextServiceDate,
        notes: formData.notes,
        amount: Number(formData.amount),
        status: formData.status,
      };

      await updateServiceAPI(selectedRecord.id, updatedService);
      await fetchServices();
      setIsUpdateDialogOpen(false);
      setSelectedRecord(null);
      resetForm();
      toast({
        title: 'Service updated',
        description: 'Service record has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (record: ServiceResponse) => {
    setSelectedVehicleDetails({ 
      name: record.vehicle.vehicleName, 
      reg: record.vehicle.registrationNumber 
    });
    setFormData({
      vehicleId: record.vehicle.id.toString(),
      serviceName: record.serviceName,
      serviceDate: record.serviceDate,
      nextServiceDate: record.nextServiceDate,
      notes: record.notes,
      amount: record.amount,
      status: record.status,
    });
    setSelectedRecord(record);
    setIsUpdateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wrench className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium">Loading services...</p>
        </div>
      </div>
    );
  }

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
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Service Details
          </Button>
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
            placeholder="Search by vehicle, plate, or notes..."
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
      </div>

      {/* Overdue Services Alert */}
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
              {overdueServices.map((record) => (
                <div key={record.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-destructive" />
                    <span className="font-medium">{record.vehicle.registrationNumber}</span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{record.serviceName}</p>
                  <p className="text-xs text-destructive mt-1">Due: {new Date(record.nextServiceDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <Card className="lg:col-span-2 glass border-border">
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No service records found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or add new services</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card 
              key={record.id} 
              className="glass border-border hover:border-primary/30 transition-all duration-300 cursor-pointer"
              onClick={() => isAdmin && openEditDialog(record)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🔧</div>
                    <div>
                      <h3 className="font-semibold capitalize">{record.serviceName}</h3>
                      <p className="text-sm text-muted-foreground">ID: {record.id}</p>
                    </div>
                  </div>
                  <Badge className={cn('capitalize', getStatusColor(record.status))}>
                    {record.status.toLowerCase()}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>{record.vehicle.registrationNumber} - {record.vehicle.vehicleName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Service Date: {new Date(record.serviceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Next Due: {new Date(record.nextServiceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span>${record.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{record.notes}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="glass-strong border-border sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Service Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label className="text-sm">Vehicle ID</Label>
              <Select value={formData.vehicleId} onValueChange={(v) => handleSelectChange('vehicleId', v)}>
                <SelectTrigger className="bg-secondary border-border h-9">
                  <SelectValue placeholder="Select vehicle ID" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.id} - {vehicle.vehicleName} ({vehicle.registrationNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Vehicle Name</Label>
                <Input 
                  value={selectedVehicleDetails?.name || ''} 
                  readOnly 
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Registration</Label>
                <Input 
                  value={selectedVehicleDetails?.reg || ''} 
                  readOnly 
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Service Name</Label>
                <Input 
                  name="serviceName"
                  value={formData.serviceName || ''} 
                  onChange={handleInputChange} 
                  placeholder="Oil Change, Brake Service..."
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Amount ($)</Label>
                <Input 
                  type="number"
                  name="amount"
                  value={formData.amount || ''} 
                  onChange={handleInputChange} 
                  placeholder="0.00"
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Service Date</Label>
                <Input 
                  type="date"
                  name="serviceDate"
                  value={formData.serviceDate || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Next Service Date</Label>
                <Input 
                  type="date"
                  name="nextServiceDate"
                  value={formData.nextServiceDate || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                <SelectTrigger className="bg-secondary border-border h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm">Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Enter service notes..."
                className="bg-secondary border-border min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddService}>
              Add Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Service Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="glass-strong border-border sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle>Update Service Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label className="text-sm">Vehicle ID</Label>
              <Input 
                value={formData.vehicleId || ''} 
                readOnly 
                className="bg-secondary border-border h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Vehicle Name</Label>
                <Input 
                  value={selectedVehicleDetails?.name || ''} 
                  readOnly 
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Registration</Label>
                <Input 
                  value={selectedVehicleDetails?.reg || ''} 
                  readOnly 
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Service Name</Label>
                <Input 
                  name="serviceName"
                  value={formData.serviceName || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Amount ($)</Label>
                <Input 
                  type="number"
                  name="amount"
                  value={formData.amount || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-sm">Service Date</Label>
                <Input 
                  type="date"
                  name="serviceDate"
                  value={formData.serviceDate || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm">Next Service Date</Label>
                <Input 
                  type="date"
                  name="nextServiceDate"
                  value={formData.nextServiceDate || ''} 
                  onChange={handleInputChange} 
                  className="bg-secondary border-border h-9"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                <SelectTrigger className="bg-secondary border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm">Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                className="bg-secondary border-border min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateService}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  );
};

export default ServicePage;