import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Loader2,
  Lock,
  Play,
  ChevronRight,
  ArrowLeft,
  Clock,
  FileText,
  Download,
  LogOut,
  CheckCircle,
  Circle,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingContact from "@/components/layout/FloatingContact";
import StudentChatbot from "@/components/chat/StudentChatbot";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface Profile {
  is_approved: boolean;
  full_name: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
}

interface CourseAccess {
  course_id: string;
  is_approved: boolean;
}

interface PlaylistAccess {
  playlist_id: string;
  is_approved: boolean;
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
}

interface PlaylistWithCount extends Playlist {
  lesson_count: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  order_index: number;
  is_locked: boolean | null;
  unlock_date: string | null;
}

interface LessonResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
}

interface LessonNote {
  id: string;
  content: string;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
}

const Courses = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseAccess, setCourseAccess] = useState<CourseAccess[]>([]);
  const [playlistAccess, setPlaylistAccess] = useState<PlaylistAccess[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_approved, full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch published courses
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCourses(coursesData || []);

      // Fetch course access
      const { data: accessData } = await supabase
        .from("student_course_access")
        .select("course_id, is_approved")
        .eq("user_id", user!.id);

      setCourseAccess(accessData || []);

      // Fetch playlist access
      const { data: playlistAccessData } = await supabase
        .from("student_playlist_access")
        .select("playlist_id, is_approved")
        .eq("user_id", user!.id);

      setPlaylistAccess(playlistAccessData || []);

      // Fetch lesson progress
      const { data: progressData } = await supabase
        .from("student_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user!.id);

      setLessonProgress(progressData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasCourseAccess = (courseId: string) => {
    const access = courseAccess.find(a => a.course_id === courseId);
    return access?.is_approved === true;
  };

  const hasPlaylistAccess = (playlistId: string) => {
    const access = playlistAccess.find(a => a.playlist_id === playlistId);
    return access?.is_approved === true;
  };

  const isLessonCompleted = (lessonId: string) => {
    const progress = lessonProgress.find(p => p.lesson_id === lessonId);
    return progress?.is_completed === true;
  };

  const isLessonLocked = (lesson: Lesson) => {
    // Check if lesson is locked by admin
    if (lesson.is_locked) {
      // Check if unlock_date has passed
      if (lesson.unlock_date) {
        const unlockDate = new Date(lesson.unlock_date);
        const now = new Date();
        return now < unlockDate;
      }
      return true; // Locked with no unlock date
    }
    return false;
  };

  const getUnlockDateText = (lesson: Lesson) => {
    if (!lesson.unlock_date) return null;
    const unlockDate = new Date(lesson.unlock_date);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return unlockDate.toLocaleDateString('so-SO', options);
  };

  const canAccessLesson = (lesson: Lesson, index: number) => {
    // Check if lesson is locked by admin
    if (isLessonLocked(lesson)) {
      return false;
    }
    
    // First lesson is always accessible if user has playlist access and not locked
    if (index === 0) return true;
    
    // For other lessons, check if previous lesson is completed
    const previousLesson = lessons[index - 1];
    if (previousLesson) {
      return isLessonCompleted(previousLesson.id);
    }
    return false;
  };

  const fetchPlaylists = async (courseId: string) => {
    setLoadingPlaylists(true);
    try {
      // Fetch playlists
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Fetch lesson counts for each playlist
      const playlistsWithCounts: PlaylistWithCount[] = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id)
            .eq("is_published", true);
          
          return {
            ...playlist,
            lesson_count: count || 0,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const fetchLessons = async (playlistId: string) => {
    setLoadingLessons(true);
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("playlist_id", playlistId)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const fetchLessonDetails = async (lessonId: string) => {
    try {
      const [resourcesRes, notesRes] = await Promise.all([
        supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId),
        supabase.from("lesson_notes").select("*").eq("lesson_id", lessonId),
      ]);

      setResources(resourcesRes.data || []);
      setNotes(notesRes.data || []);
    } catch (error) {
      console.error("Error fetching lesson details:", error);
    }
  };

  const markLessonComplete = async () => {
    if (!selectedLesson || !user) return;
    
    setMarkingComplete(true);
    try {
      // Check if progress exists
      const { data: existing } = await supabase
        .from("student_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", selectedLesson.id)
        .maybeSingle();

      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from("student_progress")
          .update({ 
            is_completed: true, 
            completed_at: new Date().toISOString() 
          })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Create new progress
        const { error } = await supabase
          .from("student_progress")
          .insert({
            user_id: user.id,
            lesson_id: selectedLesson.id,
            is_completed: true,
            completed_at: new Date().toISOString(),
          });
        
        if (error) throw error;
      }

      // Update local state
      setLessonProgress(prev => {
        const existing = prev.find(p => p.lesson_id === selectedLesson.id);
        if (existing) {
          return prev.map(p => 
            p.lesson_id === selectedLesson.id ? { ...p, is_completed: true } : p
          );
        }
        return [...prev, { lesson_id: selectedLesson.id, is_completed: true }];
      });

      toast({
        title: "Casharka waa la dhamaystay!",
        description: "Casharka ku xiga ayaa furan yahay",
      });
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      toast({
        title: "Error",
        description: "Ma suurtogelin in la dhamaystiro casharka",
        variant: "destructive",
      });
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    fetchPlaylists(course.id);
  };

  const handlePlaylistClick = (playlist: PlaylistWithCount) => {
    if (!selectedCourse) return;
    
    // Check both course and playlist access
    const hasCourse = hasCourseAccess(selectedCourse.id);
    const hasPlaylist = hasPlaylistAccess(playlist.id);
    
    if (!hasCourse || !hasPlaylist) {
      toast({
        title: "U baahan tahay lacag bixin",
        description: "Si aad u daawato casharada, la xiriir WhatsApp: +252711983546",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlaylist(playlist);
    fetchLessons(playlist.id);
  };

  const handleLessonClick = (lesson: Lesson, index: number) => {
    if (!selectedCourse || !selectedPlaylist) return;
    
    const hasCourse = hasCourseAccess(selectedCourse.id);
    const hasPlaylist = hasPlaylistAccess(selectedPlaylist.id);
    
    if (!hasCourse || !hasPlaylist) {
      toast({
        title: "U baahan tahay lacag bixin",
        description: "Si aad u daawato casharada, la xiriir WhatsApp: +252711983546",
        variant: "destructive",
      });
      return;
    }

    // Check if lesson is locked by admin
    if (isLessonLocked(lesson)) {
      const unlockDateText = getUnlockDateText(lesson);
      toast({
        title: "Casharka waa xiran yahay",
        description: unlockDateText 
          ? `Casharkaan wuxuu furnaanayaa: ${unlockDateText}` 
          : "Macalinka ayaa xiraya casharkaan. La xiriir admin-ka.",
        variant: "destructive",
      });
      return;
    }

    // Check if lesson is accessible (first lesson or previous completed)
    if (!canAccessLesson(lesson, index)) {
      toast({
        title: "Casharka weli ma furan yahay",
        description: "Fadlan dhamaystir casharka ka horeeyey si aad u furto kan",
        variant: "destructive",
      });
      return;
    }

    setSelectedLesson(lesson);
    fetchLessonDetails(lesson.id);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBack = () => {
    if (selectedLesson) {
      setSelectedLesson(null);
    } else if (selectedPlaylist) {
      setSelectedPlaylist(null);
      setLessons([]);
    } else if (selectedCourse) {
      setSelectedCourse(null);
      setPlaylists([]);
    } else {
      navigate(-1);
    }
  };

  const getVideoEmbed = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("/").pop()
        : url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentCourseHasAccess = selectedCourse ? hasCourseAccess(selectedCourse.id) : false;
  const currentPlaylistHasAccess = selectedPlaylist ? hasPlaylistAccess(selectedPlaylist.id) : false;
  const hasFullAccess = currentCourseHasAccess && currentPlaylistHasAccess;

  // Lesson View with enhanced animations
  if (selectedLesson && hasFullAccess) {
    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    const isCurrentLessonCompleted = isLessonCompleted(selectedLesson.id);
    const nextLesson = lessons[currentLessonIndex + 1];

    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Casharada
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Secure Video Player - No download, no link copy */}
            {selectedLesson.video_url && (
              <div className="mb-6">
                <SecureVideoPlayer 
                  videoUrl={selectedLesson.video_url}
                  title={selectedLesson.title}
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-display font-bold mb-2">{selectedLesson.title}</h1>
              {selectedLesson.description && (
                <p className="text-muted-foreground mb-6">{selectedLesson.description}</p>
              )}
            </motion.div>

            {/* Mark Complete Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              {isCurrentLessonCompleted ? (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-xl"
                >
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div className="flex-1">
                    <p className="font-semibold text-success">Casharka waa la dhamaystay!</p>
                    {nextLesson && (
                      <p className="text-sm text-muted-foreground">
                        Casharka ku xiga: {nextLesson.title}
                      </p>
                    )}
                  </div>
                  {nextLesson && (
                    <Button 
                      onClick={() => handleLessonClick(nextLesson, currentLessonIndex + 1)}
                      className="gap-2"
                    >
                      Casharka ku xiga
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ) : (
                <Button 
                  onClick={markLessonComplete}
                  disabled={markingComplete}
                  className="w-full gap-2"
                  size="lg"
                >
                  {markingComplete ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Sax saaro - Casharka waan dhamaystay
                </Button>
              )}
            </motion.div>

            {/* Resources */}
            {resources.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <h3 className="font-semibold mb-3">PDF & Resources</h3>
                <div className="space-y-2">
                  {resources.map((resource, index) => (
                    <motion.button
                      key={resource.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onClick={async () => {
                        try {
                          const response = await fetch(resource.file_url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = resource.title + (resource.file_type === 'pdf' ? '.pdf' : '');
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast({
                            title: "Download bilaabmay",
                            description: `${resource.title} waa la soo dagayaa`,
                          });
                        } catch (error) {
                          console.error('Download error:', error);
                          window.open(resource.file_url, '_blank');
                        }
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted hover:scale-[1.02] transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{resource.title}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="font-semibold mb-3">Qoraalada Casharka</h3>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  {notes.map((note, index) => (
                    <motion.div 
                      key={note.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    >
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <FloatingContact />
      </div>
    );
  }

  // Lessons List View
  if (selectedPlaylist && selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {selectedCourse.title}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-display font-bold mb-2">{selectedPlaylist.title}</h1>
          {selectedPlaylist.description && (
            <p className="text-muted-foreground mb-6">{selectedPlaylist.description}</p>
          )}

          {/* Payment Notice for Users without Access */}
          {!hasFullAccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">Casharada waa xiran yihiin</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Si aad u daawato casharada, la xiriir WhatsApp: <strong>+252711983546</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">Qiimaha: <strong>$7/bilaha</strong></p>
                </div>
              </div>
            </motion.div>
          )}

          {loadingLessons ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ma jiraan casharo wali</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson.id);
                const isAdminLocked = isLessonLocked(lesson);
                const isAccessible = hasFullAccess && canAccessLesson(lesson, index);
                const isLocked = !hasFullAccess || !canAccessLesson(lesson, index);
                const unlockDateText = getUnlockDateText(lesson);

                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleLessonClick(lesson, index)}
                    className={`bg-card rounded-xl border border-border p-4 flex items-center gap-4 transition-all ${
                      isAccessible ? "cursor-pointer hover:shadow-md hover:border-primary/30" : "cursor-not-allowed opacity-75"
                    }`}
                  >
                    {/* Completion Status */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                      ) : isAdminLocked ? (
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-orange-500" />
                        </div>
                      ) : isAccessible ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Circle className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="w-24 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                      {lesson.thumbnail_url ? (
                        <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration_minutes || 0} daqiiqo</span>
                        {isCompleted && (
                          <span className="text-success text-xs font-medium ml-2">✓ Dhamaystay</span>
                        )}
                      </div>
                      {/* Show unlock date for admin locked lessons */}
                      {isAdminLocked && unlockDateText && (
                        <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Furnaanayaa: {unlockDateText}</span>
                        </div>
                      )}
                    </div>
                    {isAdminLocked ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Lock className="w-5 h-5" />
                          <span className="text-xs font-medium">Xiran</span>
                        </div>
                        {unlockDateText && (
                          <span className="text-xs text-muted-foreground hidden sm:block">Sug waqtiga</span>
                        )}
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <Lock className="w-5 h-5" />
                        <span className="text-xs font-medium">Xiran</span>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        <FloatingContact />
      </div>
    );
  }

  // Playlists View (within a course) - Now shows lesson count
  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Courses
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold mb-2">{selectedCourse.title}</h1>
            <p className="text-muted-foreground mb-8">{selectedCourse.description}</p>
          </motion.div>

          {/* Payment Notice for Users without Course Access */}
          {!currentCourseHasAccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">U baahan tahay lacag bixin si aad u daawato</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Course-kan waa xiran yahay. La xiriir WhatsApp: <strong>+252711983546</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">Qiimaha: <strong>$7/bilaha</strong></p>
                </div>
              </div>
            </motion.div>
          )}

          {loadingPlaylists ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ma jiraan playlists wali</h2>
              <p className="text-muted-foreground">Playlists waa la soo gelin doonaa dhawaan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist, index) => {
                const hasAccess = currentCourseHasAccess && hasPlaylistAccess(playlist.id);
                
                return (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePlaylistClick(playlist)}
                    className={`bg-card rounded-2xl border border-border overflow-hidden transition-all ${
                      hasAccess ? "cursor-pointer hover:shadow-lg" : "cursor-pointer"
                    }`}
                  >
                    <div className="aspect-video bg-muted relative">
                      {playlist.thumbnail_url ? (
                        <img src={playlist.thumbnail_url} alt={playlist.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{playlist.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {playlist.description || "Casharo cusub"}
                      </p>
                      {/* Lesson count display */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" />
                        <span>{playlist.lesson_count} cashar</span>
                      </div>
                      {!hasAccess && (
                        <div className="flex items-center gap-1 mt-2 text-destructive text-sm">
                          <Lock className="w-4 h-4" />
                          <span>Xiran - La xiriir +252711983546</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        <FloatingContact />
      </div>
    );
  }

  // Courses View (Main)
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={caaganelogo} alt="Caagane Academy" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-display font-bold">
                <span className="text-primary">Caagane</span>
                <span className="text-secondary"> Academy</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Courses</h1>
          <p className="text-muted-foreground mb-8">Dooro course-ka aad rabto inaad barato</p>
        </motion.div>

        {courses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ma jiraan courses wali</h2>
            <p className="text-muted-foreground">Courses waa la soo gelin doonaa dhawaan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCourseClick(course)}
                className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="aspect-video bg-muted relative">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <GraduationCap className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  {hasCourseAccess(course.id) && (
                    <div className="absolute top-2 right-2 bg-success text-success-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Fasax leh
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || "Baro Ingiriis si fudud"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <FloatingContact />
      <StudentChatbot />
    </div>
  );
};

export default Courses;