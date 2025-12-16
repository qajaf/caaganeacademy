import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Loader2,
  Lock,
  Play,
  ChevronRight,
  ArrowLeft,
  Clock,
  FileText,
  Download,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface Profile {
  is_approved: boolean;
  full_name: string;
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
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

const Courses = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

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

      // Fetch published playlists (everyone can see published ones)
      const { data: playlistData, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPlaylists(playlistData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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

  const handlePlaylistClick = (playlist: Playlist) => {
    if (!profile?.is_approved) {
      toast({
        title: "Waxaad u baahan tahay ogolaanshaha",
        description: "La xiriir WhatsApp: 626966559 si aad u bixiso lacagta $7/bilaha",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlaylist(playlist);
    fetchLessons(playlist.id);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!profile?.is_approved) {
      toast({
        title: "Waxaad u baahan tahay ogolaanshaha",
        description: "La xiriir WhatsApp: 626966559 si aad u bixiso lacagta $7/bilaha",
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

  // Lesson View
  if (selectedLesson && profile?.is_approved) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Casharada
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Video Player */}
            {selectedLesson.video_url && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6">
                <iframe
                  src={getVideoEmbed(selectedLesson.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <h1 className="text-2xl font-display font-bold mb-2">{selectedLesson.title}</h1>
            {selectedLesson.description && (
              <p className="text-muted-foreground mb-6">{selectedLesson.description}</p>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">PDF & Resources</h3>
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{resource.title}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                      <Download className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Qoraalada Casharka</h3>
                <div className="bg-card rounded-xl border border-border p-4">
                  {notes.map((note) => (
                    <div key={note.id} className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lessons List View
  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={() => { setSelectedPlaylist(null); setLessons([]); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Casharada
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
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleLessonClick(lesson)}
                  className={`bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
                    !profile?.is_approved ? "opacity-75" : ""
                  }`}
                >
                  <div className="w-24 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                    {lesson.thumbnail_url ? (
                      <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {!profile?.is_approved && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{lesson.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration_minutes || 0} daqiiqo</span>
                    </div>
                  </div>
                  {!profile?.is_approved ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Playlists View (Main)
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
          <h1 className="text-3xl font-display font-bold mb-2">Casharada</h1>
          <p className="text-muted-foreground mb-8">Ku soo dhawoow casharadayada English-ka</p>
        </motion.div>

        {/* Payment Notice for Unapproved Users */}
        {!profile?.is_approved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-accent">Lacag bixin loo baahan yahay</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Si aad u daawato casharada, fadlan la xiriir WhatsApp: <strong>626966559</strong>
                </p>
                <p className="text-sm text-muted-foreground">Qiimaha: <strong>$7/bilaha</strong></p>
              </div>
            </div>
          </motion.div>
        )}

        {playlists.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ma jiraan casharo wali</h2>
            <p className="text-muted-foreground">Casharada waa la soo gelin doonaa dhawaan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handlePlaylistClick(playlist)}
                className={`bg-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  !profile?.is_approved ? "opacity-90" : ""
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
                  {!profile?.is_approved && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {playlist.description || "Casharo cusub"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
