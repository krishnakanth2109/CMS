import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Send, MessageSquare, Clock, Users, Inbox } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Messages() {
  const { user } = useAuth();
  const { messages, sendMessage, recruiters } = useData(); // recruiters available in DataContext
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  const isAdmin = user?.role === 'admin';

  // Messages for filtering
  const sentMessages = messages.filter((m) => m.from === 'admin');
  const receivedReplies = messages.filter((m) => m.to === 'admin' && m.from !== 'admin');
  const recruiterInbox = messages.filter((m) => m.to === user?.username && m.from === 'admin');

  // Handle message sending
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (isAdmin && !recipient) return;

    if (isAdmin && recipient === 'all') {
      recruiters.forEach((rec) =>
        sendMessage({
          from: 'admin',
          to: rec.username,
          subject: 'Broadcast Message',
          content: newMessage,
          timestamp: new Date().toISOString(),
        })
      );
      toast({
        title: 'Message sent to all recruiters',
        description: 'Broadcast message delivered successfully.',
      });
    } else {
      sendMessage({
        from: isAdmin ? 'admin' : user?.username || '',
        to: isAdmin ? recipient : 'admin',
        subject: isAdmin ? 'Admin Message' : 'Reply from Recruiter',
        content: newMessage,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    }

    setNewMessage('');
    setRecipient('');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin
                ? 'View recruiter replies and send messages to individuals or all recruiters.'
                : 'Read messages from admin and reply back.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE - MESSAGE LISTS */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {isAdmin ? 'Admin Messages Center' : 'Inbox'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <Tabs defaultValue="sent" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="sent" className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Sent Messages
                      </TabsTrigger>
                      <TabsTrigger value="received" className="flex items-center gap-2">
                        <Inbox className="h-4 w-4" /> Received Replies
                      </TabsTrigger>
                    </TabsList>

                    {/* Sent Messages */}
                    <TabsContent value="sent" className="space-y-4">
                      {sentMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No sent messages yet.
                        </p>
                      ) : (
                        sentMessages.map((msg, index) => (
                          <Card key={index} className="hover-scale transition-transform">
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold">To: {msg.to}</p>
                                  <p className="text-sm text-muted-foreground">{msg.subject}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm mt-3">{msg.content}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Received Replies */}
                    <TabsContent value="received" className="space-y-4">
                      {receivedReplies.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No replies received yet.
                        </p>
                      ) : (
                        receivedReplies.map((msg, index) => (
                          <Card key={index} className="hover-scale transition-transform">
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold">From: {msg.from}</p>
                                  <p className="text-sm text-muted-foreground">{msg.subject}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm mt-3">{msg.content}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  // Recruiter Inbox
                  <div className="space-y-4">
                    {recruiterInbox.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages from admin yet.
                      </p>
                    ) : (
                      recruiterInbox.map((message, index) => (
                        <Card key={index} className="hover-scale transition-transform">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">From: Admin</p>
                                <p className="text-sm text-muted-foreground">{message.subject}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(message.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-sm mt-3">{message.content}</p>
                            {!message.read && (
                              <Badge variant="secondary" className="mt-2">
                                New
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT SIDE - SEND MESSAGE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {isAdmin ? 'Send Message' : 'Reply to Admin'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient</label>
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>All Recruiters</span>
                          </div>
                        </SelectItem>
                        {recruiters.map((r) => (
                          <SelectItem key={r.username} value={r.username}>
                            {r.name} ({r.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Type your message..."
                    rows={8}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || (isAdmin && !recipient.trim())}
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
