
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Utensils, Package, Clock } from 'lucide-react';

const AlertsNotifications: React.FC = () => {
  const alerts = [
    {
      id: 'a1',
      type: 'inventory',
      title: 'Low Stock Alert',
      description: 'Kitchen #12: Rice inventory below threshold (3kg remaining)',
      icon: Package,
      timestamp: '28 minutes ago',
      priority: 'high'
    },
    {
      id: 'a2',
      type: 'preparation',
      title: 'Preparation Delay',
      description: 'Kitchen #7: Lunch preparation is behind schedule by 25 minutes',
      icon: Clock,
      timestamp: '45 minutes ago',
      priority: 'medium'
    },
    {
      id: 'a3',
      type: 'wastage',
      title: 'High Wastage Reported',
      description: 'Kitchen #23: Reported 15% wastage for today\'s lunch service',
      icon: Utensils,
      timestamp: '2 hours ago',
      priority: 'medium'
    },
    {
      id: 'a4',
      type: 'maintenance',
      title: 'Equipment Failure',
      description: 'Kitchen #5: Main refrigerator malfunction reported',
      icon: AlertCircle,
      timestamp: '3 hours ago',
      priority: 'high'
    }
  ];

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Alerts & Notifications</CardTitle>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`flex p-3 rounded-lg border ${getPriorityClass(alert.priority)}`}
            >
              <div className="flex-shrink-0 mr-3">
                <alert.icon className={`h-5 w-5`} />
              </div>
              <div className="flex-grow">
                <div className="font-medium">{alert.title}</div>
                <div className="text-sm">{alert.description}</div>
                <div className="text-xs opacity-70 mt-1">{alert.timestamp}</div>
              </div>
              <div className="flex-shrink-0 self-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Dismiss</span>
                  <span className="text-lg">×</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsNotifications;
