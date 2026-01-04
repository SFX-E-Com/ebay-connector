'use client';

import React, { useEffect, useState } from "react";
import { Navigation } from "../Navigation";
import { Badge } from "react-bootstrap";

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export default function Sidebar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <React.Fragment>
            <div className="w-100">
                <Navigation />
            </div>
            {user && (
                <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: '40px', height: '40px', fontSize: '0.875rem' }}
                >
                    {getInitials(user.name || user.email)}
                </div>
            )}
        </React.Fragment>
    );
}
