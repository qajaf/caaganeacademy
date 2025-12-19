import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Send, 
  Loader2, 
  Users, 
  User,
  Trash2,
  Plus
} from "lucide-react";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient: "all",
    selectedStudent: "",
    title: "",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .order("full_name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.recipient === "single" && !formData.selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      if (formData.recipient === "all") {
        // Send to all students
        const notificationsToInsert = students.map((student) => ({
          user_id: student.user_id,
          title: formData.title,
          message: formData.message,
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(notificationsToInsert);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Notification sent to ${students.length} students`,
        });
      } else {
        // Send to single student
        const { error } = await supabase
          .from("notifications")
          .insert({
            user_id: formData.selectedStudent,
            title: formData.title,
            message: formData.message,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Notification sent successfully",
        });
      }

      setFormData({
        recipient: "all",
        selectedStudent: "",
        title: "",
        message: "",
      });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast({
        title: "Deleted",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getStudentName = (userId: string) => {
    const student = students.find((s) => s.user_id === userId);
    return student?.full_name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground">U dir fariimaha ardayda</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Fariiin Cusub
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dir Fariiin</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Recipient Selection */}
              <div className="space-y-2">
                <Label>U dir</Label>
                <Select
                  value={formData.recipient}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recipient: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Dhammaan Ardayda
                      </div>
                    </SelectItem>
                    <SelectItem value="single">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Arday Gaar ah
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection (if single) */}
              {formData.recipient === "single" && (
                <div className="space-y-2">
                  <Label>Dooro Arday</Label>
                  <Select
                    value={formData.selectedStudent}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, selectedStudent: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dooro arday..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id}>
                          {student.full_name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Cinwaanka</Label>
                <Input
                  placeholder="Cinwaanka fariinta..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Fariinta</Label>
                <Textarea
                  placeholder="Qor fariintaada..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                />
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={handleSendNotification}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Waa la dirayaa...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Dir Fariinta
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total Notifications</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notifications.filter((n) => !n.is_read).length}
              </p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notifications Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arday</TableHead>
              <TableHead>Cinwaan</TableHead>
              <TableHead>Fariinta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Taariikhda</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Ma jiraan fariimo la diray
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">
                    {getStudentName(notification.user_id)}
                  </TableCell>
                  <TableCell>{notification.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        notification.is_read
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {notification.is_read ? "Read" : "Unread"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminNotifications;
