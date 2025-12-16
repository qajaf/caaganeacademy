import { motion } from "framer-motion";
import { 
  Video, 
  Brain, 
  Calendar, 
  FileText, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD Video Lessons",
    description: "Access high-quality video lessons organized by level. From beginner to advanced, learn at your own pace.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "AI-Powered Tutor",
    description: "Get instant help from our intelligent AI chatbot. Practice vocabulary, fix grammar, and get Arabic translations.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Calendar,
    title: "Book Live Sessions",
    description: "Schedule one-on-one sessions with our expert teacher. Get personalized feedback and practice speaking.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Downloadable Resources",
    description: "Access PDF materials, vocabulary lists, and practice exercises. Download and study offline anytime.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: MessageSquare,
    title: "Personal Notes",
    description: "Keep track of new words and important concepts. Your notes are always saved and accessible.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your learning journey. See which lessons you've completed and how much time you've invested.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
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
            Everything You Need to <span className="gradient-text">Master English</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our comprehensive platform provides all the tools and resources you need 
            to achieve fluency in English.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 card-hover">
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                
                <h3 className="text-xl font-display font-semibold mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
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
