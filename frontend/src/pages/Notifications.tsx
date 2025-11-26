import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, deleteNotification } = useData();
  const { toast } = useToast();

  const userNotifications = notifications.filter(n => n.to === user?.username);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    toast({
      title: "Marked as read",
      description: "Notification marked as read.",
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast({
      title: "Notification deleted",
      description: "Notification has been removed.",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground mt-2">Stay updated with important alerts</p>
            </div>
            <Badge variant="secondary">
              {userNotifications.filter(n => !n.read).length} New
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userNotifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications yet</p>
              ) : (
                userNotifications.map((notification, index) => (
                  <Card 
                    key={notification.id} 
                    className={`hover-scale animate-slide-in ${!notification.read ? 'border-primary/50' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <Badge variant="secondary" className="ml-2">New</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                          <div className="flex gap-2 pt-2">
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                                Mark as Read
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
