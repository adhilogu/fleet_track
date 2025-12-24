import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, X, Navigation, MapPin, Phone, Truck, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockVehicles, mockDrivers, getDriverById, searchVehiclesAndDrivers, Vehicle, Driver } from '@/data/mockData';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (type: 'bus' | 'truck' | 'cab', isTracking: boolean = false) => {
  const colors = {
    bus: '#22c55e',
    truck: '#3b82f6', 
    cab: '#f59e0b',
  };
  
  return L.divIcon({
    className: 'custom-marker-container',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${colors[type]};
        border-radius: 50%;
        border: 3px solid ${isTracking ? '#22d3ee' : 'white'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isTracking ? ', 0 0 20px rgba(34,211,238,0.5)' : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        ${isTracking ? 'animation: pulse 2s infinite;' : ''}
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          ${type === 'bus' ? '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>' :
            type === 'truck' ? '<path d="M5 18H3a2 2 0 01-2-2V6a2 2 0 012-2h13a2 2 0 012 2v2m-7 10h8a2 2 0 002-2v-5a2 2 0 00-2-2h-6l-3 4v3a2 2 0 002 2zm0 0a2 2 0 11-4 0m12 0a2 2 0 11-4 0"/>' :
            '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-6H7L4 10l-2.5.1C.7 10.3 0 11.1 0 12v4c0 .6.4 1 1 1h2m4 0h8"/><circle cx="6" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>'}
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Map component to handle tracking
const MapController: React.FC<{ trackingVehicle: Vehicle | null }> = ({ trackingVehicle }) => {
  const map = useMap();
  
  useEffect(() => {
    if (trackingVehicle) {
      map.flyTo([trackingVehicle.location.lat, trackingVehicle.location.lng], 15, {
        duration: 1.5,
      });
    }
  }, [trackingVehicle, map]);
  
  return null;
};

const TrackPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ vehicles: Vehicle[]; drivers: Driver[] } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }
    const results = searchVehiclesAndDrivers(searchQuery);
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.assignedDriver) {
      const driver = getDriverById(vehicle.assignedDriver);
      setSelectedDriver(driver || null);
    } else {
      setSelectedDriver(null);
    }
    setShowResults(false);
  };

  const handleSelectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    if (driver.assignedVehicle) {
      const vehicle = mockVehicles.find(v => v.id === driver.assignedVehicle);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
    setShowResults(false);
  };

  const handleTrack = () => {
    setIsTracking(true);
  };

  const handleEndTrack = () => {
    setIsTracking(false);
    setSelectedVehicle(null);
    setSelectedDriver(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setIsTracking(false);
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController trackingVehicle={isTracking ? selectedVehicle : null} />
        
        {mockVehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.location.lat, vehicle.location.lng]}
            icon={createCustomIcon(vehicle.type, isTracking && selectedVehicle?.id === vehicle.id)}
            eventHandlers={{
              click: () => handleSelectVehicle(vehicle),
            }}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold">{vehicle.model}</p>
                <p className="text-sm">{vehicle.plateNumber}</p>
                <p className="text-xs capitalize">{vehicle.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-96 z-[1000]">
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
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults && (
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
                          <div>
                            <p className="text-sm font-medium">{vehicle.plateNumber}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto capitalize text-xs">
                            {vehicle.status}
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
                          <div>
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.id}</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto capitalize text-xs">
                            {driver.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Card */}
      {(selectedVehicle || selectedDriver) && (
        <Card className="absolute top-4 right-4 bottom-4 w-80 z-[1000] glass-strong border-border overflow-hidden animate-slide-in-right">
          <div className="h-full flex flex-col">
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {/* Vehicle Info */}
              {selectedVehicle && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-3 rounded-xl',
                      selectedVehicle.status === 'active' ? 'bg-success/20 text-success' :
                      selectedVehicle.status === 'maintenance' ? 'bg-warning/20 text-warning' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedVehicle.plateNumber}</p>
                      <p className="text-sm text-muted-foreground">{selectedVehicle.model}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedVehicle.type}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className={cn(
                        'font-medium capitalize',
                        selectedVehicle.status === 'active' ? 'text-success' :
                        selectedVehicle.status === 'maintenance' ? 'text-warning' :
                        'text-muted-foreground'
                      )}>{selectedVehicle.status}</p>
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
                    <p className="text-sm">
                      {selectedVehicle.location.lat.toFixed(4)}, {selectedVehicle.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}

              {/* Driver Info */}
              {selectedDriver && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedDriver.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedDriver.id}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedDriver.phone}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">License</p>
                      <p className="font-medium">{selectedDriver.licenseNumber}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <p className="text-lg font-bold text-primary">{selectedDriver.totalTrips}</p>
                        <p className="text-xs text-muted-foreground">Total Trips</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <p className="text-lg font-bold text-warning">⭐ {selectedDriver.rating}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
              {!isTracking ? (
                <Button
                  onClick={handleTrack}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!selectedVehicle}
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
        <p className="text-xs text-muted-foreground mb-2">Vehicle Types</p>
        <div className="flex gap-4">
          {[
            { type: 'bus', color: '#22c55e' },
            { type: 'truck', color: '#3b82f6' },
            { type: 'cab', color: '#f59e0b' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs capitalize">{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
