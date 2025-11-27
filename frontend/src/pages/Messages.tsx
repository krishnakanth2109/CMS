import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Send, MessageSquare, Clock, Users, Inbox, User, Reply } from 'lucide-react';
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
  // Ensure useData provides messages array, sendMessage function, and recruiters list
  const { messages, sendMessage, recruiters } = useData(); 
  const { toast } = useToast();

  // State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('');

  const isAdmin = user?.role === 'admin';

  // --- FILTERING MESSAGES ---

  // 1. Messages sent BY Admin (to anyone)
  const sentMessages = messages.filter((m) => m.from === 'admin');

  // 2. Messages sent TO Admin (from recruiters)
  const receivedReplies = messages.filter((m) => m.to === 'admin' && m.from !== 'admin');

  // 3. Messages for the logged-in Recruiter (from Admin)
  const recruiterInbox = messages.filter((m) => m.to === user?.username && m.from === 'admin');

  // --- HANDLERS ---

  const handleSendMessage = () => {
    if (!content.trim() || !subject.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide both a subject and a message.",
      });
      return;
    }

    if (isAdmin && !recipient) {
      toast({
        variant: "destructive",
        title: "Recipient required",
        description: "Please select a recruiter to send the message to.",
      });
      return;
    }

    const timestamp = new Date().toISOString();

    if (isAdmin && recipient === 'all') {
      // Broadcast Logic
      recruiters.forEach((rec) =>
        sendMessage({
          from: 'admin',
          to: rec.username,
          subject: subject,
          content: content,
          timestamp: timestamp,
          read: false,
        })
      );
      toast({
        title: 'Broadcast Sent',
        description: `Message sent to ${recruiters.length} recruiters.`,
      });
    } else {
      // Direct Message Logic (Admin -> Single Recruiter OR Recruiter -> Admin)
      sendMessage({
        from: isAdmin ? 'admin' : user?.username || 'unknown',
        to: isAdmin ? recipient : 'admin',
        subject: subject,
        content: content,
        timestamp: timestamp,
        read: false,
      });

      toast({
        title: 'Message Sent',
        description: isAdmin 
          ? `Message sent to ${recipient}` 
          : 'Your reply has been sent to the Admin.',
      });
    }

    // Reset Form
    setSubject('');
    setContent('');
    setRecipient('');
  };

  // Helper to pre-fill reply subject
  const handleReplyClick = (originalSubject: string) => {
    setSubject(`Re: ${originalSubject}`);
    // Focus or scroll to input could go here
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
                ? 'Manage communications with your recruiting team.'
                : 'Stay updated with admin announcements and send replies.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- LEFT COLUMN: MESSAGE LISTS --- */}
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  {isAdmin ? 'Communication Center' : 'My Inbox'}
                </CardTitle>
                <CardDescription>
                  {isAdmin ? 'View sent broadcasts and incoming replies.' : 'Messages received from Admin.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  /* ADMIN VIEW TABS */
                  <Tabs defaultValue="received" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="received" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Inbox (Replies)
                      </TabsTrigger>
                      <TabsTrigger value="sent" className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Sent Messages
                      </TabsTrigger>
                    </TabsList>

                    {/* Admin: Received Replies */}
                    <TabsContent value="received" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {receivedReplies.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                          No replies from recruiters yet.
                        </div>
                      ) : (
                        receivedReplies.map((msg, index) => (
                          <Card key={index} className="border-l-4 border-l-primary/50">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="flex gap-1 items-center">
                                    <User className="h-3 w-3" /> {msg.from}
                                  </Badge>
                                  <span className="font-semibold">{msg.subject}</span>
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{msg.content}</p>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs text-primary"
                                onClick={() => {
                                  setRecipient(msg.from);
                                  handleReplyClick(msg.subject);
                                }}
                              >
                                <Reply className="h-3 w-3 mr-1" /> Reply Direct
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Admin: Sent Messages */}
                    <TabsContent value="sent" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {sentMessages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                          You haven't sent any messages yet.
                        </div>
                      ) : (
                        sentMessages.map((msg, index) => (
                          <Card key={index} className="opacity-80 hover:opacity-100 transition-opacity">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">To: </span>
                                  <Badge variant="secondary">{msg.to === 'all' ? 'Everyone' : msg.to}</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-medium text-sm mb-1">{msg.subject}</p>
                              <p className="text-sm text-muted-foreground">{msg.content}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  /* RECRUITER VIEW (INBOX ONLY) */
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {recruiterInbox.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                        Inbox is empty. No messages from Admin.
                      </div>
                    ) : (
                      recruiterInbox.map((message, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary">Admin</Badge>
                                <span className="font-semibold">{message.subject}</span>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(message.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mt-2 text-foreground/90 whitespace-pre-wrap">{message.content}</p>
                            <div className="mt-4 flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleReplyClick(message.subject)}
                              >
                                <Reply className="h-3 w-3 mr-2" /> Reply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* --- RIGHT COLUMN: COMPOSE FORM --- */}
            <Card className="h-fit shadow-md">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {isAdmin ? 'Compose Message' : 'Reply to Admin'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                
                {/* Recipient Selection (Admin Only) */}
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To:</label>
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2 font-semibold text-primary">
                            <Users className="h-4 w-4" />
                            <span>Broadcast to All Recruiters</span>
                          </div>
                        </SelectItem>
                        {recruiters.map((r) => (
                          <SelectItem key={r.username} value={r.username}>
                            {r.name} (@{r.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Subject Line */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject:</label>
                  <Input
                    placeholder={isAdmin ? "Meeting Update..." : "Re: ..."}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message:</label>
                  <Textarea
                    placeholder="Type your message here..."
                    className="min-h-[200px] resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* Send Button */}
                <Button
                  className="w-full gap-2 mt-2"
                  onClick={handleSendMessage}
                  disabled={!content.trim() || !subject.trim() || (isAdmin && !recipient)}
                >
                  <Send className="h-4 w-4" />
                  {isAdmin ? 'Send Message' : 'Send Reply'}
                </Button>

                {!isAdmin && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Your message will be sent directly to the Administrator.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}