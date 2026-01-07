import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Star,
  Calendar,
  Award,
  Truck,
  Loader2
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from "@/api/api";

interface Vehicle {
  id: number;
  name: string;
  plateNumber: string;
  model: string;
  type: string;
  capacity: number;
  status: string;
  lastServiceDate: string;
  nextServiceDate: string;
}

interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: number;
  username: string;
  role: string;
  status?: string;
  photo?: string;
  createdDate: string;

  driverId?: number;
  licenseNumber?: string;
  totalTrips?: number;
  rating?: number;
  joinedDate?: string;
  assignedVehicle?: Vehicle;
}

/* ================= HELPERS ================= */


const getLoggedInUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const statusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'INACTIVE':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'ON_TRIP':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

/* ================= COMPONENT ================= */

const DriverProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
  const user = getLoggedInUser();

  if (!user?.userId) {
    setError('Authentication required. Please login again.');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const res = await api.get(`/v1/profiles/me/${user.userId}`);
    const data = res.data;

    if (data.success) {
      setProfile(data.profile);
    } else {
      setError(data.message || 'Failed to load profile');
    }
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError('Session expired. Please login again.');
    } else {
      setError(err.response?.data?.message || 'Network error');
    }
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchProfile();
  }, []);

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  const isDriver = profile.role === 'DRIVER';

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.username}
          </p>
        </div>

        {/* PROFILE CARD */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {/* PHOTO */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile.photo ? (
                  <img
                    src={`http://localhost:8080${profile.photo}`}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>

              {/* BASIC INFO */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {profile.email}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{profile.role}</Badge>
                  {profile.status && (
                    <Badge
                      variant="outline"
                      className={statusColor(profile.status)}
                    >
                      {profile.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{profile.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>@{profile.username}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                    Joined:{' '}
                    {new Date(
                        profile.joinedDate || profile.createdDate
                    ).toLocaleDateString()}
                    </span>
                </div>

                {profile.licenseNumber && (
                    <div className="flex items-center gap-2 col-span-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{profile.licenseNumber}</span>
                    </div>
                )}
                </div>
          </CardContent>
        </Card>

        {/* DRIVER STATS */}
        {isDriver && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">
                  {profile.totalTrips ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold">
                    {profile.rating ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ASSIGNED VEHICLE */}
        {isDriver && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Assigned Vehicle
              </h3>

              {profile.assignedVehicle ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {profile.assignedVehicle.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.assignedVehicle.plateNumber} •{' '}
                    {profile.assignedVehicle.model}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {profile.assignedVehicle.type}
                    </Badge>
                    <Badge variant="outline">
                      {profile.assignedVehicle.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No vehicle assigned
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverProfilePage;
