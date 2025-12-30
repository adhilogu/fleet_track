import React from 'react';
import { 
  Truck, 
  Users, 
  Calendar, 
  Wrench, 
  TrendingUp, 
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { mockVehicles, mockDrivers, mockSchedules, mockServiceRecords } from '@/data/mockData';
import { cn } from '@/lib/utils';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}> = ({ title, value, icon, trend, trendUp, className }) => (
  <Card className={cn('glass border-border hover:border-primary/30 transition-all duration-300 group', className)}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-2 flex items-center gap-1',
              trendUp ? 'text-success' : 'text-destructive'
            )}>
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const is = user?.role === '';

  const activeVehicles = mockVehicles.filter(v => v.status === 'active').length;
  const activeDrivers = mockDrivers.filter(d => d.status === 'active' || d.status === 'on-trip').length;
  const scheduledTrips = mockSchedules.filter(s => s.status === 'scheduled' || s.status === 'in-progress').length;
  const pendingService = mockServiceRecords.filter(s => s.status === 'pending' || s.status === 'overdue').length;

  const recentSchedules = mockSchedules.slice(0, 5);
  const vehiclesNeedingService = mockVehicles.filter(v => v.status === 'maintenance');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your fleet today
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-primary">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Vehicles"
          value={activeVehicles}
          icon={<Truck className="w-5 h-5" />}
          trend="+2 this week"
          trendUp
        />
        <StatCard
          title="Active Drivers"
          value={activeDrivers}
          icon={<Users className="w-5 h-5" />}
          trend="+1 today"
          trendUp
        />
        <StatCard
          title="Scheduled Trips"
          value={scheduledTrips}
          icon={<Calendar className="w-5 h-5" />}
          trend="3 pending"
        />
        <StatCard
          title="Pending Service"
          value={pendingService}
          icon={<Wrench className="w-5 h-5" />}
          trend={pendingService > 0 ? 'Action needed' : 'All clear'}
          trendUp={pendingService === 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Schedules */}
        <Card className="lg:col-span-2 glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2 rounded-lg',
                      schedule.status === 'completed' ? 'bg-success/20 text-success' :
                      schedule.status === 'in-progress' ? 'bg-primary/20 text-primary' :
                      schedule.status === 'scheduled' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    )}>
                      {schedule.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                       schedule.status === 'in-progress' ? <MapPin className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{schedule.route}</p>
                      <p className="text-xs text-muted-foreground">
                        {schedule.startLocation} → {schedule.endLocation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium capitalize',
                      schedule.status === 'completed' ? 'status-online' :
                      schedule.status === 'in-progress' ? 'bg-primary/20 text-primary' :
                      schedule.status === 'scheduled' ? 'status-maintenance' :
                      'status-alert'
                    )}>
                      {schedule.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Service */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehiclesNeedingService.length > 0 ? (
                vehiclesNeedingService.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 rounded-xl bg-warning/10 border border-warning/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-warning" />
                      <span className="font-medium text-sm text-warning">Maintenance Required</span>
                    </div>
                    <p className="text-sm">{vehicle.model}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-sm font-medium text-success">All Clear!</p>
                  <p className="text-xs text-muted-foreground">No immediate alerts</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">Fleet Overview</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-success">{mockVehicles.filter(v => v.status === 'active').length}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-muted-foreground">{mockVehicles.filter(v => v.status === 'idle').length}</p>
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
