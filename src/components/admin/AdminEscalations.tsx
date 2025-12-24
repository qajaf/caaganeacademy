import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Loader2, 
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string | null;
  is_escalated: boolean;
  escalation_reason: string | null;
  is_resolved: boolean;
  admin_response: string | null;
  created_at: string;
}

interface Profile {
  full_name: string;
  email: string;
}

const AdminEscalations = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [responding, setResponding] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchEscalatedMessages();
  }, []);

  const fetchEscalatedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("is_escalated", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Fetch user profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        if (profilesData) {
          const profileMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profileMap[p.user_id] = { full_name: p.full_name, email: p.email };
          });
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load escalated messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !adminResponse.trim()) return;

    setResponding(true);
    try {
      const { error } = await supabase
        .from("chatbot_messages")
        .update({
          admin_response: adminResponse,
          is_resolved: true,
        })
        .eq("id", selectedMessage.id);

      if (error) throw error;

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: selectedMessage.user_id,
        title: "Admin-ka wuu kuugu jawaabay",
        message: adminResponse.substring(0, 200) + (adminResponse.length > 200 ? "..." : ""),
      });

      toast({
        title: "Success",
        description: "Response sent to user",
      });

      setSelectedMessage(null);
      setAdminResponse("");
      fetchEscalatedMessages();
    } catch (error) {
      console.error("Error responding:", error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unresolvedCount = messages.filter(m => !m.is_resolved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Chatbot Escalations</h1>
          <p className="text-muted-foreground">
            Su'aalaha chatbot-ku aanu ka jawaabi karin
          </p>
        </div>
        {unresolvedCount > 0 && (
          <Badge variant="destructive" className="px-4 py-2 text-lg">
            {unresolvedCount} Unresolved
          </Badge>
        )}
      </div>

      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-12 text-center"
        >
          <MessageCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan escalations</h2>
          <p className="text-muted-foreground">
            Dhammaan su'aalaha chatbot-ku wuu ka jawaabay
          </p>
        </motion.div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>
                    {msg.is_resolved ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{profiles[msg.user_id]?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{profiles[msg.user_id]?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{msg.message}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(msg.created_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMessage(msg);
                        setAdminResponse(msg.admin_response || "");
                      }}
                    >
                      {msg.is_resolved ? "View" : "Respond"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escalated Question</DialogTitle>
            <DialogDescription>
              Review and respond to the user's question
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">From:</p>
                <p className="font-medium">
                  {profiles[selectedMessage.user_id]?.full_name} ({profiles[selectedMessage.user_id]?.email})
                </p>
              </div>

              {/* User's Question */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">User's Question:</p>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p>{selectedMessage.message}</p>
                </div>
              </div>

              {/* AI's Response */}
              {selectedMessage.response && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">AI's Response:</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{selectedMessage.response}</p>
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedMessage.is_resolved && selectedMessage.admin_response ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Response:</p>
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <p>{selectedMessage.admin_response}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Response:</p>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Qor jawaabta user-ka..."
                    rows={4}
                  />
                  <Button
                    onClick={handleRespond}
                    disabled={!adminResponse.trim() || responding}
                    className="mt-3 w-full gap-2"
                  >
                    {responding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Response
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEscalations;