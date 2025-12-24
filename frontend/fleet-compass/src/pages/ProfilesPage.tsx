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
  MapPin
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockDrivers, mockVehicles, Driver, Vehicle, getVehicleById, getDriverById } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const ProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('drivers');

  const filteredDrivers = mockDrivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = mockVehicles.filter((vehicle) =>
    vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDriverStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'active': return 'status-online';
      case 'on-trip': return 'bg-primary/20 text-primary border-primary/30';
      case 'off-duty': return 'bg-muted/20 text-muted-foreground border-muted-foreground/30';
      case 'on-leave': return 'status-maintenance';
    }
  };

  const getVehicleStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'status-online';
      case 'idle': return 'bg-muted/20 text-muted-foreground border-muted-foreground/30';
      case 'maintenance': return 'status-maintenance';
      case 'out-of-service': return 'status-alert';
    }
  };

  const getVehicleTypeIcon = (type: Vehicle['type']) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'truck': return '🚛';
      case 'cab': return '🚕';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isAdmin ? 'Fleet Profiles' : 'My Profile'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'View and manage all drivers and vehicles' : 'View your profile information'}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4 mr-2" />
            Vehicles
          </TabsTrigger>
        </TabsList>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.length === 0 ? (
              <Card className="col-span-full glass border-border">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No drivers found</p>
                </CardContent>
              </Card>
            ) : (
              filteredDrivers.map((driver) => {
                const assignedVehicle = driver.assignedVehicle ? getVehicleById(driver.assignedVehicle) : null;

                return (
                  <Card key={driver.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header with gradient */}
                      <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent relative">
                        <Badge className={cn('absolute top-3 right-3 capitalize', getDriverStatusColor(driver.status))}>
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
                  <Card key={vehicle.id} className="glass border-border hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getVehicleTypeIcon(vehicle.type)}</div>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {vehicle.plateNumber}
                            </h3>
                            <p className="text-sm text-muted-foreground">{vehicle.id}</p>
                          </div>
                        </div>
                        <Badge className={cn('capitalize', getVehicleStatusColor(vehicle.status))}>
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
                        <div className="p-2 rounded-lg bg-secondary">
                          <p className="text-xs text-muted-foreground">Fuel Level</p>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  vehicle.fuelLevel > 50 ? 'bg-success' :
                                  vehicle.fuelLevel > 25 ? 'bg-warning' : 'bg-destructive'
                                )}
                                style={{ width: `${vehicle.fuelLevel}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{vehicle.fuelLevel}%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary">
                          <p className="text-xs text-muted-foreground">Mileage</p>
                          <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
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
                          <span className={cn(
                            new Date(vehicle.nextServiceDate) < new Date() ? 'text-destructive' : ''
                          )}>
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

                      {/* Location */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                        <MapPin className="w-3 h-3" />
                        <span>{vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilesPage;
