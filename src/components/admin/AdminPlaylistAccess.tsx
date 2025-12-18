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
  ListMusic,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
}

interface Playlist {
  id: string;
  title: string;
  course_id: string;
}

interface StudentAccess {
  id: string;
  user_id: string;
  playlist_id: string;
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

const AdminPlaylistAccess = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
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
      fetchPlaylists(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistAccess(selectedPlaylist);
    }
  }, [selectedPlaylist]);

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

  const fetchPlaylists = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, title, course_id")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPlaylists(data || []);
      if (data && data.length > 0) {
        setSelectedPlaylist(data[0].id);
      } else {
        setSelectedPlaylist("");
        setStudentAccess([]);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
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

  const fetchPlaylistAccess = async (playlistId: string) => {
    setLoadingAccess(true);
    try {
      const { data, error } = await supabase
        .from("student_playlist_access")
        .select(`
          id,
          user_id,
          playlist_id,
          is_approved
        `)
        .eq("playlist_id", playlistId);

      if (error) throw error;

      const accessWithProfiles = (data || []).map((access) => {
        const profile = allStudents.find(p => p.user_id === access.user_id);
        return {
          ...access,
          profile: profile ? { full_name: profile.full_name, email: profile.email } : null
        };
      });

      setStudentAccess(accessWithProfiles);
    } catch (error) {
      console.error("Error fetching playlist access:", error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const toggleAccess = async (accessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("student_playlist_access")
        .update({ is_approved: !currentStatus })
        .eq("id", accessId);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `Playlist access ${!currentStatus ? "approved" : "revoked"}` 
      });
      
      fetchPlaylistAccess(selectedPlaylist);
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
        .from("student_playlist_access")
        .insert({
          user_id: userId,
          playlist_id: selectedPlaylist,
          is_approved: true,
        });

      if (error) throw error;
      
      toast({ title: "Success", description: "Playlist access granted" });
      fetchPlaylistAccess(selectedPlaylist);
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Maamulka Fasaxa Playlist</h1>
          <p className="text-muted-foreground">U oggolow ardayda inay galaan playlists gaar ah</p>
        </div>
      </motion.div>

      {courses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border p-12 text-center"
        >
          <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Courses</h2>
          <p className="text-muted-foreground">Samee courses marka hore</p>
        </motion.div>
      ) : (
        <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4 mb-6"
          >
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

            <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Dooro Playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {!selectedPlaylist ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border p-12 text-center"
            >
              <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Dooro Playlist</h2>
              <p className="text-muted-foreground">Course-kan ma laha playlists</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Students with Access */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
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
                    Ma jiraan arday fasax leh playlist-kan
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
                      {studentAccess.map((access, index) => (
                        <motion.tr
                          key={access.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border"
                        >
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
                              className="transition-all hover:scale-105"
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
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </motion.div>

              {/* Add Students */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
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
                    {studentsWithoutAccess.map((student, index) => (
                      <motion.div
                        key={student.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => grantAccessToStudent(student.user_id)}
                          className="transition-all hover:scale-105"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Ogolow
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPlaylistAccess;