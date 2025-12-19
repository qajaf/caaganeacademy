import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Trash2,
  Heart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  country: string | null;
  city: string | null;
  language_level: string | null;
  learning_duration_months: number | null;
  is_approved: boolean;
  subscription_status: string | null;
  referral_source: string | null;
  likes_english: boolean | null;
  created_at: string;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (student: Student) => {
    setUpdating(student.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: !student.is_approved })
        .eq("id", student.id);

      if (error) throw error;

      setStudents(students.map((s) =>
        s.id === student.id ? { ...s, is_approved: !s.is_approved } : s
      ));

      toast({
        title: student.is_approved ? "Student Blocked" : "Student Approved",
        description: `${student.full_name} has been ${student.is_approved ? "blocked" : "approved"}.`,
      });
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    setDeleting(student.id);
    try {
      // Delete profile (this will cascade and remove user data)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", student.id);

      if (profileError) throw profileError;

      // Remove from local state
      setStudents(students.filter((s) => s.id !== student.id));
      setStudentToDelete(null);

      toast({
        title: "Arday la tirtiray",
        description: `${student.full_name} waa la tirtiray.`,
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadge = (level: string | null) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      elementary: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      upper_intermediate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    };
    return colors[level || "beginner"] || colors.beginner;
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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Maamulka Ardayda</h1>
        <p className="text-muted-foreground">Arag dhammaan ardayda, ansixiso ama ka jooji</p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Raadi arday... (magaca ama email)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dhammaan</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">La Ansixiyay</p>
            <p className="text-2xl font-bold">{students.filter((s) => s.is_approved).length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <UserX className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sugaya</p>
            <p className="text-2xl font-bold">{students.filter((s) => !s.is_approved).length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Magaca</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Heerka</TableHead>
              <TableHead>Xaalada</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Ma jiraan arday la helay
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0"
                >
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell>
                    <Badge className={getLevelBadge(student.language_level)}>
                      {student.language_level?.replace("_", " ") || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.is_approved ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-accent/10 text-accent border-accent/20">
                        <XCircle className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={student.is_approved ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleApproval(student)}
                        disabled={updating === student.id}
                      >
                        {updating === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : student.is_approved ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" /> Block
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" /> Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStudentToDelete(student)}
                        disabled={deleting === student.id}
                      >
                        {deleting === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.full_name}</DialogTitle>
            <DialogDescription>Faahfaahinta ardayga</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{selectedStudent.whatsapp_number || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {selectedStudent.city || "N/A"}, {selectedStudent.country || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Heerka Luuqadda</p>
                  <p className="font-medium capitalize">
                    {selectedStudent.language_level?.replace("_", " ") || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Muddo Baran jiray</p>
                  <p className="font-medium">
                    {selectedStudent.learning_duration_months || 0} bilood
                  </p>
                </div>
              </div>
              {selectedStudent.referral_source && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Yaa kula soo wadaagay</p>
                    <p className="font-medium">{selectedStudent.referral_source}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ma jeceshahay English?</p>
                  <p className="font-medium">
                    {selectedStudent.likes_english === null 
                      ? "N/A" 
                      : selectedStudent.likes_english 
                        ? "Haa" 
                        : "Maya"}
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                variant={selectedStudent.is_approved ? "destructive" : "default"}
                onClick={() => {
                  toggleApproval(selectedStudent);
                  setSelectedStudent(null);
                }}
              >
                {selectedStudent.is_approved ? "Block Student" : "Approve Student"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa inaad tirtireyso?</AlertDialogTitle>
            <AlertDialogDescription>
              Ardaygan "{studentToDelete?.full_name}" waa la tirtiri doonaa. 
              Tani waa mid aan laga noqon karin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ka noqo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studentToDelete && handleDeleteStudent(studentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Haa, Tirtir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStudents;
