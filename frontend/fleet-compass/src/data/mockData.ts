export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: 'active' | 'on-trip' | 'off-duty' | 'on-leave';
  avatar?: string;
  assignedVehicle?: string;
  totalTrips: number;
  rating: number;
  joinedDate: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'bus' | 'truck' | 'cab';
  model: string;
  capacity: number;
  status: 'active' | 'idle' | 'maintenance' | 'out-of-service';
  fuelLevel: number;
  mileage: number;
  lastServiceDate: string;
  nextServiceDate: string;
  assignedDriver?: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Schedule {
  id: string;
  vehicleId: string;
  driverId: string;
  route: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startLocation: string;
  endLocation: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  type: 'oil-change' | 'tire-rotation' | 'brake-service' | 'engine-check' | 'full-service';
  date: string;
  cost: number;
  notes: string;
  nextDueDate: string;
  status: 'completed' | 'pending' | 'overdue';
}

// Mock Data
export const mockDrivers: Driver[] = [
  {
    id: 'DRV001',
    name: 'John Smith',
    email: 'john.smith@fleet.com',
    phone: '+1 234-567-8901',
    licenseNumber: 'DL-2024-001',
    status: 'active',
    assignedVehicle: 'VH001',
    totalTrips: 342,
    rating: 4.8,
    joinedDate: '2022-03-15',
  },
  {
    id: 'DRV002',
    name: 'Sarah Johnson',
    email: 'sarah.j@fleet.com',
    phone: '+1 234-567-8902',
    licenseNumber: 'DL-2024-002',
    status: 'on-trip',
    assignedVehicle: 'VH002',
    totalTrips: 256,
    rating: 4.9,
    joinedDate: '2021-08-22',
  },
  {
    id: 'DRV003',
    name: 'Mike Wilson',
    email: 'mike.w@fleet.com',
    phone: '+1 234-567-8903',
    licenseNumber: 'DL-2024-003',
    status: 'off-duty',
    totalTrips: 189,
    rating: 4.6,
    joinedDate: '2023-01-10',
  },
  {
    id: 'DRV004',
    name: 'Emily Davis',
    email: 'emily.d@fleet.com',
    phone: '+1 234-567-8904',
    licenseNumber: 'DL-2024-004',
    status: 'active',
    assignedVehicle: 'VH004',
    totalTrips: 421,
    rating: 4.95,
    joinedDate: '2020-11-05',
  },
  {
    id: 'DRV005',
    name: 'Robert Brown',
    email: 'robert.b@fleet.com',
    phone: '+1 234-567-8905',
    licenseNumber: 'DL-2024-005',
    status: 'on-leave',
    totalTrips: 167,
    rating: 4.5,
    joinedDate: '2023-06-18',
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'VH001',
    plateNumber: 'FL-1234-AB',
    type: 'bus',
    model: 'Mercedes Sprinter 2023',
    capacity: 22,
    status: 'active',
    fuelLevel: 78,
    mileage: 45230,
    lastServiceDate: '2024-01-15',
    nextServiceDate: '2024-04-15',
    assignedDriver: 'DRV001',
    location: { lat: 40.7128, lng: -74.006 },
  },
  {
    id: 'VH002',
    plateNumber: 'FL-5678-CD',
    type: 'truck',
    model: 'Volvo FH16 2022',
    capacity: 40,
    status: 'active',
    fuelLevel: 92,
    mileage: 89450,
    lastServiceDate: '2024-02-20',
    nextServiceDate: '2024-05-20',
    assignedDriver: 'DRV002',
    location: { lat: 40.7580, lng: -73.9855 },
  },
  {
    id: 'VH003',
    plateNumber: 'FL-9012-EF',
    type: 'cab',
    model: 'Toyota Camry 2024',
    capacity: 4,
    status: 'idle',
    fuelLevel: 45,
    mileage: 12300,
    lastServiceDate: '2024-03-01',
    nextServiceDate: '2024-06-01',
    location: { lat: 40.7489, lng: -73.9680 },
  },
  {
    id: 'VH004',
    plateNumber: 'FL-3456-GH',
    type: 'bus',
    model: 'Scania Touring 2023',
    capacity: 50,
    status: 'active',
    fuelLevel: 65,
    mileage: 67890,
    lastServiceDate: '2024-01-28',
    nextServiceDate: '2024-04-28',
    assignedDriver: 'DRV004',
    location: { lat: 40.7614, lng: -73.9776 },
  },
  {
    id: 'VH005',
    plateNumber: 'FL-7890-IJ',
    type: 'truck',
    model: 'DAF XF 2021',
    capacity: 35,
    status: 'maintenance',
    fuelLevel: 30,
    mileage: 134500,
    lastServiceDate: '2024-03-10',
    nextServiceDate: '2024-03-25',
    location: { lat: 40.7282, lng: -73.7949 },
  },
  {
    id: 'VH006',
    plateNumber: 'FL-2345-KL',
    type: 'cab',
    model: 'Honda Accord 2023',
    capacity: 4,
    status: 'active',
    fuelLevel: 88,
    mileage: 23400,
    lastServiceDate: '2024-02-14',
    nextServiceDate: '2024-05-14',
    location: { lat: 40.7549, lng: -73.9840 },
  },
];

export const mockSchedules: Schedule[] = [
  {
    id: 'SCH001',
    vehicleId: 'VH001',
    driverId: 'DRV001',
    route: 'Downtown Express Route A',
    startTime: '2024-03-20T08:00:00',
    endTime: '2024-03-20T16:00:00',
    status: 'scheduled',
    startLocation: 'Central Station',
    endLocation: 'Airport Terminal',
  },
  {
    id: 'SCH002',
    vehicleId: 'VH002',
    driverId: 'DRV002',
    route: 'Industrial Zone Delivery',
    startTime: '2024-03-20T06:00:00',
    endTime: '2024-03-20T14:00:00',
    status: 'in-progress',
    startLocation: 'Warehouse District',
    endLocation: 'Port Authority',
  },
  {
    id: 'SCH003',
    vehicleId: 'VH004',
    driverId: 'DRV004',
    route: 'School Route B',
    startTime: '2024-03-20T07:00:00',
    endTime: '2024-03-20T09:00:00',
    status: 'completed',
    startLocation: 'Residential Area',
    endLocation: 'Lincoln High School',
  },
  {
    id: 'SCH004',
    vehicleId: 'VH006',
    driverId: 'DRV001',
    route: 'VIP Airport Transfer',
    startTime: '2024-03-21T10:00:00',
    endTime: '2024-03-21T12:00:00',
    status: 'scheduled',
    startLocation: 'Grand Hotel',
    endLocation: 'JFK Airport',
  },
  {
    id: 'SCH005',
    vehicleId: 'VH003',
    driverId: 'DRV003',
    route: 'City Tour',
    startTime: '2024-03-19T09:00:00',
    endTime: '2024-03-19T17:00:00',
    status: 'cancelled',
    startLocation: 'Times Square',
    endLocation: 'Times Square',
  },
];

export const mockServiceRecords: ServiceRecord[] = [
  {
    id: 'SRV001',
    vehicleId: 'VH001',
    type: 'oil-change',
    date: '2024-01-15',
    cost: 150,
    notes: 'Regular oil change with synthetic oil',
    nextDueDate: '2024-04-15',
    status: 'completed',
  },
  {
    id: 'SRV002',
    vehicleId: 'VH002',
    type: 'brake-service',
    date: '2024-02-20',
    cost: 450,
    notes: 'Front brake pads replaced',
    nextDueDate: '2024-08-20',
    status: 'completed',
  },
  {
    id: 'SRV003',
    vehicleId: 'VH005',
    type: 'full-service',
    date: '2024-03-10',
    cost: 1200,
    notes: 'Complete engine overhaul in progress',
    nextDueDate: '2024-03-25',
    status: 'pending',
  },
  {
    id: 'SRV004',
    vehicleId: 'VH003',
    type: 'tire-rotation',
    date: '2024-03-01',
    cost: 80,
    notes: 'All four tires rotated',
    nextDueDate: '2024-06-01',
    status: 'completed',
  },
  {
    id: 'SRV005',
    vehicleId: 'VH004',
    type: 'engine-check',
    date: '2024-01-28',
    cost: 200,
    notes: 'Minor tune-up required',
    nextDueDate: '2024-03-18',
    status: 'overdue',
  },
];

// Helper functions
export const getDriverById = (id: string): Driver | undefined => 
  mockDrivers.find(d => d.id === id);

export const getVehicleById = (id: string): Vehicle | undefined => 
  mockVehicles.find(v => v.id === id);

export const getVehicleByPlate = (plate: string): Vehicle | undefined => 
  mockVehicles.find(v => v.plateNumber.toLowerCase().includes(plate.toLowerCase()));

export const searchVehiclesAndDrivers = (query: string) => {
  const lowerQuery = query.toLowerCase();
  const vehicles = mockVehicles.filter(v => 
    v.id.toLowerCase().includes(lowerQuery) ||
    v.plateNumber.toLowerCase().includes(lowerQuery) ||
    v.model.toLowerCase().includes(lowerQuery)
  );
  const drivers = mockDrivers.filter(d => 
    d.id.toLowerCase().includes(lowerQuery) ||
    d.name.toLowerCase().includes(lowerQuery)
  );
  return { vehicles, drivers };
};
