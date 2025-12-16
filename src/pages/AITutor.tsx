import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, Send, LogOut, User, Bot, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface Profile {
  is_approved: boolean;
  full_name: string;
  language_level: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AITutor = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_approved, full_name, language_level")
        .eq("user_id", user!.id)
        .maybeSingle();

      setProfile(data);

      if (data?.is_approved) {
        // Welcome message
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm your AI English tutor at Caagane Academy. 👋\n\nI can see your English level is "${data.language_level || 'beginner'}". I'm here to help you:\n\n• Learn new vocabulary\n• Practice with example sentences\n• Correct your grammar mistakes\n• Translate between English and Arabic\n\nHow can I help you today?`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            languageLevel: profile?.language_level || "beginner",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      // Create initial assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Khalad",
        description: error instanceof Error ? error.message : "Wax khalad ah ayaa dhacay",
        variant: "destructive",
      });
      // Remove the empty assistant message if error occurred
      if (!assistantContent) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">AI English Tutor</h1>
              <p className="text-sm text-muted-foreground">
                Heerkaaga: {profile?.language_level?.replace("_", " ") || "Beginner"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment Notice for Unapproved Users */}
        {!profile?.is_approved ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center max-w-md">
              <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Lacag bixin loo baahan yahay</h3>
              <p className="text-muted-foreground mb-4">
                Si aad u isticmaasho AI Tutor-ka, fadlan la xiriir WhatsApp: <strong>626966559</strong>
              </p>
              <p className="text-sm text-muted-foreground">Qiimaha: <strong>$7/bilaha</strong></p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Chat Messages */}
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4 pb-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-secondary/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {sending && !messages[messages.length - 1]?.content && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="pt-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Qor su'aashaada halkan..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">
                AI-ga wuxuu kuu caawin karaa erayada, jumlada, iyo grammar-ka
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AITutor;
