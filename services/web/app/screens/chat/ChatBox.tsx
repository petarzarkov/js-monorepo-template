import React, { useRef, useState, useEffect } from 'react';
import { Button, Flex, Heading, HStack, Input, Stack, Text, useColorModeValue } from '@chakra-ui/react';

import { useSocket } from '@hooks';
import Message from './Message';

export function ChatBox() {
  const { messages, isConnected, sendMessage } = useSocket();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageInput, setMessageInput] = useState('');

  // Scroll to bottom when messages from context change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Depend on messages from context

  // Handle sending message using context function
  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if (trimmedMessage && isConnected) {
      sendMessage(trimmedMessage);
      setMessageInput('');
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Define background colors using Chakra hooks
  const outerBg = useColorModeValue('gray.50', 'gray.800');
  const chatAreaBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('primary.500', 'primary.600'); // Adjusted header color
  const inputAreaBg = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const buttonBg = useColorModeValue('primary.500', 'primary.400');
  const buttonHoverBg = useColorModeValue('primary.600', 'primary.300');

  return (
    <Flex h="100vh" py={12} bg={outerBg}>
      <Flex
        flexDirection="column"
        w="2xl"
        m="auto"
        h="full"
        borderWidth="1px"
        rounded="3xl"
        overflow="hidden"
        bg={chatAreaBg}
        borderColor={useColorModeValue('gray.200', 'gray.600')} // Border color
      >
        <HStack
          p={4}
          bg={headerBg}
          flexShrink={0}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.500')}
        >
          <Heading size="lg" color="white">
            Chat App
          </Heading>
          <Flex flex={1} justify="flex-end" align="center">
            <Flex boxSize="10px" borderRadius="full" bg={isConnected ? 'green.400' : 'red.400'} mr={2} />
            <Text fontSize="xs" color="whiteAlpha.800">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </Flex>
        </HStack>

        <Stack
          px={4}
          py={4}
          overflowY="auto"
          flex={1}
          spacing={4}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: useColorModeValue('gray.300', 'gray.500'),
              borderRadius: '24px',
            },
          }}
        >
          {messages.map((msg, idx) => (
            <Message key={`msg-${idx}-${msg.time}-${msg.nickname}`} {...msg} />
          ))}
          <div ref={messagesEndRef} />
        </Stack>

        <HStack
          p={4}
          bg={inputAreaBg}
          borderTopWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.500')}
          flexShrink={0}
        >
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={inputBg}
            placeholder={!isConnected ? 'Connecting...' : 'Ask me anything...'}
            isDisabled={!isConnected}
            variant="filled"
            _focus={{ borderColor: useColorModeValue('primary.500', 'primary.300') }}
          />
          <Button
            colorScheme="blue"
            bg={buttonBg}
            color="white"
            _hover={{ bg: buttonHoverBg }}
            onClick={handleSendMessage}
            isDisabled={!messageInput.trim() || !isConnected} // Use context state
          >
            Ask
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}

export default ChatBox;
