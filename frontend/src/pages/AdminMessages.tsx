import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MessageSquare, Clock, Users, User, Reply, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

let socket: any;

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [messages, setMessages] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('');

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // 1. Initialize Socket & Fetch Data
  useEffect(() => {
    // Socket Connection
    socket = io(SOCKET_URL);
    socket.emit('join_room', 'admin'); // Admin joins 'admin' room

    // Listen for incoming messages
    socket.on('receive_message', (newMessage: any) => {
      setMessages((prev) => [newMessage, ...prev]);
      toast({ title: "New Message", description: `From ${newMessage.from}` });
    });

    const fetchData = async () => {
      try {
        const [msgRes, recRes] = await Promise.all([
          fetch(`${API_URL}/messages`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() })
        ]);

        if(msgRes.ok) setMessages(await msgRes.json());
        if(recRes.ok) setRecruiters(await recRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, []);

  // 2. Handlers
  const handleSendMessage = async () => {
    if (!content.trim() || !subject.trim() || !recipient) {
      toast({ title: "Error", description: "All fields required", variant: "destructive" });
      return;
    }

    const newMessage = {
      from: 'admin',
      to: recipient,
      subject,
      content,
      createdAt: new Date().toISOString(), // Optimistic UI
      read: false
    };

    try {
      // Save to DB
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(newMessage)
      });

      if (res.ok) {
        const savedMsg = await res.json();
        // Emit Socket Event
        socket.emit('send_message', savedMsg);
        
        // Update UI
        setMessages((prev) => [savedMsg, ...prev]);
        setSubject('');
        setContent('');
        setRecipient('');
        toast({ title: "Sent", description: "Message sent successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send", variant: "destructive" });
    }
  };

  const receivedReplies = messages.filter(m => m.to === 'admin' && m.from !== 'admin');
  const sentMessages = messages.filter(m => m.from === 'admin');

  if(loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Admin Communications</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* INBOX / SENT TABS */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
              <CardContent>
                <Tabs defaultValue="inbox">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="inbox">Inbox ({receivedReplies.length})</TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                  </TabsList>

                  <TabsContent value="inbox" className="space-y-4 max-h-[600px] overflow-y-auto">
                    {receivedReplies.map((msg, i) => (
                      <Card key={i} className="border-l-4 border-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex justify-between mb-2">
                            <Badge variant="outline"><User className="w-3 h-3 mr-1"/> {msg.from}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="font-bold text-sm">{msg.subject}</p>
                          <p className="text-sm mt-1 text-gray-600">{msg.content}</p>
                          <Button variant="ghost" size="sm" className="mt-2 h-8" onClick={() => { setRecipient(msg.from); setSubject(`Re: ${msg.subject}`); }}>
                             <Reply className="w-3 h-3 mr-1"/> Reply
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="sent" className="space-y-4 max-h-[600px] overflow-y-auto">
                    {sentMessages.map((msg, i) => (
                      <Card key={i} className="bg-gray-50/50">
                        <CardContent className="pt-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-xs">To: <Badge variant="secondary">{msg.to === 'all' ? 'Everyone' : msg.to}</Badge></span>
                            <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="font-bold text-sm">{msg.subject}</p>
                          <p className="text-sm text-gray-600">{msg.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* COMPOSE */}
            <Card>
              <CardHeader><CardTitle>Compose</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"><Users className="w-4 h-4 inline mr-2"/> Everyone</SelectItem>
                      {recruiters.map(r => (
                        // Use recruiter ID for robust socket delivery
                        <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} className="min-h-[150px]" />
                </div>
                <Button className="w-full" onClick={handleSendMessage} disabled={!content || !recipient}>
                  <Send className="w-4 h-4 mr-2"/> Send
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}