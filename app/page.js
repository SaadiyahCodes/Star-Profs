'use client'
import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import MuiMarkdown from "mui-markdown";

export default function Home() {

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async (retryCount = 3) => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: "user", content: message }])
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      const processText = async ({ done, value }) => {
        if (done) {
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
        await sendMessage(retryCount - 1);  // Retry the request
      } else {
        console.error('Error fetching the response:', error);
        setMessages((messages) => [
          ...messages,
          { role: "assistant", content: "Sorry, there was an error processing your request." }
        ]);
      }
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{p:3, bgcolor:"#eaeaea"}}
    >
      <Box>
        <Typography variant="h4" fontWeight="bold" textAlign="center" color="#25424c">StarProfs</Typography>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{textAlign:"center", fontSize: {xs: "1rem", sm: "1.25rem"},
          mt: 1, flex: 1
          }}
        >Find Professors who make you love learning!</Typography>
      </Box>
      <Stack 
        direction="column" 
        width="500px" 
        height="700px" 
        border="2px solid green" 
        p={2} 
        spacing={3}
      >
        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%">
        {
          messages.map((message, index) => (
            <Box key={index} display="flex" justifyContent={
              message.role === 'assistant' ? 'flex-start' : 'flex-end'
            }
            >
              <Box 
                bgcolor={message.role === 'assistant' ? "#25424c" : "#e56e38"}
                color="#ffffff"
                borderRadius={16}
                p={3}
              >
                <MuiMarkdown>{message.content}</MuiMarkdown>
              </Box>
            </Box>
          ))
        }
        </Stack>
        <Stack
          direction="row" spacing={2}
        >
          <TextField 
            label="message" fullWidth value={message}
            onChange={((e) => setMessage(e.target.value))}
            onKeyDown={handleKeyPress}
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
