import { Button, Flex, Heading, HStack, Input, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageProps, ServerChatMessage, SocketExceptionData, ClientChatMessage } from '../socket/Chat.types';

const Message = ({ text, nickname, time }: MessageProps) => {
  const isUser = nickname === 'user';
  const isBot = nickname === 'bot';
  const isError = nickname === 'error';
  const align = isUser ? 'flex-end' : 'flex-start';
  const userBg = useColorModeValue('primary.700', 'primary.100');
  const userText = useColorModeValue('primary.100', 'primary.700');
  const botBg = useColorModeValue('green.700', 'green.100');
  const botText = useColorModeValue('green.100', 'green.700');
  const errorBg = useColorModeValue('red.600', 'red.300');
  const errorText = useColorModeValue('white', 'red.900');
  const bgColor = isUser ? userBg : isBot ? botBg : isError ? errorBg : botBg;
  const textColor = isUser ? userText : isBot ? botText : isError ? errorText : botText;
  const date = new Date(time);

  return (
    <Flex
      p={4}
      bg={bgColor}
      color={textColor}
      borderRadius="lg"
      w="fit-content"
      maxW="80%"
      alignSelf={align}
      wordBreak="break-word"
      boxShadow="sm"
    >
      <Text fontSize="xs" opacity={0.7} p={1}>
        {nickname}
      </Text>
      {isError && (
        <Text fontWeight="bold" mr={2}>
          ⚠️ Error:
        </Text>
      )}
      <Text>{text}</Text>
      <Text>{`${date.getHours()}:${date.getMinutes()}`}</Text>
    </Flex>
  );
};

const SERVER_URL = 'http://localhost:3033';

export function ChatBox() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageInput, setMessageInput] = useState(''); // Renamed state for clarity
  const [messages, setMessages] = useState<MessageProps[]>([
    { text: 'Connecting to chat...', nickname: 'bot', time: Date.now() },
  ]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket); // Store the socket instance

    newSocket.on('connect', () => {
      console.log('Socket.IO Connected:', newSocket.id);
      setIsConnected(true); // --- Set connected status to true ---
      // Update initial message or add a connected message
      setMessages((prev) => {
        // Remove "Connecting..." message if it exists
        const filtered = prev.filter((msg) => msg.text !== 'Connecting to chat...');
        return [...filtered, { text: 'Connected! How may I help you?', nickname: 'bot', time: Date.now() }];
      });
    });

    // Listen for 'chat' messages (matching server emission)
    newSocket.on('chat', (receivedMsg: ServerChatMessage) => {
      console.log('Message received from server:', receivedMsg);
      // Validate the structure based on ServerChatMessage
      if (receivedMsg && typeof receivedMsg.message === 'string' && typeof receivedMsg.nickname === 'string') {
        // Map server's 'message' field to UI's 'text' prop
        setMessages((prev) => [...prev, { text: receivedMsg.message, nickname: 'bot', time: Date.now() }]);
      } else {
        console.warn('Received invalid message format from server:', receivedMsg);
      }
    });

    newSocket.on('exception', (errorData: SocketExceptionData) => {
      console.error('Server Exception Received:', errorData);
      if (errorData && errorData.status === 'error' && typeof errorData.message === 'string') {
        setMessages((prev) => [...prev, { text: errorData.message, nickname: 'error', time: Date.now() }]);
      } else {
        console.warn('Received unexpected error format:', errorData);
        setMessages((prev) => [
          ...prev,
          { text: 'An unknown error occurred on the server.', nickname: 'error', time: Date.now() },
        ]);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO Disconnected:', reason);
      setIsConnected(false); // --- Set connected status to false ---
      setSocket(null); // Clear socket instance
      // Add a disconnected message
      setMessages((prev) => [
        ...prev,
        { text: `Disconnected: ${reason}. Attempting to reconnect...`, nickname: 'error', time: Date.now() },
      ]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO Connection Error:', error);
      setIsConnected(false); // Ensure disconnected state on error
      // Update initial message or add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.text !== 'Connecting to chat...');
        return [...filtered, { text: `Connection failed: ${error.message}.`, nickname: 'error', time: Date.now() }];
      });
    });

    // --- Cleanup function ---
    return () => {
      console.log('Disconnecting Socket.IO...');
      newSocket.off('connect');
      newSocket.off('chat');
      newSocket.off('exception');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.disconnect();
      setIsConnected(false); // Ensure state is false on unmount
    };
  }, []); // Runs once on mount

  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !socket || !isConnected) {
      return;
    }

    const messageToSend: ClientChatMessage = {
      nickname: 'user',
      message: trimmedMessage, // Use 'message' field
    };

    // Add user message locally *before* sending
    // Map our ClientChatMessage 'message' to UI's 'text' prop
    setMessages((prev) => [...prev, { text: messageToSend.message, nickname: 'user', time: Date.now() }]);

    // --- Emit the correct structure ---
    socket.emit('chat', messageToSend, (ack: Record<string, unknown>) => {
      if (ack?.error) {
        console.error('Message delivery failed:', ack.error);
        setMessages((prev) => [
          ...prev,
          { text: `Message failed to send: ${ack.error}`, nickname: 'error', time: Date.now() },
        ]);
        // OPTIONAL: Remove the message that failed? Or mark it as failed?
        // This depends on desired UX. For now, we just add the error.
      } else {
        console.log('Message acknowledged by server (or no ACK configured):', messageToSend);
      }
    });

    setMessageInput(''); // Clear the input field state
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
            // Use text and nickname for the key, ensuring some uniqueness
            <Message key={`message-${idx}-${msg.nickname}-${msg.text.slice(0, 10)}`} {...msg} />
          ))}
          <div ref={messagesEndRef} />
        </Stack>

        <HStack
          p={4}
          bg={useColorModeValue('gray.100', 'gray.600')} // Slightly different bg for input area
          borderTopWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.500')}
          flexShrink={0}
        >
          <Input
            ref={inputRef}
            value={messageInput} // Use renamed state
            onChange={(e) => setMessageInput(e.target.value)} // Update renamed state
            onKeyPress={handleKeyPress}
            bg={useColorModeValue('white', 'gray.700')}
            // --- Use isConnected state for placeholder and disabled ---
            placeholder={!isConnected ? 'Connecting...' : 'Ask me anything...'}
            isDisabled={!isConnected}
            variant="filled"
            _focus={{
              borderColor: useColorModeValue('primary.500', 'primary.300'),
            }}
          />
          <Button
            colorScheme="blue"
            bg={useColorModeValue('primary.500', 'primary.400')}
            color="white"
            _hover={{
              bg: useColorModeValue('primary.600', 'primary.300'),
            }}
            onClick={handleSendMessage}
            // --- Use isConnected state and check messageInput ---
            isDisabled={!messageInput.trim() || !isConnected}
          >
            Ask
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}

export default ChatBox;
