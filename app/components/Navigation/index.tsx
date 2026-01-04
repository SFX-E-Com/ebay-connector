'use client';

import { MdOutlineSpaceDashboard, MdLogout, MdOutlinePeople, MdVpnKey, MdOutlineStore, MdBugReport, MdBook, MdInventory, MdApi, MdShoppingCart } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";

interface NavigationItemProps {
  icon: any;
  text?: string;
  isActive?: boolean;
  collapse?: boolean;
  onClick?: () => void;
}

function NavigationItem({ icon: Icon, text, isActive, collapse, onClick }: NavigationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`d-flex gap-3 p-3 rounded w-100 ${isActive ? 'bg-primary-subtle' : ''}`}
      style={{
        cursor: 'pointer',
        backgroundColor: !isActive && isHovered ? '#f8f9fa' : undefined,
        justifyContent: collapse ? 'center' : 'flex-start'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`d-flex align-items-center ${isActive ? 'text-primary' : 'text-secondary'}`}
        style={{ fontSize: '16px' }}
      >
        <Icon size={16} />
      </div>
      {!collapse && text && (
        <span
          className={`small ${isActive ? 'fw-semibold text-primary' : 'fw-medium text-secondary'}`}
        >
          {text}
        </span>
      )}
    </div>
  );
}

interface NavigationProps {
  collapse?: boolean;
}

export function Navigation({ collapse }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch('/api/debug/logs');
        if (response.status === 200) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, []);

  // Get navigation items (including debug logs for super admins)
  const getNavigationItems = () => {
    const baseItems = [
      { text: "Dashboard", icon: MdOutlineSpaceDashboard, path: "/" },
      { text: "Users", icon: MdOutlinePeople, path: "/users" },
      { text: "API Tokens", icon: MdVpnKey, path: "/api-tokens" },
      { text: "eBay Accounts", icon: MdOutlineStore, path: "/ebay-connections" },
      { text: "Products", icon: MdInventory, path: "/products" },
      { text: "API Documentation", icon: MdApi, path: "/api-documentation" },
    ];

    if (isSuperAdmin) {
      baseItems.push({ text: "Orders Debug", icon: MdShoppingCart, path: "/orders-debug" });
      baseItems.push({ text: "Debug Logs", icon: MdBugReport, path: "/debug-logs" });
    }

    baseItems.push({ text: "Logout", icon: MdLogout, path: "/login" });
    return baseItems;
  };

  const handleItemClick = (item: any) => {
    if (item.text === "Logout") {
      // Handle logout functionality
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      router.push(item.path);
    }
  };

  const isItemActive = (item: any) => {
    // For Dashboard, check if we're on homepage
    if (item.text === "Dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    // For Users, check if we're on users page
    if (item.text === "Users") {
      return pathname === "/users";
    }
    // For API Tokens, check if we're on api-tokens page
    if (item.text === "API Tokens") {
      return pathname === "/api-tokens";
    }
    // For eBay Accounts, check if we're on ebay-connections page
    if (item.text === "eBay Accounts") {
      return pathname === "/ebay-connections";
    }
    // For Products, check if we're on products page
    if (item.text === "Products") {
      return pathname === "/products";
    }
    // For Documentation, check if we're on documentation page
    if (item.text === "Documentation") {
      return pathname === "/documentation";
    }
    // For API Documentation, check if we're on api-documentation page
    if (item.text === "API Documentation") {
      return pathname === "/api-documentation";
    }
    // For Debug Logs, check if we're on debug-logs page
    if (item.text === "Debug Logs") {
      return pathname === "/debug-logs";
    }
    // For Orders Debug, check if we're on orders-debug page
    if (item.text === "Orders Debug") {
      return pathname === "/orders-debug";
    }
    // For Logout, never mark as active
    if (item.text === "Logout") {
      return false;
    }
    // Default path matching
    return pathname === item.path;
  };

  const navItems = getNavigationItems();

  return (
    <div className="d-flex flex-column gap-1 mt-4">
      {navItems.map((item, index) => (
        <NavigationItem
          key={index}
          icon={item.icon}
          text={item.text}
          isActive={isItemActive(item)}
          collapse={collapse}
          onClick={() => handleItemClick(item)}
        />
      ))}
    </div>
  );
}