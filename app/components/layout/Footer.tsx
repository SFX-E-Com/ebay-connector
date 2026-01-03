import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
} from '@chakra-ui/react';

export default function Footer() {
  return (
    <Box bg={{ base: "gray.50", _dark: "gray.900" }} borderTop="1px" borderColor={{ base: "gray.200", _dark: "gray.700" }} mt="auto">
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        <VStack gap={6}>
          <Box h="1px" bg={{ base: "gray.300", _dark: "gray.600" }} w="full" />

          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="between"
            align="center"
            w="full"
            gap={4}
          >
            <Text fontSize="sm" color={{ base: "gray.600", _dark: "white" }}>
              © 2025 eBay Connector. All rights reserved.
            </Text>
            <Text fontSize="sm" color={{ base: "gray.500", _dark: "gray.300" }}>
              Developed by - SFX E-commerce
            </Text>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}