import React, { useState, useEffect } from 'react';
import { 
  Truck, Users, Calendar, Wrench, TrendingUp, MapPin,
  AlertTriangle, CheckCircle2, Clock, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/api/api';

//v1
const StatCard = ({ title, value, icon, trend, trendUp = true }) => (
  <Card className="glass border-border hover:border-primary/30 transition-all duration-300 group">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 flex items-center gap-1', trendUp ? 'text-success' : 'text-destructive')}>
              <TrendingUp className={cn('w-3 h-3', !trendUp && 'rotate-180')} />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is ADMIN
    if (user?.role !== 'ADMIN') {
      setError('Access Denied: Only administrators can view the dashboard');
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user]);

  

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await api.get('/dashboard');
    const data = res.data;

    setVehicles(data.vehicles || []);
    setDrivers(data.drivers || []);
    setAssignments(data.assignments || []);
    setServices(data.services || []);
    setUsers(data.users || []);

  } catch (err: any) {
    if (err.response?.status === 403) {
      setError('Access Denied: Admin role required');
    } else {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  } finally {
    setLoading(false);
  }
};


  // Calculate statistics with safe array checks
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
  const driversList = Array.isArray(drivers) ? drivers : [];
  const assignmentsList = Array.isArray(assignments) ? assignments : [];
  const servicesList = Array.isArray(services) ? services : [];
  const usersList = Array.isArray(users) ? users : [];

  const totalVehicles = vehiclesList.length;
  const totalDrivers = driversList.length;
  const activeVehicles = vehiclesList.filter(v => v.status?.toUpperCase() === 'ACTIVE').length;
  const activeDrivers = driversList.filter(d => 
    d.status?.toUpperCase() === 'ACTIVE' || d.status?.toUpperCase() === 'ON_TRIP'
  ).length;
  const scheduledAssignments = assignmentsList.filter(a => 
    ['SCHEDULED', 'IN_PROGRESS', 'IN PROGRESS'].includes(a.status?.toUpperCase())
  ).length;
  const overdueServices = servicesList.filter(s => s.status?.toUpperCase() === 'OVERDUE').length;
  const pendingServices = servicesList.filter(s => s.status?.toUpperCase() === 'PENDING').length;
  const totalServiceAlerts = overdueServices + pendingServices;

  // Get recent assignments
  const recentAssignments = [...assignmentsList]
    .sort((a, b) => {
      const dateA = new Date(a.startTime || a.createdAt || 0).getTime();
      const dateB = new Date(b.startTime || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  // Get service alerts
  const serviceAlerts = servicesList.filter(s => 
    ['OVERDUE', 'PENDING'].includes(s.status?.toUpperCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">Please contact your system administrator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Admin Dashboard - <span className="gradient-text">{user?.name || 'Administrator'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Fleet Management System Overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Admin Access</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Vehicles"
          value={`${activeVehicles} / ${totalVehicles}`}
          icon={<Truck className="w-5 h-5" />}
          trend={`${activeVehicles} active`}
          trendUp={activeVehicles > 0}
        />
        <StatCard
          title="Active Drivers"
          value={`${activeDrivers} / ${totalDrivers}`}
          icon={<Users className="w-5 h-5" />}
          trend={`${activeDrivers} active`}
          trendUp={activeDrivers > 0}
        />
        <StatCard
          title="Scheduled Assignments"
          value={scheduledAssignments}
          icon={<Calendar className="w-5 h-5" />}
          trend={`${assignmentsList.length} total`}
        />
        <StatCard
          title="Service Alerts"
          value={totalServiceAlerts}
          icon={<Wrench className="w-5 h-5" />}
          trend={totalServiceAlerts > 0 ? `${overdueServices} overdue` : 'All clear'}
          trendUp={totalServiceAlerts === 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments */}
        <Card className="lg:col-span-2 glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => {
                  const assignedMember = assignment.driver?.name || 
                                        assignment.user?.name || 
                                        usersList.find(u => u.id === assignment.userId)?.name ||
                                        'Unassigned';
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn('p-2 rounded-lg',
                          assignment.status?.toUpperCase() === 'COMPLETED' ? 'bg-success/20 text-success' :
                          ['IN_PROGRESS', 'IN PROGRESS'].includes(assignment.status?.toUpperCase()) ? 'bg-primary/20 text-primary' :
                          assignment.status?.toUpperCase() === 'SCHEDULED' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        )}>
                          {assignment.status?.toUpperCase() === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> :
                           ['IN_PROGRESS', 'IN PROGRESS'].includes(assignment.status?.toUpperCase()) ? <MapPin className="w-4 h-4" /> :
                           <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{assignment.startLocation || 'N/A'} → {assignment.endLocation || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">Assigned to: <span className="font-medium">{assignedMember}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize',
                          assignment.status?.toUpperCase() === 'COMPLETED' ? 'bg-success/20 text-success' :
                          ['IN_PROGRESS', 'IN PROGRESS'].includes(assignment.status?.toUpperCase()) ? 'bg-primary/20 text-primary' :
                          assignment.status?.toUpperCase() === 'SCHEDULED' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        )}>
                          {assignment.status?.toLowerCase().replace('_', ' ') || 'N/A'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assignment.startTime ? new Date(assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No assignments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Alerts */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceAlerts.length > 0 ? (
                serviceAlerts.map((service) => {
                  const isOverdue = service.status?.toUpperCase() === 'OVERDUE';
                  const vehicleData = vehiclesList.find(v => v.id === service.vehicleId);
                  
                  return (
                    <div key={service.id} className={cn("p-4 rounded-xl border",
                      isOverdue ? "bg-destructive/10 border-destructive/20" : "bg-warning/10 border-warning/20"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className={cn("w-4 h-4", isOverdue ? "text-destructive" : "text-warning")} />
                        <span className={cn("font-medium text-sm", isOverdue ? "text-destructive" : "text-warning")}>
                          {isOverdue ? 'Service Overdue' : 'Service Pending'}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {service.vehicle?.vehicleName || vehicleData?.vehicleName || 'Unknown Vehicle'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service.vehicle?.registrationNumber || vehicleData?.registrationNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Service: {service.serviceName || 'N/A'}</p>
                      {service.nextServiceDate && (
                        <p className={cn("text-xs mt-1", isOverdue ? "text-destructive" : "text-warning")}>
                          Due: {new Date(service.nextServiceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-sm font-medium text-success">All Clear!</p>
                  <p className="text-xs text-muted-foreground">No maintenance alerts</p>
                </div>
              )}

              {/* Fleet Overview */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">Fleet Overview</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-success">{activeVehicles}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-muted-foreground">
                      {vehiclesList.filter(v => v.status?.toUpperCase() === 'IDLE').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Idle</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;