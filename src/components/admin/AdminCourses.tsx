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
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Loader2,
  BookOpen,
  ChevronRight,
  Upload,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminCoursePlaylists from "./AdminCoursePlaylists";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  is_free: boolean;
  order_index: number;
  created_at: string;
  price: number;
  features: string[];
  instructor_name: string | null;
  playlists_count?: number;
  lessons_count?: number;
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    is_published: false,
    is_free: false,
    price: 0,
    features: "",
    instructor_name: "Caagane",
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Get playlist counts and direct lesson counts
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const [playlistRes, lessonsRes] = await Promise.all([
            supabase
              .from("playlists")
              .select("*", { count: "exact", head: true })
              .eq("course_id", course.id),
            supabase
              .from("lessons")
              .select("*", { count: "exact", head: true })
              .eq("course_id", course.id)
              .is("playlist_id", null),
          ]);
          return { 
            ...course, 
            playlists_count: playlistRes.count || 0,
            lessons_count: lessonsRes.count || 0,
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
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
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update({
            title: formData.title,
            description: formData.description || null,
            thumbnail_url: formData.thumbnail_url || null,
            is_published: formData.is_published,
            is_free: formData.is_free,
            price: formData.is_free ? 0 : formData.price,
            features: featuresArray,
            instructor_name: formData.instructor_name || 'Caagane',
          })
          .eq("id", editingCourse.id);

        if (error) throw error;
        toast({ title: "Success", description: "Course updated successfully" });
      } else {
        const { error } = await supabase.from("courses").insert({
          title: formData.title,
          description: formData.description || null,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          is_free: formData.is_free,
          price: formData.is_free ? 0 : formData.price,
          features: featuresArray,
          instructor_name: formData.instructor_name || 'Caagane',
          order_index: courses.length,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Course created successfully" });
      }

      setDialogOpen(false);
      setEditingCourse(null);
      setFormData({ title: "", description: "", thumbnail_url: "", is_published: false, is_free: false, price: 0, features: "", instructor_name: "Caagane" });
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? All playlists and lessons will also be deleted.")) return;

    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Course deleted successfully" });
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      thumbnail_url: course.thumbnail_url || "",
      is_published: course.is_published,
      is_free: course.is_free || false,
      price: course.price || 0,
      features: (course.features || []).join("\n"),
      instructor_name: course.instructor_name || "Caagane",
    });
    setDialogOpen(true);
  };

  if (selectedCourse) {
    return (
      <AdminCoursePlaylists
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

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
          <h1 className="text-3xl font-display font-bold mb-2">Maamulka Courses</h1>
          <p className="text-muted-foreground">Samee courses cusub sida English, Xisaab, Computer iwm</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCourse(null);
            setFormData({ title: "", description: "", thumbnail_url: "", is_published: false, is_free: false, price: 0, features: "", instructor_name: "Caagane" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Course Cusub
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Wax ka Badal Course" : "Course Cusub"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Wax ka badal macluumaadka course" : "Samee course cusub sida English, Xisaab, Computer iwm"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Magaca Course *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tusaale: English Language, Xisaabta, Computer Skills"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Sharaxaad</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sharaxaad gaaban oo ku saabsan course-ka"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="instructor">Macalinka (by)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="instructor"
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    placeholder="Caagane"
                    className="pl-10"
                  />
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
                        const fileName = `course-${Date.now()}.${file.name.split('.').pop()}`;
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
              <div className="flex items-center justify-between">
                <Label htmlFor="is_free">Bilaash (Free Course)</Label>
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked, price: checked ? 0 : formData.price })}
                />
              </div>
              {!formData.is_free && (
                <div>
                  <Label htmlFor="price">Qiimaha ($ bishii)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="7"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="features">Waxa Ardaygu Helayo (mid kasta sadar cusub)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Video lessons oo dhamaystiran&#10;AI Tutor&#10;PDF resources&#10;Teacher support"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">La daabaco (Published)</Label>
                <Switch
                  id="published"
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
                ) : editingCourse ? (
                  "Kaydi Isbedelka"
                ) : (
                  "Samee Course"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Courses</h2>
          <p className="text-muted-foreground mb-4">Samee course cusub si aad u bilaabato</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Samee Course Cusub
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden card-hover"
            >
              <div className="aspect-video bg-muted relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <GraduationCap className="w-12 h-12 text-primary" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {course.is_free && (
                    <span className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground">
                      FREE
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.is_published
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {course.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span className="font-bold text-primary">
                    {course.is_free ? "Bilaash" : `$${course.price || 0}/bishii`}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.playlists_count} playlists
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCourse(course)}
                  >
                    Playlists
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCourse(course.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
