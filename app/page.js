'use client'
import { useState, useRef, useEffect } from "react";
import { Box, Button, Stack, TextField, Typography, CircularProgress, Paper, Chip } from "@mui/material";
import MuiMarkdown from "mui-markdown";
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  //suggested prompts for quick start
  const suggestedPrompts = [
    "Find me a good math professor",
    "Who teaches computer science?",
    "Show me highly rated professors",
    "I need help finding a biology teacher"
  ];

  //auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText = message, retryCount = 3) => {
    if (!messageText.trim()) return;

    const greetings = ['hi', 'hello', 'hey', 'sup', 'whats up', "what's up"];
    const isGreeting = greetings.some(greeting => 
      messageText.toLowerCase().trim() === greeting
    );

    setIsLoading(true);
    setMessages((messages) => [
      ...messages,
      { role: "user", content: messageText },
      { role: "assistant", content: '' }
    ]);

    setMessage('');

    if (isGreeting) {
      setTimeout(() => {
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { 
              ...lastMessage, 
              content: "Hello! I'm here to help you find the best professors. You can ask me to:\n\n- Find professors by subject (e.g., 'math professor')\n- Show highly rated professors\n- Search by teaching style or specific qualities\n\nWhat would you like to know?" 
            },
          ];
        });
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: "user", content: messageText }])
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      const processText = async ({ done, value }) => {
        if (done) {
          setIsLoading(false);
          return;
        }
        result += decoder.decode(value || new Uint8Array(), { stream: true });

        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: result },
          ];
        });

        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      if (retryCount > 0) {
        console.warn(`Retrying... (${3 - retryCount + 1}/3)`);
        await sendMessage(messageText, retryCount - 1);
      } else {
        console.error('Error fetching the response:', error);
        setMessages((messages) => {
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { role: "assistant", content: "Sorry, there was an error processing your request. Please try again." }
          ];
        });
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    setMessage(prompt);
    sendMessage(prompt);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        background: "linear-gradient(135deg, #f8fdffff 0%, #bfd1d6ff 100%)",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Box sx = {{ display: "flex", alignItems: "center", justifyContent: "center", gap:2.5 }}>
          <img src="/webicon.png" alt="StarProfs Logo" style={{ width: '40px', height: '40px' }} />
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            sx={{
              background: "linear-gradient(135deg, #69a39bff 0%, #497455ff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5 
            }}
          >
            StarProfs
          </Typography>
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ color: "#447271ff" }}
        >
          Find Professors who make you love learning!
        </Typography>
      </Box>

      {/* Chat container */}
      <Paper
        elevation={6}
        sx={{
          width: { xs: "95%", sm: "600px", md: "650px" },
          height: { xs: "75vh", md: "500px" },
          borderRadius: 4,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/*messages area with fixed height and scroll*/}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#555",
            },
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
              sx={{ animation: "fadeIn 0.3s ease-in" }}
            >
              <Paper
                elevation={2}
                sx={{
                  maxWidth: "80%",
                  p: 2,
                  borderRadius: 3,
                  background: message.role === 'assistant' 
                    ? "linear-gradient(135deg, #3e9e69ff 0%, #2c7c5dff 100%)"
                    : "#e8f5e9",
                  color: message.role === 'assistant' ? "#ffffff" : "#2d5016",
                  borderBottomLeftRadius: message.role === 'assistant' ? 0 : 12,
                  borderBottomRightRadius: message.role === 'user' ? 0 : 12,
                }}
              >
                <MuiMarkdown
                  overrides={{
                    p: {
                      props: {
                        style: { 
                          margin: 0, 
                          color: message.role === 'assistant' ? '#ffffff' : '#000000'
                        }
                      }
                    },
                    strong: {
                      props: {
                        style: { 
                          color: message.role === 'assistant' ? '#ffffff' : '#000000',
                          fontWeight: 'bold'
                        }
                      }
                    },
                    li: {
                      props: {
                        style: { 
                          color: message.role === 'assistant' ? '#ffffff' : '#000000'
                        }
                      }
                    }
                  }}
                >
                  {message.content}
                </MuiMarkdown>
              </Paper>
            </Box>
          ))}
          
          {/*loading indicator*/}
          {isLoading && (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} sx={{ color: "#4a7c2c" }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "#4a7c2c",
                  fontStyle: "italic",
                  animation: "pulse 1.5s ease-in-out infinite"
                }}
              >
                Thinking...
              </Typography>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/*suggested prompts when user starts*/}
        {messages.length === 1 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
              Try asking:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {suggestedPrompts.map((prompt, index) => (
                <Chip
                  key={index}
                  label={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  sx={{
                    cursor: "pointer",
                    background: "linear-gradient(135deg, #3e9e9620 0%, #2c5f7c20 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3e9b9e40 0%, #2c517c40 100%)",
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/*fixed input area at bottom*/}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #e0e0e0",
            background: "#fafafa",
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask about professors..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  background: "#ffffff",
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => sendMessage()}
              disabled={isLoading || !message.trim()}
              sx={{
                borderRadius: 3,
                minWidth: "60px",
                background: "linear-gradient(135deg, #73c0abff 0%, #367e39ff 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #30745cff 0%, #3e9e9eff 100%)",
                },
                "&:disabled": {
                  background: "#cccccc",
                }
              }}
            >
              <SendIcon />
            </Button>
          </Stack>
        </Box>
      </Paper>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Box>
  );
}