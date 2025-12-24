import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  Loader2,
  Play,
  Clock,
  Upload,
  Link2,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  id: string;
  title: string;
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
  playlist_id: string;
  is_locked: boolean | null;
  unlock_date: string | null;
}

interface LessonResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  lesson_id: string;
}

interface AdminLessonsProps {
  playlist: Playlist;
  onBack: () => void;
}

const AdminLessons = ({ playlist, onBack }: AdminLessonsProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [resourcesViewOpen, setResourcesViewOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonResources, setLessonResources] = useState<LessonResource[]>([]);
  const [editingResource, setEditingResource] = useState<LessonResource | null>(null);
  const [videoInputType, setVideoInputType] = useState<"upload" | "url">("url");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration_minutes: 0,
    is_published: true,
    is_locked: false,
    unlock_date: "",
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: "pdf",
    resource_type: "file" as "file" | "link",
  });
  const [noteContent, setNoteContent] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, [playlist.id]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("playlist_id", playlist.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonResources = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from("lesson_resources")
        .select("*")
        .eq("lesson_id", lessonId);

      if (error) throw error;
      setLessonResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const lessonData = {
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        duration_minutes: formData.duration_minutes || 0,
        is_published: formData.is_published,
        is_locked: formData.is_locked,
        unlock_date: formData.unlock_date ? new Date(formData.unlock_date).toISOString() : null,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast({ title: "Success", description: "Lesson updated successfully" });
      } else {
        const { error } = await supabase.from("lessons").insert({
          ...lessonData,
          playlist_id: playlist.id,
          order_index: lessons.length,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Lesson created successfully" });
      }

      setDialogOpen(false);
      setEditingLesson(null);
      resetForm();
      fetchLessons();
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: "Failed to save lesson",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      duration_minutes: 0,
      is_published: true,
      is_locked: false,
      unlock_date: "",
    });
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Lesson deleted successfully" });
      fetchLessons();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
    }
  };

  const toggleLessonLock = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .update({ is_locked: !lesson.is_locked })
        .eq("id", lesson.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: lesson.is_locked ? "Lesson unlocked" : "Lesson locked",
      });
      fetchLessons();
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast({
        title: "Error",
        description: "Failed to update lesson",
        variant: "destructive",
      });
    }
  };

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) return;
    setSaving(true);

    try {
      if (editingResource) {
        const { error } = await supabase
          .from("lesson_resources")
          .update({
            title: resourceForm.title,
            description: resourceForm.description || null,
            file_url: resourceForm.file_url,
            file_type: resourceForm.resource_type === "link" ? "link" : resourceForm.file_type,
          })
          .eq("id", editingResource.id);

        if (error) throw error;
        toast({ title: "Success", description: "Resource updated successfully" });
      } else {
        const { error } = await supabase.from("lesson_resources").insert({
          title: resourceForm.title,
          description: resourceForm.description || null,
          file_url: resourceForm.file_url,
          file_type: resourceForm.resource_type === "link" ? "link" : resourceForm.file_type,
          lesson_id: selectedLessonId,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Resource added successfully" });
      }

      setResourceDialogOpen(false);
      setEditingResource(null);
      setResourceForm({ title: "", description: "", file_url: "", file_type: "pdf", resource_type: "file" });
      if (resourcesViewOpen) {
        fetchLessonResources(selectedLessonId);
      }
    } catch (error) {
      console.error("Error saving resource:", error);
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase.from("lesson_resources").delete().eq("id", resourceId);
      if (error) throw error;
      toast({ title: "Success", description: "Resource deleted" });
      if (selectedLessonId) {
        fetchLessonResources(selectedLessonId);
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const openEditResource = (resource: LessonResource) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || "",
      file_url: resource.file_url,
      file_type: resource.file_type || "pdf",
      resource_type: resource.file_type === "link" ? "link" : "file",
    });
    setResourceDialogOpen(true);
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("lesson_notes").insert({
        content: noteContent,
        lesson_id: selectedLessonId,
      });

      if (error) throw error;
      toast({ title: "Success", description: "Note added successfully" });
      setNoteDialogOpen(false);
      setNoteContent("");
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url || "",
      thumbnail_url: lesson.thumbnail_url || "",
      duration_minutes: lesson.duration_minutes || 0,
      is_published: lesson.is_published,
      is_locked: lesson.is_locked ?? true,
      unlock_date: lesson.unlock_date ? new Date(lesson.unlock_date).toISOString().slice(0, 16) : "",
    });
    setVideoInputType(lesson.video_url?.startsWith("http") && !lesson.video_url?.includes("supabase") ? "url" : "upload");
    setDialogOpen(true);
  };

  const openResourcesView = async (lessonId: string) => {
    setSelectedLessonId(lessonId);
    await fetchLessonResources(lessonId);
    setResourcesViewOpen(true);
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
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold mb-1">{playlist.title}</h1>
          <p className="text-muted-foreground">Maamul casharada playlist-kan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingLesson(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Casharo Cusub
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Wax ka Badal Casharka" : "Casharo Cusub"}</DialogTitle>
              <DialogDescription>
                {editingLesson ? "Wax ka badal macluumaadka casharka" : "Ku dar casharo cusub playlist-kan"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="lesson-title">Magaca Casharka *</Label>
                <Input
                  id="lesson-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tusaale: Introduction to English"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lesson-desc">Sharaxaad</Label>
                <Textarea
                  id="lesson-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sharaxaad gaaban oo ku saabsan casharka"
                  rows={3}
                />
              </div>

              {/* Video Input Type Toggle */}
              <div>
                <Label>Video</Label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg mb-2">
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      videoInputType === "url"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setVideoInputType("url")}
                  >
                    <Link2 className="w-4 h-4" />
                    URL Link
                  </button>
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      videoInputType === "upload"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setVideoInputType("upload")}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>

                {videoInputType === "url" ? (
                  <div className="space-y-3">
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... ama link kale"
                    />
                    {/* Video Preview for Admin */}
                    {formData.video_url && (
                      <div className="rounded-lg overflow-hidden border border-border">
                        <div className="bg-muted px-3 py-2 text-sm font-medium flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Video Preview
                        </div>
                        <div className="aspect-video bg-black">
                          {formData.video_url.includes("youtube.com") || formData.video_url.includes("youtu.be") ? (
                            <iframe
                              src={(() => {
                                const url = formData.video_url;
                                const videoId = url.includes("youtu.be")
                                  ? url.split("/").pop()?.split("?")[0]
                                  : url.split("v=")[1]?.split("&")[0];
                                return `https://www.youtube.com/embed/${videoId}`;
                              })()}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={formData.video_url}
                              controls
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSaving(true);
                        try {
                          const fileName = `video-${Date.now()}.${file.name.split('.').pop()}`;
                          const { error: uploadError } = await supabase.storage
                            .from('course-files')
                            .upload(fileName, file);
                          if (uploadError) throw uploadError;
                          const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(fileName);
                          setFormData({ ...formData, video_url: urlData.publicUrl });
                          toast({ title: "Success", description: "Video uploaded" });
                        } catch (error) {
                          console.error(error);
                          toast({ title: "Error", description: "Failed to upload video", variant: "destructive" });
                        } finally {
                          setSaving(false);
                        }
                      }}
                    />
                    <Input
                      value={formData.video_url}
                      readOnly
                      placeholder="Upload video file"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Sawirka (Thumbnail)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingThumbnail(true);
                      try {
                        const fileName = `lesson-thumb-${Date.now()}.${file.name.split('.').pop()}`;
                        const { error: uploadError } = await supabase.storage
                          .from('thumbnails')
                          .upload(fileName, file);
                        if (uploadError) throw uploadError;
                        const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
                        setFormData({ ...formData, thumbnail_url: urlData.publicUrl });
                        toast({ title: "Success", description: "Thumbnail uploaded" });
                      } catch (error) {
                        console.error(error);
                        toast({ title: "Error", description: "Failed to upload thumbnail", variant: "destructive" });
                      } finally {
                        setUploadingThumbnail(false);
                      }
                    }}
                  />
                  <Input
                    value={formData.thumbnail_url}
                    readOnly
                    placeholder="Upload thumbnail"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                  >
                    {uploadingThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Muddada (daqiiqo)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                />
              </div>

              {/* Locking Controls */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.is_locked ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-success" />}
                    <Label htmlFor="lesson-locked">Casharka Xiran yahay</Label>
                  </div>
                  <Switch
                    id="lesson-locked"
                    checked={formData.is_locked}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_locked: checked })}
                  />
                </div>

                {formData.is_locked && (
                  <div>
                    <Label htmlFor="unlock-date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Xilliga Furitaanka (Auto-unlock)
                    </Label>
                    <Input
                      id="unlock-date"
                      type="datetime-local"
                      value={formData.unlock_date}
                      onChange={(e) => setFormData({ ...formData, unlock_date: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hadii aad doorato taariikh, casharka wuu furmayaa markii la gaaro
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lesson-published">La daabaco (Published)</Label>
                <Switch
                  id="lesson-published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingLesson ? (
                  "Kaydi Isbedelka"
                ) : (
                  "Samee Casharka"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Casharo</h2>
          <p className="text-muted-foreground mb-4">Ku dar casharo cusub playlist-kan</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ku dar Casharo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <div className="w-32 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                {lesson.thumbnail_url ? (
                  <img
                    src={lesson.thumbnail_url}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{lesson.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    lesson.is_published
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {lesson.is_published ? "Published" : "Draft"}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                    lesson.is_locked
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  }`}>
                    {lesson.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {lesson.is_locked ? "Xiran" : "Furan"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {lesson.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes || 0} min
                  </span>
                  {lesson.unlock_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(lesson.unlock_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLessonLock(lesson)}
                  className={lesson.is_locked ? "text-destructive" : "text-success"}
                >
                  {lesson.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResourcesView(lesson.id)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Resources
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setNoteDialogOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Note
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(lesson)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteLesson(lesson.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resources View Dialog */}
      <Dialog open={resourcesViewOpen} onOpenChange={setResourcesViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maamul Resources</DialogTitle>
            <DialogDescription>Fiiri, wax ka badal, ama ka saar resources</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setEditingResource(null);
                setResourceForm({ title: "", description: "", file_url: "", file_type: "pdf", resource_type: "file" });
                setResourceDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ku dar Resource Cusub
            </Button>

            {lessonResources.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Ma jiraan resources</p>
            ) : (
              <div className="space-y-2">
                {lessonResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {resource.file_type === "link" ? (
                        <Link2 className="w-5 h-5 text-primary" />
                      ) : (
                        <FileText className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {resource.description || resource.file_url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditResource(resource)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteResource(resource.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={(open) => {
        setResourceDialogOpen(open);
        if (!open) {
          setEditingResource(null);
          setResourceForm({ title: "", description: "", file_url: "", file_type: "pdf", resource_type: "file" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? "Wax ka Badal Resource" : "Ku dar Resource"}</DialogTitle>
            <DialogDescription>Ku dar PDF, file, ama link casharka</DialogDescription>
          </DialogHeader>
          <form onSubmit={addResource} className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  resourceForm.resource_type === "file"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setResourceForm({ ...resourceForm, resource_type: "file" })}
              >
                <FileText className="w-4 h-4" />
                File / PDF
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  resourceForm.resource_type === "link"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setResourceForm({ ...resourceForm, resource_type: "link" })}
              >
                <Link2 className="w-4 h-4" />
                Link
              </button>
            </div>

            <div>
              <Label htmlFor="resource-title">Magaca *</Label>
              <Input
                id="resource-title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder={resourceForm.resource_type === "link" ? "Tusaale: Useful Website" : "Tusaale: Lesson Notes PDF"}
                required
              />
            </div>
            <div>
              <Label htmlFor="resource-desc">Sharaxaad</Label>
              <Input
                id="resource-desc"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="Sharaxaad gaaban"
              />
            </div>

            {resourceForm.resource_type === "link" ? (
              <div>
                <Label htmlFor="link-url">Link URL *</Label>
                <Input
                  id="link-url"
                  value={resourceForm.file_url}
                  onChange={(e) => setResourceForm({ ...resourceForm, file_url: e.target.value })}
                  placeholder="https://example.com/resource"
                  type="url"
                  required
                />
              </div>
            ) : (
              <div>
                <Label>File (PDF/Document)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={pdfInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingPdf(true);
                      try {
                        const fileName = `resource-${Date.now()}.${file.name.split('.').pop()}`;
                        const { error: uploadError } = await supabase.storage
                          .from('course-files')
                          .upload(fileName, file);
                        if (uploadError) throw uploadError;
                        const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(fileName);
                        setResourceForm({ ...resourceForm, file_url: urlData.publicUrl });
                        toast({ title: "Success", description: "File uploaded" });
                      } catch (error) {
                        console.error(error);
                        toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
                      } finally {
                        setUploadingPdf(false);
                      }
                    }}
                  />
                  <Input
                    value={resourceForm.file_url}
                    readOnly
                    placeholder="Upload file"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingResource ? "Kaydi Isbedelka" : "Ku dar Resource"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ku dar Note</DialogTitle>
            <DialogDescription>Ku dar qoraal sharaxaad ah casharka</DialogDescription>
          </DialogHeader>
          <form onSubmit={addNote} className="space-y-4">
            <div>
              <Label htmlFor="note-content">Qoraalka *</Label>
              <Textarea
                id="note-content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Qor notes-ka casharka..."
                rows={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ku dar Note"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLessons;
