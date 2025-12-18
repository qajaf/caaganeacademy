import { motion } from "framer-motion";
import { 
  BookOpen, 
  Brain, 
  Calculator, 
  Monitor, 
  Palette
} from "lucide-react";

const courses = [
  {
    icon: BookOpen,
    title: "English Language",
    description: "Baro luuqada Englishka laga bilaabo bilowga ilaa heerka sare. Grammar, vocabulary, iyo hadal.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Calculator,
    title: "Xisaabta (Mathematics)",
    description: "Baro xisaabta aasaasiga ah, Kudar, Kajar, Kudhufasho, Qeybin. Si sahlan oo waxtarsan.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Monitor,
    title: "Basic Computer Skills",
    description: "Baro sida loo isticmaalo computer-ka, Microsoft Office, internet-ka iyo email-ka.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Palette,
    title: "Graphic Design",
    description: "Baro naqshadeynta sawirrada, logo-yada, iyo design-ka casriga ah. Photoshop, Canva iwm.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    description: "Hel caawin AI ah oo 24/7 ah. Su'aalo, sharaxo, iyo tababar luuqadeed.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative" id="features">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Courses-ka <span className="gradient-text">Caagane Academy</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Waxaan bixinaa courses kala duwan oo loogu talagalay in lagugu xirfadaysiyo 
            xirfadaha muhiim ah ee suuqa shaqada loo baahan yahay.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-500 card-hover-glow shimmer">
                <motion.div 
                  className={`w-14 h-14 ${course.bgColor} rounded-xl flex items-center justify-center mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <course.icon className={`w-7 h-7 ${course.color}`} />
                </motion.div>
                
                <h3 className="text-xl font-display font-semibold mb-3">
                  {course.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
