import { FC, useRef } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { BackTop } from './BackTop';
import { NavBar } from './NavBar';

export const Layout: FC = () => {
  const navBarRef = useRef<HTMLDivElement>(null);
  const flexRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <NavBar ref={navBarRef} />

      <Flex
        ref={flexRef}
        minH={`calc(100vh - ${navBarRef.current?.clientHeight})`}
        bgColor={useColorModeValue('primary.100', 'primary.800')}
        justify="center"
        align={'center'}
      >
        <Box
          borderRadius="md"
          p={4}
          w={{ base: '95%', sm: '90%', lg: '85%' }}
          h={{ base: '88vh', md: '85vh' }}
          maxH={`calc(100vh - ${flexRef.current?.clientHeight})`}
          maxW="container.xl"
        >
          <Outlet />
        </Box>
      </Flex>

      <BackTop />
    </>
  );
};
