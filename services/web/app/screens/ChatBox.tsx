import { Button, Flex, Heading, HStack, Input, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// --- Interfaces ---
interface MessageProps {
  text: string;
  // Add 'error' to the possible nicknames
  nickname: 'user' | 'bot' | 'error' | string;
}

interface SocketMessage {
  text: string;
  // Add other fields if your server sends them
}

// Interface for the expected exception data from the server
interface SocketExceptionData {
  status: 'error'; // Expecting 'error' based on your filter
  message: string;
}

// --- Message Component ---
const Message = ({ text, nickname }: MessageProps) => {
  const isUser = nickname === 'user';
  const isBot = nickname === 'bot';
  // Check if it's an error message
  const isError = nickname === 'error';

  // Determine alignment based on type
  const align = isUser ? 'flex-end' : 'flex-start';

  // Define colors based on role
  const userBg = useColorModeValue('primary.700', 'primary.100');
  const userText = useColorModeValue('primary.100', 'primary.700');
  const botBg = useColorModeValue('green.700', 'green.100');
  const botText = useColorModeValue('green.100', 'green.700');
  // Define colors for error messages (e.g., red)
  const errorBg = useColorModeValue('red.600', 'red.300');
  const errorText = useColorModeValue('white', 'red.900');

  // Select colors based on nickname
  const bgColor = isUser ? userBg : isBot ? botBg : isError ? errorBg : botBg; // Default non-user/error to bot style
  const textColor = isUser ? userText : isBot ? botText : isError ? errorText : botText;

  return (
    <Flex
      p={4}
      bg={bgColor}
      color={textColor}
      borderRadius="lg"
      w="fit-content"
      maxW="80%"
      // Align user messages right, bot and error messages left
      alignSelf={align}
      wordBreak="break-word"
      boxShadow="sm" // Added subtle shadow for better distinction
    >
      {/* Optionally add a prefix for errors */}
      {isError && (
        <Text fontWeight="bold" mr={2}>
          ⚠️ Error:
        </Text>
      )}
      <Text>{text}</Text>
    </Flex>
  );
};

// --- ChatBox Component ---
const SERVER_URL = 'http://localhost:3033';

export function ChatBox() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([{ text: 'How may I help you?', nickname: 'bot' }]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO Connected:', newSocket.id);
    });

    // Listen for regular chat messages
    newSocket.on('chat', (receivedMsg: SocketMessage) => {
      console.log('Message received from server:', receivedMsg);
      if (receivedMsg && typeof receivedMsg.text === 'string') {
        setMessages((prev) => [...prev, { text: receivedMsg.text, nickname: 'bot' }]);
      } else {
        console.warn('Received invalid message format from server:', receivedMsg);
      }
    });

    // --- Add Listener for Server Exceptions ---
    newSocket.on('exception', (errorData: SocketExceptionData) => {
      console.error('Server Exception Received:', errorData);
      // Check if the received data has the expected structure
      if (errorData && errorData.status === 'error' && typeof errorData.message === 'string') {
        // Add the error message to the chat display
        setMessages((prev) => [
          ...prev,
          // Use the 'error' nickname type
          { text: errorData.message, nickname: 'error' },
        ]);
      } else {
        // Fallback if the error format is unexpected
        console.warn('Received unexpected error format:', errorData);
        setMessages((prev) => [...prev, { text: 'An unknown error occurred on the server.', nickname: 'error' }]);
      }
    });
    // --- End Exception Listener ---

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO Disconnected:', reason);
      setSocket(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO Connection Error:', error);
      // Optionally display a connection error message in the chat
      setMessages((prev) => [
        ...prev,
        { text: `Connection failed: ${error.message}. Please check the server.`, nickname: 'error' },
      ]);
    });

    // --- Cleanup function ---
    return () => {
      console.log('Disconnecting Socket.IO...');
      newSocket.off('connect');
      newSocket.off('chat');
      // Make sure to remove the exception listener
      newSocket.off('exception');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.disconnect();
    };
  }, []); // Runs once on mount

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !socket || !socket.connected) {
      return;
    }

    const messageToSend: SocketMessage = { text: trimmedMessage };

    setMessages((prev) => [...prev, { text: trimmedMessage, nickname: 'user' }]);

    socket.emit('chat', messageToSend, (ack: Record<string, unknown>) => {
      if (ack?.error) {
        console.error('Message delivery failed:', ack.error);
        // Optional: Add a local error message if server ACK indicates failure
        setMessages((prev) => [...prev, { text: `Message failed to send: ${ack.error}`, nickname: 'error' }]);
      } else {
        console.log('Message delivered successfully (or no ACK configured):', messageToSend);
      }
    });

    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Flex h="100vh" py={12} bg={useColorModeValue('gray.50', 'gray.800')}>
      <Flex
        flexDirection="column"
        w="2xl"
        m="auto"
        h="full"
        borderWidth="1px"
        rounded="3xl"
        overflow="hidden"
        bg={useColorModeValue('white', 'gray.700')} // Background for the chat area itself
      >
        {/* Header */}
        <HStack
          p={4}
          bg={useColorModeValue('primary.300', 'primary.500')}
          flexShrink={0}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          <Heading size="lg" color="white">
            Chat App
          </Heading>
        </HStack>

        {/* Message List */}
        <Stack
          px={4}
          py={4}
          overflowY="auto"
          flex={1}
          spacing={4}
          css={
            {
              /* Scrollbar styles */
            }
          }
        >
          {messages.map((msg, idx) => (
            <Message key={`message-${idx}-${msg.nickname}-${msg.text.slice(0, 10)}`} {...msg} /> // More robust key
          ))}
          <div ref={messagesEndRef} />
        </Stack>

        {/* Input Area */}
        <HStack
          p={4}
          bg={useColorModeValue('gray.100', 'gray.600')} // Slightly different bg for input area
          borderTopWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.500')}
          flexShrink={0}
        >
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={useColorModeValue('white', 'gray.700')}
            placeholder={!socket || !socket.connected ? 'Connecting...' : 'Ask me anything...'}
            flex={1}
            isDisabled={!socket || !socket.connected}
            variant="filled" // Changed variant for slight visual difference
            _focus={{
              borderColor: useColorModeValue('primary.500', 'primary.300'),
            }}
          />
          <Button
            colorScheme="blue" // Keep consistent color scheme unless desired otherwise
            // Adjusted colors for consistency
            bg={useColorModeValue('primary.500', 'primary.400')}
            color="white"
            _hover={{
              bg: useColorModeValue('primary.600', 'primary.300'),
            }}
            onClick={handleSendMessage}
            isDisabled={!message.trim() || !socket || !socket.connected}
          >
            Ask
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}

export default ChatBox;
