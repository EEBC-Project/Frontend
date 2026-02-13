"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessageCircle,
  FileText,
  Upload,
  X,
  Paperclip,
  Trash2,
  BookOpen,
  Sparkles,
  Zap,
  Thermometer,
  Calculator,
  Lightbulb,
  CheckSquare,
  Building,
  Fan,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Client-side timestamp component to avoid hydration issues
function ClientTimestamp({
  timestamp,
  className = "",
}: {
  timestamp: Date;
  className?: string;
}) {
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    setTimeString(timestamp.toLocaleTimeString());
  }, [timestamp]);

  return (
    <span className={`text-xs mt-1 block ${className}`}>{timeString}</span>
  );
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const agents: Agent[] = [
  {
    id: "Compliance Checker",
    name: "Compliance Checker",
    description: "Analyze compliance & calculate ETTV",
    icon: CheckSquare,
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "ETTV Calculator",
    name: "ETTV Calculator",
    description: "Calculate Envelope Thermal Transfer Value",
    icon: Calculator,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "Solution Advisor",
    name: "Solution Advisor",
    description: "Corrective actions with ROI analysis",
    icon: Lightbulb,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "EEBC Expert",
    name: "EEBC Expert",
    description: "Answer any EEBC 2021 questions",
    icon: MessageCircle,
    color: "from-purple-500 to-fuchsia-600",
  },
  {
    id: "Envelope Specialist",
    name: "Envelope Specialist",
    description: "Section 4: Building Envelope",
    icon: Building,
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "Lighting Specialist",
    name: "Lighting Specialist",
    description: "Section 5: Lighting Requirements",
    icon: Zap,
    color: "from-yellow-400 to-yellow-600",
  },
  {
    id: "HVAC Specialist",
    name: "HVAC Specialist",
    description: "Section 6: HVAC Requirements",
    icon: Fan,
    color: "from-cyan-400 to-sky-600",
  },
];

export default function RAGFrontend() {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = selectedAgent ? messages[selectedAgent.id] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]); // Update scroll when active chat changes

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFileName(selectedFile.name);
        setSelectedFile(null);
        setShowUploader(false);

        const successMessage: Message = {
          id: Date.now().toString(),
          content: `✅ PDF "${data.filename}" uploaded successfully! Created ${data.chunks_created} text chunks. You can now ask questions about this document.`,
          sender: "assistant",
          timestamp: new Date(),
        };

        // Add success message to ALL agents since file is global
        setMessages((prev) => {
          const newMessages = { ...prev };
          // If an agent is currently selected, at least add it there
          if (selectedAgent) {
            newMessages[selectedAgent.id] = [
              ...(newMessages[selectedAgent.id] || []),
              successMessage,
            ];
          }
          return newMessages;
        });

        const fileInput = document.getElementById(
          "pdf-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        `Failed to upload PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMessage],
    }));

    setCurrentMessage("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/tools/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question: currentMessage,
          agent_type: selectedAgent.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullAnswer =
          data.answer ||
          "I received your message but couldn't process it properly.";

        const chunks = fullAnswer
          .split(/(?<=[.!?])\s+/)
          .filter((chunk: string) => chunk.trim().length > 0);

        if (chunks.length <= 2) {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            content: fullAnswer,
            sender: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => ({
            ...prev,
            [selectedAgent.id]: [
              ...(prev[selectedAgent.id] || []),
              assistantMessage,
            ],
          }));
        } else {
          for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, i * 800));
            const chunkMessage: Message = {
              id: `${Date.now()}-${i}`,
              content: chunks[i],
              sender: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => ({
              ...prev,
              [selectedAgent.id]: [
                ...(prev[selectedAgent.id] || []),
                chunkMessage,
              ],
            }));
          }
        }
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error("RAG Server connection error:", error);
      setError(
        `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!selectedAgent) return;
    setMessages((prev) => ({
      ...prev,
      [selectedAgent.id]: [],
    }));
    // Intentionally do NOT clear uploadedFileName so the file context remains
    // setUploadedFileName("");
    setError("");
  };

  if (!selectedAgent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building className="h-10 w-10 text-slate-900" />
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                EEBC 2021 Consulting Agents
              </h1>
            </div>
            <p className="text-lg text-slate-600 mb-6">
              Select a specialized AI agent for your building compliance needs
            </p>

            {/* Show active file status globally */}
            {uploadedFileName && (
              <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-full px-5 py-2 mb-6">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Active Document:{" "}
                  <span className="font-bold">{uploadedFileName}</span>
                </span>
                <button
                  onClick={() => setUploadedFileName("")}
                  className="ml-2 p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-red-500 transition-colors"
                  title="Remove active document"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAgent(agent)}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-100 group"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <agent.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {agent.name}
                </h3>
                <p className="text-slate-500 text-sm">{agent.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => setSelectedAgent(null)}
            className="rounded-xl hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center shadow-md`}
            >
              <selectedAgent.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {selectedAgent.name}
              </h1>
              <p className="text-sm text-slate-500">
                {selectedAgent.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {uploadedFileName ? (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 max-w-[200px] truncate">
                    {uploadedFileName}
                  </span>
                  <button
                    onClick={() => setUploadedFileName("")}
                    className="text-blue-400 hover:text-red-500 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploader(!showUploader)}
                  className="text-slate-600 rounded-lg"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {showUploader ? "Close" : "Attach PDF"}
                </Button>
              )}
            </div>
            {activeMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border-b border-red-200 px-6 py-3"
            >
              <p className="text-sm text-red-700 flex items-center justify-between">
                {error}
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </p>
            </motion.div>
          )}

          {/* PDF Uploader - Collapsible */}
          <AnimatePresence>
            {showUploader && !uploadedFileName && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      {isUploading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-slate-50/30">
            {/* Welcome Message */}
            {activeMessages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center mb-4 opacity-20`}
                >
                  <selectedAgent.icon className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Hello! I am your {selectedAgent.name}.
                </h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">
                  {selectedAgent.description}
                  {!uploadedFileName &&
                    ". Attach a PDF for document-specific analysis."}
                </p>
              </div>
            )}

            {/* Message List */}
            <AnimatePresence>
              {activeMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex gap-3 max-w-[80%]">
                    {message.sender === "assistant" && (
                      <div
                        className={`h-8 w-8 rounded-xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0`}
                      >
                        <selectedAgent.icon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200"
                          : "bg-white border border-slate-200 text-slate-900 shadow-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <ClientTimestamp
                        timestamp={message.timestamp}
                        className={
                          message.sender === "user"
                            ? "text-blue-100"
                            : "text-slate-400"
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div
                  className={`h-8 w-8 rounded-xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center shadow-lg shadow-blue-200`}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span
                        className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <Input
                placeholder={`Ask the ${selectedAgent.name}...`}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className={`rounded-xl bg-gradient-to-r ${selectedAgent.color} hover:opacity-90`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Removed "What You Can Do" section as it's replaced by the agent selector screen */}
      </div>
    </div>
  );
}
