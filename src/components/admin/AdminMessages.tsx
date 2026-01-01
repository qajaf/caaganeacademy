import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
  Send,
  Mail,
  MessageSquare,
  Loader2,
  Users,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
}

interface Course {
  id: string;
  title: string;
}

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  message_type: string;
  target_type: string;
  is_sent: boolean;
  sent_via: string[];
  created_at: string;
  sent_at: string | null;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "all",
    send_email: true,
    send_whatsapp: false,
    selected_course_id: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesRes, studentsRes, coursesRes] = await Promise.all([
        supabase.from("admin_messages").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, user_id, full_name, email, whatsapp_number"),
        supabase.from("courses").select("id, title"),
      ]);

      if (messagesRes.error) throw messagesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setMessages(messagesRes.data || []);
      setStudents(studentsRes.data || []);
      setCourses(coursesRes.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);

    try {
      const sentVia: string[] = [];
      if (formData.send_email) sentVia.push("email");
      if (formData.send_whatsapp) sentVia.push("whatsapp");

      // Determine target students
      let targetStudents: Student[] = [];
      if (formData.target_type === "all") {
        targetStudents = students;
      } else if (formData.target_type === "selected") {
        targetStudents = students.filter((s) => selectedStudents.includes(s.user_id));
      } else if (formData.target_type === "course" && formData.selected_course_id) {
        // Get students with access to this course
        const { data: accessData } = await supabase
          .from("student_course_access")
          .select("user_id")
          .eq("course_id", formData.selected_course_id)
          .eq("is_approved", true);
        
        const userIds = accessData?.map((a) => a.user_id) || [];
        targetStudents = students.filter((s) => userIds.includes(s.user_id));
      }

      // Save message record
      const { data: messageData, error: msgError } = await supabase
        .from("admin_messages")
        .insert({
          title: formData.title,
          message: formData.message,
          message_type: "notification",
          target_type: formData.target_type,
          target_user_ids: targetStudents.map((s) => s.user_id),
          target_course_id: formData.selected_course_id || null,
          sent_via: sentVia,
          is_sent: true,
          sent_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Create notifications for each student
      const notifications = targetStudents.map((student) => ({
        user_id: student.user_id,
        title: formData.title,
        message: formData.message,
      }));

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (notifError) console.error("Notification error:", notifError);
      }

      // If WhatsApp is selected, open WhatsApp links
      if (formData.send_whatsapp) {
        const encodedMessage = encodeURIComponent(`${formData.title}\n\n${formData.message}`);
        targetStudents.forEach((student) => {
          if (student.whatsapp_number) {
            const cleanNumber = student.whatsapp_number.replace(/\D/g, "");
            window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, "_blank");
          }
        });
      }

      toast({
        title: "Fariin la diray!",
        description: `Fariinta waxaa loo diray ${targetStudents.length} arday`,
      });

      setDialogOpen(false);
      setFormData({
        title: "",
        message: "",
        target_type: "all",
        send_email: true,
        send_whatsapp: false,
        selected_course_id: "",
      });
      setSelectedStudents([]);
      fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const toggleStudentSelection = (userId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.user_id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Fariimaha Ardayda</h1>
          <p className="text-muted-foreground">U dir fariin dhammaan ardayda ama qaar gaar ah</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Fariin Cusub
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>U dir Fariin Ardayda</DialogTitle>
              <DialogDescription>
                Dooro ardayda aad rabto inaad u dirto fariinta
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Cinwaanka Fariinta *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tusaale: Cashar cusub ayaa la soo rogay!"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Fariinta *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Qor fariintaada halkan..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Yaa loo dirayo?</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value) => setFormData({ ...formData, target_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Dhammaan Ardayda ({students.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="selected">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Arday Gaar ah
                      </div>
                    </SelectItem>
                    <SelectItem value="course">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Ardayda Course gaar ah
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_type === "course" && (
                <div>
                  <Label>Dooro Course</Label>
                  <Select
                    value={formData.selected_course_id}
                    onValueChange={(value) => setFormData({ ...formData, selected_course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dooro course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_type === "selected" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dooro Ardayda</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllStudents}
                    >
                      {selectedStudents.length === students.length ? "Unselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {students.map((student) => (
                      <label
                        key={student.user_id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.user_id)}
                          onCheckedChange={() => toggleStudentSelection(student.user_id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedStudents.length} arday la doortay
                  </p>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-3">
                <Label>Sidee loo dirayo?</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.send_email}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, send_email: checked as boolean })
                      }
                    />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">In-App Notification</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.send_whatsapp}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, send_whatsapp: checked as boolean })
                      }
                    />
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">WhatsApp</span>
                  </label>
                </div>
                {formData.send_whatsapp && (
                  <p className="text-xs text-muted-foreground">
                    WhatsApp wuxuu furan doonaa tab cusub arday kasta oo WhatsApp number leh
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waa la dirayaa...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Dir Fariinta
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fariimo La Diray</p>
            <p className="text-2xl font-bold">{messages.filter((m) => m.is_sent).length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dhammaan Ardayda</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">WhatsApp Numbers</p>
            <p className="text-2xl font-bold">{students.filter((s) => s.whatsapp_number).length}</p>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cinwaanka</TableHead>
              <TableHead>Nooca</TableHead>
              <TableHead>Sidee</TableHead>
              <TableHead>Xaalada</TableHead>
              <TableHead>Taariikhda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Wali ma jiraan fariimo la diray
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message, index) => (
                <motion.tr
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0"
                >
                  <TableCell className="font-medium">{message.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {message.target_type === "all" ? "Dhammaan" : message.target_type === "selected" ? "Gaar ah" : "Course"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {message.sent_via?.includes("email") && (
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      )}
                      {message.sent_via?.includes("whatsapp") && (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.is_sent ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="w-3 h-3 mr-1" /> La diray
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" /> Sugaya
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString("so-SO")}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminMessages;