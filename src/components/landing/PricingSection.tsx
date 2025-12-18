import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  features: string[];
  instructor_name: string | null;
}

const PricingSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, description, thumbnail_url, price, features, instructor_name")
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

    fetchCourses();
  }, []);

  return (
    <section className="py-24 relative" id="pricing">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20 mb-6">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Qiimaha Fudud</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Maalgeli <span className="text-secondary">Mustaqbalkaaga</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hel dhammaan casharada oo qiimo fudud ah. 
            Wax qarsoodi ah majiraan.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>Ma jiraan courses hadda la heli karo</p>
          </div>
        ) : (
          <div className={`grid gap-8 max-w-6xl mx-auto ${
            courses.length === 1 ? 'md:grid-cols-1 max-w-md' : 
            courses.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 
            'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 80 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="relative h-full group">
                  {index === 0 && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-accent blur-3xl opacity-20 rounded-3xl"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  
                  <div className={`relative bg-card rounded-3xl p-8 shadow-lg h-full flex flex-col transition-all duration-500 group-hover:shadow-2xl ${
                    index === 0 ? 'border-2 border-accent/30 pulse-glow' : 'border border-border group-hover:border-primary/30'
                  }`}>
                    {/* Thumbnail */}
                    {course.thumbnail_url && (
                      <motion.div 
                        className="aspect-video rounded-xl overflow-hidden mb-6 -mt-2"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </motion.div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-display font-bold mb-2">{course.title}</h3>
                      {course.instructor_name && (
                        <p className="text-sm text-muted-foreground mb-2">by {course.instructor_name}</p>
                      )}
                      {course.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{course.description}</p>
                      )}
                      
                      <motion.div 
                        className="flex items-baseline justify-center gap-2"
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-4xl md:text-5xl font-display font-bold">${course.price || 0}</span>
                        <span className="text-lg text-muted-foreground">/bishii</span>
                      </motion.div>
                    </div>
                    
                    {course.features && course.features.length > 0 && (
                      <div className="space-y-3 mb-8 flex-1">
                        {course.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: featureIndex * 0.05 + index * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <motion.div 
                              className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0"
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Check className="w-3 h-3 text-success" />
                            </motion.div>
                            <span className="text-sm text-foreground">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        variant={index === 0 ? "hero" : "outline"} 
                        size="xl" 
                        className="w-full" 
                        asChild
                      >
                        <Link to="/register">
                          Bilow Hadda
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
