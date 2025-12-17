import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  features: string[];
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, price, features")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24" id="courses">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-muted/30" id="courses">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Courseskayaga</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Doorso <span className="text-primary">Course-ka</span> Aad Rabto
          </h2>
          <p className="text-lg text-muted-foreground">
            Waxaan bixinaa courses kala duwan oo ku caawini doona inaad horumar xooggan sameyso
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Course Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <BookOpen className="w-16 h-16 text-primary" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-display font-bold mb-2">{course.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {course.description || "Baro xirfadaha casriga ah"}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-display font-bold text-primary">
                    ${course.price || 0}
                  </span>
                  <span className="text-muted-foreground">/bishii</span>
                </div>

                {/* Features */}
                {course.features && course.features.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {course.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/register">
                    Isdiwangali Hadda
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;