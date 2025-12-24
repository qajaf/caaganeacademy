import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const FloatingContact = () => {
  const whatsappUrl = "https://wa.me/252711983546?text=Salaan%20Caagane%20Academy,%20waxaan%20rabaa%20inaan%20iska%20diiwaangaliyo%20course-ka%20English-ka";

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5C] rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      
      {/* Pulse animation */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[#25D366]"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
      />
    </motion.a>
  );
};

export default FloatingContact;