import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  Check,
  X,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
}

interface StudentAccess {
  id: string;
  user_id: string;
  course_id: string;
  is_approved: boolean;
  profile: {
    full_name: string;
    email: string;
  } | null;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

const AdminCourseAccess = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [studentAccess, setStudentAccess] = useState<StudentAccess[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAccess(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setAllStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchCourseAccess = async (courseId: string) => {
    setLoadingAccess(true);
    try {
      const { data, error } = await supabase
        .from("student_course_access")
        .select(`
          id,
          user_id,
          course_id,
          is_approved
        `)
        .eq("course_id", courseId);

      if (error) throw error;

      // Get profiles for each access record
      const accessWithProfiles = await Promise.all(
        (data || []).map(async (access) => {
          const profile = allStudents.find(p => p.user_id === access.user_id);
          return {
            ...access,
            profile: profile ? { full_name: profile.full_name, email: profile.email } : null
          };
        })
      );

      setStudentAccess(accessWithProfiles);
    } catch (error) {
      console.error("Error fetching course access:", error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const toggleAccess = async (accessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("student_course_access")
        .update({ is_approved: !currentStatus })
        .eq("id", accessId);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `Student access ${!currentStatus ? "approved" : "revoked"}` 
      });
      
      fetchCourseAccess(selectedCourse);
    } catch (error) {
      console.error("Error updating access:", error);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
    }
  };

  const grantAccessToStudent = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("student_course_access")
        .upsert({
          user_id: userId,
          course_id: selectedCourse,
          is_approved: true,
        }, { onConflict: "user_id,course_id" });

      if (error) throw error;
      
      toast({ title: "Success", description: "Access granted to student" });
      fetchCourseAccess(selectedCourse);
    } catch (error) {
      console.error("Error granting access:", error);
      toast({
        title: "Error",
        description: "Failed to grant access",
        variant: "destructive",
      });
    }
  };

  const studentsWithoutAccess = allStudents.filter(
    student => !studentAccess.some(access => access.user_id === student.user_id)
  );

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
          <h1 className="text-3xl font-display font-bold mb-2">Maamulka Fasaxa Course</h1>
          <p className="text-muted-foreground">U oggolow ardayda inay galaan courses gaar ah</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Courses</h2>
          <p className="text-muted-foreground">Samee courses marka hore</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Dooro Course" />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Students with Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ardayda Fasax leh ({studentAccess.length})
              </h3>
              
              {loadingAccess ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : studentAccess.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Ma jiraan arday fasax leh course-kan
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Magaca</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAccess.map((access) => (
                      <TableRow key={access.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{access.profile?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{access.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            access.is_approved
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}>
                            {access.is_approved ? "Approved" : "Pending"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={access.is_approved ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleAccess(access.id, access.is_approved)}
                          >
                            {access.is_approved ? (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Ka saar
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Ogolow
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </motion.div>

            {/* Add Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ku dar Arday Cusub ({studentsWithoutAccess.length})
              </h3>
              
              {studentsWithoutAccess.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Dhammaan ardayda waxay haystaan fasax
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {studentsWithoutAccess.map((student) => (
                    <div
                      key={student.user_id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => grantAccessToStudent(student.user_id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Ogolow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCourseAccess;
