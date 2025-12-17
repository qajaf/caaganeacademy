import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  PlayCircle,
  Search,
  Loader2,
} from "lucide-react";

interface StudentProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  watched_seconds: number;
  video_stop_second: number;
  video_duration_seconds: number;
  last_watched_at: string;
  lesson?: {
    title: string;
    duration_minutes: number;
    playlist?: {
      title: string;
      course?: {
        title: string;
      };
    };
  };
  profile?: {
    full_name: string;
    email: string;
  };
}

interface StudentSummary {
  user_id: string;
  full_name: string;
  email: string;
  total_lessons_watched: number;
  completed_lessons: number;
  total_watch_time_minutes: number;
  progress_items: StudentProgress[];
}

const AdminStudentProgress = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      // Get all progress with lesson and profile info
      const { data: progressData, error: progressError } = await supabase
        .from("student_progress")
        .select(`
          *,
          profiles!student_progress_user_id_fkey (full_name, email)
        `)
        .order("last_watched_at", { ascending: false });

      if (progressError) throw progressError;

      // Get lesson info separately
      const lessonIds = [...new Set((progressData || []).map(p => p.lesson_id))];
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select(`
          id, title, duration_minutes,
          playlists!lessons_playlist_id_fkey (title, course_id, courses (title))
        `)
        .in("id", lessonIds);

      const lessonsMap = new Map((lessonsData || []).map(l => [l.id, l]));

      // Group by student
      const studentMap = new Map<string, StudentSummary>();
      
      (progressData || []).forEach((p: any) => {
        const lesson = lessonsMap.get(p.lesson_id);
        const progressItem: StudentProgress = {
          ...p,
          lesson: lesson ? {
            title: lesson.title,
            duration_minutes: lesson.duration_minutes,
            playlist: lesson.playlists ? {
              title: lesson.playlists.title,
              course: lesson.playlists.courses ? {
                title: lesson.playlists.courses.title
              } : undefined
            } : undefined
          } : undefined,
          profile: p.profiles
        };

        if (!studentMap.has(p.user_id)) {
          studentMap.set(p.user_id, {
            user_id: p.user_id,
            full_name: p.profiles?.full_name || "Unknown",
            email: p.profiles?.email || "",
            total_lessons_watched: 0,
            completed_lessons: 0,
            total_watch_time_minutes: 0,
            progress_items: []
          });
        }

        const student = studentMap.get(p.user_id)!;
        student.progress_items.push(progressItem);
        student.total_lessons_watched++;
        if (p.is_completed) student.completed_lessons++;
        student.total_watch_time_minutes += Math.round((p.watched_seconds || 0) / 60);
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{selectedStudent.full_name}</h1>
            <p className="text-muted-foreground">{selectedStudent.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Casharada La Daawade</p>
            <p className="text-2xl font-bold">{selectedStudent.total_lessons_watched}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Dhamaystiray</p>
            <p className="text-2xl font-bold text-success">{selectedStudent.completed_lessons}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Waqtiga Guud (daqiiqo)</p>
            <p className="text-2xl font-bold">{selectedStudent.total_watch_time_minutes}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Casharada La Daawade</h2>
        <div className="space-y-3">
          {selectedStudent.progress_items.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.lesson?.title || "Unknown Lesson"}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.lesson?.playlist?.course?.title} → {p.lesson?.playlist?.title}
                  </p>
                </div>
                <div className="text-right">
                  {p.is_completed ? (
                    <span className="inline-flex items-center gap-1 text-success text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Dhamaystiray
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      <PlayCircle className="w-4 h-4 inline mr-1" />
                      Joojiyay: {formatTime(p.video_stop_second || 0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Daawadaha: {formatTime(p.watched_seconds || 0)}
                </span>
                <span>|</span>
                <span>
                  Last: {new Date(p.last_watched_at).toLocaleDateString('so-SO')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Progress-ka Ardayda</h1>
        <p className="text-muted-foreground">Eeg ardaykasta intee u socoto casharadiisa</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Raadi arday..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Progress</h2>
          <p className="text-muted-foreground">Ardaydunka weli ma daawin cashar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg">{student.total_lessons_watched}</p>
                  <p className="text-muted-foreground">Daawade</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-success">{student.completed_lessons}</p>
                  <p className="text-muted-foreground">Dhamaystiray</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{student.total_watch_time_minutes}</p>
                  <p className="text-muted-foreground">Daqiiqo</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStudentProgress;
