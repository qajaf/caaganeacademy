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
}

interface LessonNote {
  id: string;
  content: string;
  lesson_id: string;
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
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration_minutes: 0,
    is_published: false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url || null,
            thumbnail_url: formData.thumbnail_url || null,
            duration_minutes: formData.duration_minutes || 0,
            is_published: formData.is_published,
          })
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast({ title: "Success", description: "Lesson updated successfully" });
      } else {
        const { error } = await supabase.from("lessons").insert({
          title: formData.title,
          description: formData.description || null,
          video_url: formData.video_url || null,
          thumbnail_url: formData.thumbnail_url || null,
          duration_minutes: formData.duration_minutes || 0,
          is_published: formData.is_published,
          playlist_id: playlist.id,
          order_index: lessons.length,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Lesson created successfully" });
      }

      setDialogOpen(false);
      setEditingLesson(null);
      setFormData({
        title: "",
        description: "",
        video_url: "",
        thumbnail_url: "",
        duration_minutes: 0,
        is_published: false,
      });
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

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("lesson_resources").insert({
        title: resourceForm.title,
        description: resourceForm.description || null,
        file_url: resourceForm.file_url,
        file_type: resourceForm.resource_type === "link" ? "link" : resourceForm.file_type,
        lesson_id: selectedLessonId,
      });

      if (error) throw error;
      toast({ title: "Success", description: "Resource added successfully" });
      setResourceDialogOpen(false);
      setResourceForm({ title: "", description: "", file_url: "", file_type: "pdf", resource_type: "file" });
    } catch (error) {
      console.error("Error adding resource:", error);
      toast({
        title: "Error",
        description: "Failed to add resource",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
    });
    setDialogOpen(true);
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
            setFormData({
              title: "",
              description: "",
              video_url: "",
              thumbnail_url: "",
              duration_minutes: 0,
              is_published: false,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Casharo Cusub
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
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
              <div>
                <Label>Video File *</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={useRef<HTMLInputElement>(null)}
                    className="hidden"
                    id="video-upload"
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
                    onClick={() => document.getElementById('video-upload')?.click()}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
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
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {lesson.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes || 0} min
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setResourceDialogOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Add Resource
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
                  Add Note
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

      {/* Add Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ku dar Resource</DialogTitle>
            <DialogDescription>Ku dar PDF, file, ama link casharka</DialogDescription>
          </DialogHeader>
          <form onSubmit={addResource} className="space-y-4">
            {/* Resource Type Toggle */}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ku dar Resource"}
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
