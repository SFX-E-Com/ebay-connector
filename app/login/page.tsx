'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Field,
  Input,
  Button,
  Alert,
  Card,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FiLogIn, FiShield } from 'react-icons/fi';
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', credentials);

      if (response.data.success) {
        // Store user data and token for client-side API calls
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('token', response.data.data.token);

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'An error occurred during login'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={{ base: "gray.50", _dark: "gray.900" }}
      px={4}
    >
      <Box maxW="md" w="full">
        <Card.Root shadow="xl" borderRadius="xl" bg={{ base: "white", _dark: "gray.800" }}>
          <Card.Body p={8}>
            <VStack gap={6} align="stretch">
              {/* Header */}
              <VStack gap={2} textAlign="center">
                <Box
                  p={3}
                  rounded="full"
                  bg={{ base: "orange.100", _dark: "rgba(237, 137, 54, 0.2)" }}
                  color="orange.500"
                  display="inline-flex"
                >
                  <Icon as={FiShield} boxSize={6} />
                </Box>
                <Heading color={{ base: "navy.800", _dark: "white" }} size="lg">
                  eBay Connector
                </Heading>
                <Text color="gray.500">
                  Admin Portal
                </Text>
              </VStack>

              {/* Error Alert */}
              {error && (
                <Alert.Root status="error" borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              {/* Login Form */}
              <Box as="form" onSubmit={handleSubmit}>
                <VStack gap={4}>
                  <Field.Root required>
                    <Field.Label color={{ base: "gray.700", _dark: "gray.300" }}>Email Address</Field.Label>
                    <Input
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleInputChange}
                      autoComplete="off"
                      disabled={isLoading}
                      size="lg"
                      bg={{ base: "white", _dark: "gray.700" }}
                      borderColor={{ base: "gray.200", _dark: "gray.600" }}
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label color={{ base: "gray.700", _dark: "gray.300" }}>Password</Field.Label>
                    <Input
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      autoComplete="current-password"
                      disabled={isLoading}
                      size="lg"
                      bg={{ base: "white", _dark: "gray.700" }}
                      borderColor={{ base: "gray.200", _dark: "gray.600" }}
                    />
                  </Field.Root>

                  <Button
                    type="submit"
                    colorPalette="orange"
                    size="lg"
                    w="full"
                    loading={isLoading}
                    loadingText="Signing In..."
                  >
                    <FiLogIn size={16} style={{ marginRight: '8px' }} />
                    Sign In
                  </Button>
                </VStack>
              </Box>

              {/* Footer */}
              <HStack gap={2} justify="center" pt={4}>
                <Icon as={FiShield} color="green.500" />
                <Text fontSize="sm" color="gray.500">
                  Secure authentication with HTTP-only cookies
                </Text>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>
    </Flex>
  );
}