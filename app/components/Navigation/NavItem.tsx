'use client';

import Link from "next/link";
import React, { useState } from "react";
import { IconType } from "react-icons";
import { useRouter } from "next/navigation";

interface NavigationLinkItem {
  type: "link";
  label: string;
  icon: IconType;
  path: string;
}

type NavigationItem = NavigationLinkItem;

interface NavItemProps {
  item: NavigationItem;
  isActive?: boolean;
}

export const NavItem = ({ item, isActive }: NavItemProps) => {
  const router = useRouter();
  const { label, icon: IconComponent, path } = item;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (label === "Logout") {
      // Handle logout functionality
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const getBackgroundColor = () => {
    if (isActive) return '#ffc9a3';
    if (isHovered) return '#f8f9fa';
    return 'transparent';
  };

  const getTextColor = () => {
    if (isActive) return '#ff6b35';
    if (isHovered) return '#343a40';
    return '#6c757d';
  };

  return (
    <div className="w-100">
      <Link
        href={path}
        onClick={handleClick}
        className="d-flex align-items-center gap-3 p-3 rounded text-decoration-none small"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.2s',
        }}
      >
        <IconComponent size={20} />
        <span>{label}</span>
      </Link>
    </div>
  );
};