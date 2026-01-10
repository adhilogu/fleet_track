import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, X, Navigation, MapPin, Phone, Truck, CircleDashed,User, List, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import api from '@/api/api';


// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Vehicle {
  id: number;
  vehicleName: string;
  registrationNumber: string;
  model: string;
  type: string;
  status: string;
  vehicleLocationStatus: string;
  capacity: number;
  fuelLevel: number;
  mileage: number;
  currentLocation: string;
  location: { lat: number; lng: number };
  assignedDriver: {
    id: number;
    name: string;
    username: string;
    phoneNumber: string;
    status: string;
  } | null;
}

interface Driver {
  id: number;
  name: string;
  username: string;
  phoneNumber: string;
  mailId: string;
  status: string;
  totalTrips: number;
  rating: number;
  assignedVehicleId: number | null;
  assignedVehicleRegistration: string | null;
}

const createCustomIcon = (type: string, locationStatus: string, isTracking: boolean = false) => {
  
  const typeColors: Record<string, string> = {
    BUS: '#22c55e',
    TRUCK: '#3b82f6', 
    CAR: '#f59e0b',
    CAB: '#f59e0b',
  };
  
  const statusColor = locationStatus === 'TRACKED' ? '#22c55e' : '#ef4444';
  const baseColor = typeColors[type] || '#6b7280';
  
  return L.divIcon({
    className: 'custom-marker-container',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${baseColor};
        border-radius: 50%;
        border: 4px solid ${isTracking ? '#22d3ee' : statusColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isTracking ? ', 0 0 20px rgba(34,211,238,0.5)' : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        ${isTracking ? 'animation: pulse 2s infinite;' : ''}
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="M3 10h18"/>
          <circle cx="7" cy="16" r="2"/>
          <circle cx="17" cy="16" r="2"/>
        </svg>
        ${locationStatus === 'UNTRACKED' ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 12px;
            height: 12px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MapController: React.FC<{ trackingVehicle: Vehicle | null }> = ({ trackingVehicle }) => {
  const map = useMap();
  
  useEffect(() => {
    if (trackingVehicle && trackingVehicle.location.lat && trackingVehicle.location.lng) {
      map.flyTo([trackingVehicle.location.lat, trackingVehicle.location.lng], 15, {
        duration: 1.5,
      });
    }
  }, [trackingVehicle, map]);
  
  return null;
};

const TrackPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ vehicles: Vehicle[]; drivers: Driver[] } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchAllVehicles();
  }, []);

  const fetchAllVehicles = async () => {
  try {
    setLoading(true);
    const res = await api.get('/track/vehicles/all');
    setVehicles(res.data || []);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
  } finally {
    setLoading(false);
    
  }
};


  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get('/track/vehicles/search', {
        params: { query: searchQuery },
      });

      setSearchResults(res.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearchLoading(false);
    }
  };


  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowResults(false);
    setShowAllVehicles(false);
  };

  const handleSelectDriver = async (driver: Driver) => {
  if (!driver.assignedVehicleId) return;

  try {
    const res = await api.get(`/track/vehicles/${driver.assignedVehicleId}`);
    setSelectedVehicle(res.data);
    setShowResults(false);
    setShowAllVehicles(false);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
  }
};


  const handleTrack = () => {
    setIsTracking(true);
  };

  const handleEndTrack = () => {
    setIsTracking(false);
    setSelectedVehicle(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
    setSelectedVehicle(null);
    setIsTracking(false);
    setShowAllVehicles(false);
  };

  const toggleViewAllVehicles = () => {
    setShowAllVehicles(!showAllVehicles);
    setShowResults(false);
  };

  return (
    <div className="relative h-full w-full">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>

      <MapContainer
        center={[13.0830, 80.2704]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController trackingVehicle={isTracking ? selectedVehicle : null} />
        
        {vehicles.map((vehicle) => (
          vehicle.location.lat && vehicle.location.lng && (
            <Marker
              key={vehicle.id}
              position={[vehicle.location.lat, vehicle.location.lng]}
              icon={createCustomIcon(vehicle.type, vehicle.vehicleLocationStatus, isTracking && selectedVehicle?.id === vehicle.id)}
              eventHandlers={{
                click: () => handleSelectVehicle(vehicle),
              }}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{vehicle.vehicleName}</p>
                  <p className="text-sm">{vehicle.registrationNumber}</p>
                  <p className="text-xs capitalize">{vehicle.status.toLowerCase()}</p>
                  <Badge 
                    variant={vehicle.vehicleLocationStatus === 'TRACKED' ? 'default' : 'destructive'}
                    className="mt-1 text-xs"
                  >
                    {vehicle.vehicleLocationStatus}
                  </Badge>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Search Bar with View All Button */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-[500px] z-[1000]">
        <div className="glass-strong rounded-xl p-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle ID, plate, or driver name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-8 bg-secondary border-border"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} size="sm" className="bg-primary hover:bg-primary/90">
              Search
            </Button>
            <Button 
              onClick={toggleViewAllVehicles} 
              size="sm" 
              variant="outline"
              className="border-border"
            >
              <List className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {searchLoading && (
            <div className="mt-2 p-4 text-sm text-muted-foreground text-center">
              <div className="text-center">
              <CircleDashed className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-xs font-medium">Loading Results...</p>
            </div>
            </div>
          )}
      
          {!loading && showResults && searchResults && (
            <div className="mt-2 max-h-64 overflow-y-auto scrollbar-thin rounded-lg bg-card border border-border">
              {searchResults.vehicles.length === 0 && searchResults.drivers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No results found</p>
              ) : (
                <>
                  {searchResults.vehicles.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground px-2 mb-1">Vehicles</p>
                      {searchResults.vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => handleSelectVehicle(vehicle)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-left"
                        >
                          <Truck className="w-4 h-4 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{vehicle.registrationNumber}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                          </div>
                          <Badge 
                            variant={vehicle.vehicleLocationStatus === 'TRACKED' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {vehicle.vehicleLocationStatus}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.drivers.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <p className="text-xs text-muted-foreground px-2 mb-1">Drivers</p>
                      {searchResults.drivers.map((driver) => (
                        <button
                          key={driver.id}
                          onClick={() => handleSelectDriver(driver)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-left"
                        >
                          <User className="w-4 h-4 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.username}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {driver.status.toLowerCase()}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* View All Vehicles Panel */}
          {loading && (
            <div className="mt-2 p-4 text-sm text-muted-foreground text-center">
              <div className="text-center">
              <CircleDashed className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-xs font-medium">Loading Results...</p>
            </div>
            </div>
          )}

          {showAllVehicles && (
            <div className="mt-2 max-h-96 overflow-y-auto scrollbar-thin rounded-lg bg-card border border-border">
              <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">All Vehicles ({vehicles.length})</h3>
                <button onClick={toggleViewAllVehicles} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-left border border-border"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      vehicle.vehicleLocationStatus === 'TRACKED' ? 'bg-success/20' : 'bg-destructive/20'
                    )}>
                      <Truck className={cn(
                        "w-5 h-5",
                        vehicle.vehicleLocationStatus === 'TRACKED' ? 'text-success' : 'text-destructive'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vehicle.vehicleName}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
                      {vehicle.assignedDriver && (
                        <p className="text-xs text-primary mt-0.5">
                          <User className="w-3 h-3 inline mr-1" />
                          {vehicle.assignedDriver.name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant={vehicle.vehicleLocationStatus === 'TRACKED' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {vehicle.vehicleLocationStatus}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {vehicle.status.toLowerCase()}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Card */}
      {selectedVehicle && (
        <Card className="absolute top-4 right-4 bottom-4 w-80 z-[1000] glass-strong border-border overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border bg-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Tracking Details</h3>
                <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isTracking && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Live Tracking Active
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-xl',
                    selectedVehicle.status === 'ACTIVE' ? 'bg-success/20 text-success' :
                    selectedVehicle.status === 'MAINTENANCE' ? 'bg-warning/20 text-warning' :
                    'bg-secondary text-muted-foreground'
                  )}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedVehicle.vehicleName}</p>
                    <p className="text-sm text-muted-foreground">{selectedVehicle.registrationNumber}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-secondary">
                  <Badge 
                    variant={selectedVehicle.vehicleLocationStatus === 'TRACKED' ? 'default' : 'destructive'}
                  >
                    {selectedVehicle.vehicleLocationStatus}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedVehicle.vehicleLocationStatus === 'TRACKED' ? 'Location Tracking Active' : 'Location Not Tracked'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedVehicle.type.toLowerCase()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn(
                      'font-medium capitalize',
                      selectedVehicle.status === 'ACTIVE' ? 'text-success' :
                      selectedVehicle.status === 'MAINTENANCE' ? 'text-warning' :
                      'text-muted-foreground'
                    )}>{selectedVehicle.status.toLowerCase()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Fuel Level</p>
                    <p className="font-medium">{selectedVehicle.fuelLevel}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Mileage</p>
                    <p className="font-medium">{selectedVehicle.mileage.toLocaleString()} km</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Current Location</p>
                    <p className="text-sm font-medium">{selectedVehicle.currentLocation}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedVehicle.location.lat.toFixed(4)}, {selectedVehicle.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedVehicle.assignedDriver && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedVehicle.assignedDriver.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedVehicle.assignedDriver.username}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedVehicle.assignedDriver.phoneNumber}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Driver Status</p>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {selectedVehicle.assignedDriver.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border space-y-2">
              {!isTracking ? (
                <Button
                  onClick={handleTrack}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={selectedVehicle.vehicleLocationStatus === 'UNTRACKED'}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Tracking
                </Button>
              ) : (
                <Button
                  onClick={handleEndTrack}
                  variant="destructive"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  End Tracking
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] glass rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-2">Location Status</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs">Tracked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs">Untracked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;