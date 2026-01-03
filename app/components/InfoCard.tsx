'use client';

import React from 'react';
import {
  Card,
  Box,
  Text,
  Badge,
  HStack,
  VStack,
  GridItem,
} from '@chakra-ui/react';

interface InfoCardProps {
  title: string;
  description: string;
  icon?: string;
  iconColor?: any;
  iconBgColor?: any;
  badgeText?: string;
  badgeColorPalette?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  iconBgColor,
  badgeText,
  badgeColorPalette,
  onClick,
  children,
  variant = 'blue',
}) => {
  // Color scheme based on variant
  const colorSchemes = {
    blue: {
      iconColor: iconColor || 'blue.600',
      iconBgColor: iconBgColor || { base: 'blue.50', _dark: 'rgba(66, 153, 225, 0.2)' },
      borderColor: { base: 'blue.200', _dark: 'blue.800' },
      badgeColor: badgeColorPalette || 'blue',
    },
    green: {
      iconColor: iconColor || 'green.600',
      iconBgColor: iconBgColor || { base: 'green.50', _dark: 'rgba(72, 187, 120, 0.2)' },
      borderColor: { base: 'green.200', _dark: 'green.800' },
      badgeColor: badgeColorPalette || 'green',
    },
    purple: {
      iconColor: iconColor || 'purple.600',
      iconBgColor: iconBgColor || { base: 'purple.50', _dark: 'rgba(128, 90, 213, 0.2)' },
      borderColor: { base: 'purple.200', _dark: 'purple.800' },
      badgeColor: badgeColorPalette || 'purple',
    },
    orange: {
      iconColor: iconColor || 'orange.600',
      iconBgColor: iconBgColor || { base: 'orange.50', _dark: 'rgba(237, 137, 54, 0.2)' },
      borderColor: { base: 'orange.200', _dark: 'orange.800' },
      badgeColor: badgeColorPalette || 'orange',
    },
    red: {
      iconColor: iconColor || 'red.600',
      iconBgColor: iconBgColor || { base: 'red.50', _dark: 'rgba(245, 101, 101, 0.2)' },
      borderColor: { base: 'red.200', _dark: 'red.800' },
      badgeColor: badgeColorPalette || 'red',
    },
    teal: {
      iconColor: iconColor || 'teal.600',
      iconBgColor: iconBgColor || { base: 'teal.50', _dark: 'rgba(56, 178, 172, 0.2)' },
      borderColor: { base: 'teal.200', _dark: 'teal.800' },
      badgeColor: badgeColorPalette || 'teal',
    },
  };

  const colors = colorSchemes[variant];

  return (
    <GridItem>
      <Card.Root
        cursor={onClick ? 'pointer' : 'default'}
        transition="all 0.3s"
        _hover={onClick ? { transform: 'translateY(-4px)', boxShadow: 'xl' } : {}}
        onClick={onClick}
        borderRadius="xl"
        overflow="hidden"
        border="1px solid"
        borderColor={colors.borderColor}
        bg={{ base: "white", _dark: "gray.800" }}
        boxShadow="md"
      >
        <Card.Body p={6}>
          <VStack align="stretch" gap={4}>
            <HStack gap={3}>
              {icon && (
                <Box
                  p={3}
                  rounded="lg"
                  bg={colors.iconBgColor}
                  color={colors.iconColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minW={12}
                  h={12}
                >
                  <Text fontSize="xl">{icon}</Text>
                </Box>
              )}
              <VStack gap={1} align="start" flex={1}>
                <Text fontWeight="semibold" color={{ base: "gray.900", _dark: "white" }} fontSize="lg">
                  {title}
                </Text>
                <Text fontSize="sm" color={{ base: "gray.600", _dark: "gray.400" }} lineHeight="1.4">
                  {description}
                </Text>
                {badgeText && (
                  <Badge colorPalette={colors.badgeColor} size="sm" mt={1}>
                    {badgeText}
                  </Badge>
                )}
              </VStack>
            </HStack>
            {children}
          </VStack>
        </Card.Body>
      </Card.Root>
    </GridItem>
  );
};

export default InfoCard;