import { FC } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { BackTop } from './BackTop';
import { NavBar } from './NavBar';

export const Layout: FC = () => (
  <>
    <NavBar />

    <Flex bgColor={useColorModeValue('primary.100', 'primary.800')} align="center" justify="center">
      <Box borderRadius="md" p={4}>
        <Outlet />
      </Box>
    </Flex>

    <BackTop />
  </>
);
