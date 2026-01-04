"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { Button, Badge, Form, Alert, Spinner, Container } from "react-bootstrap";

interface DebugLog {
    id: string;
    timestamp: string;
    level: "DEBUG" | "INFO" | "WARN" | "ERROR";
    category: string;
    message: string;
    metadata?: any;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    userAgent?: string;
    ip?: string;
    createdAt: string;
}

export default function DebugLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filter, setFilter] = useState({
        level: "",
        category: "",
        search: "",
    });
    const [autoScroll, setAutoScroll] = useState(true);
    const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Fetch logs from API
    const fetchLogs = async () => {
        try {
            const response = await fetch("/api/debug/logs?limit=200");
            const result = await response.json();

            if (result.success) {
                setLogs(result.data.logs);
                setError(null);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Failed to fetch logs");
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    // Clear all logs
    const clearLogs = async () => {
        try {
            const response = await fetch("/api/debug/logs", {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                setLogs([]);
                setError(null);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Failed to clear logs");
            console.error("Error clearing logs:", err);
        }
    };

    useEffect(() => {
        // Check if user is logged in
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
        }
    }, [router]);

    // Real-time SSE connection
    useEffect(() => {
        if (!autoRefresh) return;

        console.log("Connecting to SSE stream...");
        const eventSource = new EventSource("/api/debug/stream");

        eventSource.onopen = () => {
            setError(null);
            setLoading(false);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "init") {
                    // Initial load of existing logs
                    setLogs(data.logs || []);
                } else if (data.type === "newLog") {
                    // New log added - append to existing logs
                    setLogs((prev) => [...prev, data.log]);
                } else if (data.type === "logsCleared") {
                    // All logs cleared
                    setLogs([]);
                }
                // Ignore heartbeat messages
            } catch (error) {
                console.error("Error parsing SSE data:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            setError("Connection lost. Trying to reconnect...");
            eventSource.close();

            // Try to reconnect after 3 seconds
            setTimeout(() => {
                if (autoRefresh) {
                    // This will trigger a re-run of the useEffect
                    setError(null);
                }
            }, 3000);
        };

        return () => {
            console.log("Closing SSE connection");
            eventSource.close();
        };
    }, [autoRefresh]);

    // Initial load when auto-refresh is disabled
    useEffect(() => {
        if (!autoRefresh) {
            fetchLogs();
        }
    }, [autoRefresh]);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, autoScroll]);

    // Filter logs
    const filteredLogs = logs.filter((log) => {
        if (filter.level && log.level !== filter.level) return false;
        if (
            filter.category &&
            !log.category.toLowerCase().includes(filter.category.toLowerCase())
        )
            return false;
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            return (
                log.message.toLowerCase().includes(searchTerm) ||
                log.url?.toLowerCase().includes(searchTerm) ||
                log.method?.toLowerCase().includes(searchTerm)
            );
        }
        return true;
    });


    // Format timestamp in console style
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${milliseconds}`;
    };

    // Get level number for console-style display
    const getLevelNumber = (level: string) => {
        switch (level) {
            case "ERROR": return "1";
            case "WARN": return "2";
            case "INFO": return "4";
            case "DEBUG": return "8";
            default: return "4";
        }
    };

    // Format log line in console style
    const formatLogLine = (log: DebugLog) => {
        const timestamp = formatTimestamp(log.timestamp);
        const levelNum = getLevelNumber(log.level);
        const level = log.level.toUpperCase();
        return `${timestamp} ${levelNum} ${level} ? ${log.category}: ${log.message}`;
    };

    // Get level colors for console display
    const getLevelTextColor = (level: string) => {
        switch (level) {
            case "ERROR": return "#ff6b6b";
            case "WARN": return "#ffd43b";
            case "INFO": return "#51cf66";
            case "DEBUG": return "#74c0fc";
            default: return "#adb5bd";
        }
    };

    // Get background color for selected/hover states
    const getLevelBackground = (level: string, isSelected: boolean) => {
        if (isSelected) {
            return "#4b4a4a";
        }
        switch (level) {
            case "ERROR": return "rgba(255, 107, 107, 0.1)";
            case "WARN": return "rgba(255, 212, 59, 0.1)";
            default: return "transparent";
        }
    };

    // Download logs as JSON
    const downloadLogs = () => {
        const dataStr = JSON.stringify(filteredLogs, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `debug-logs-${
            new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Toggle expand/collapse for a specific log
    const toggleLogExpansion = (logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    // Get unique categories for filter badges
    const uniqueCategories = [...new Set(logs.map(log => log.category))];

    return (
        <Container fluid className="p-4">
            <div className="d-flex flex-column gap-3" style={{ height: '100vh' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h2 className="fw-bold mb-0">
                        Debug Console
                    </h2>
                    <Badge bg="primary" className="fs-6">
                        {filteredLogs.length} logs
                    </Badge>
                </div>

                {/* Controls */}
                <div className="d-flex gap-3 flex-wrap">
                    <Button
                        size="sm"
                        onClick={clearLogs}
                        variant="outline-danger"
                        disabled={logs.length === 0}
                    >
                        Clear Logs
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        variant={autoRefresh ? "outline-success" : "outline-warning"}
                    >
                        {autoRefresh ? "Real-time ON" : "Real-time OFF"}
                    </Button>

                    <Button
                        size="sm"
                        onClick={downloadLogs}
                        variant="outline-primary"
                        disabled={filteredLogs.length === 0}
                    >
                        Export
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setAutoScroll(!autoScroll)}
                        variant={autoScroll ? "outline-primary" : "outline-secondary"}
                    >
                        Auto-scroll: {autoScroll ? "On" : "Off"}
                    </Button>

                    <Button
                        size="sm"
                        onClick={fetchLogs}
                        disabled={loading}
                        variant="outline-secondary"
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : "Refresh"}
                    </Button>
                </div>

                {/* Filters */}
                <div className="d-flex gap-4">
                    <div>
                        <p className="small mb-2">Search Messages</p>
                        <Form.Control
                            type="text"
                            placeholder="Filter logs by message or category..."
                            value={filter.search}
                            onChange={(e) =>
                                setFilter((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }))
                            }
                            size="sm"
                            style={{ width: "300px" }}
                        />
                    </div>

                    <div>
                        <p className="small mb-2">Category</p>
                        <Form.Control
                            type="text"
                            placeholder="Filter by category (API, AUTH, etc.)"
                            value={filter.category}
                            onChange={(e) =>
                                setFilter((prev) => ({
                                    ...prev,
                                    category: e.target.value,
                                }))
                            }
                            size="sm"
                            style={{ width: "200px" }}
                        />
                    </div>

                    <div>
                        <p className="small mb-2">Level</p>
                        <Form.Select
                            value={filter.level}
                            onChange={(e) =>
                                setFilter((prev) => ({
                                    ...prev,
                                    level: e.target.value,
                                }))
                            }
                            size="sm"
                            style={{ width: "120px" }}
                        >
                            <option value="">All levels</option>
                            <option value="ERROR">ERROR</option>
                            <option value="WARN">WARN</option>
                            <option value="INFO">INFO</option>
                            <option value="DEBUG">DEBUG</option>
                        </Form.Select>
                    </div>
                </div>

                {/* Category badges */}
                <div className="d-flex gap-2 flex-wrap align-items-center">
                    <span className="small text-muted">Categories:</span>
                    {uniqueCategories.map(cat => (
                        <Badge
                            key={cat}
                            bg={filter.category === cat ? "primary" : "secondary"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setFilter(prev => ({ ...prev, category: filter.category === cat ? "" : cat }))}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>

                <hr className="my-2" />

                {/* Error Message */}
                {error && (
                    <Alert variant="danger">
                        {error}
                    </Alert>
                )}

                {/* Instructions */}
                <Alert variant="info">
                    To capture API calls in debug logs, add{" "}
                    <code>?debug=1</code> to any API endpoint URL.
                    Example: <code>/api/ebay/check-scopes?debug=1</code>
                    {autoRefresh &&
                        " • Real-time mode: New logs appear instantly when added to database."}
                </Alert>

                {/* Console Logs */}
                <div
                    className="flex-grow-1 overflow-auto rounded font-monospace small"
                    style={{
                        backgroundColor: "black",
                        color: "white",
                        padding: "1rem",
                        maxHeight: "60vh",
                    }}
                >
                    <div className="d-flex flex-column gap-1">
                        {loading && logs.length === 0 ? (
                            <p className="text-secondary text-center py-4">
                                <Spinner size="sm" /> Loading logs...
                            </p>
                        ) : filteredLogs.length === 0 ? (
                            <p className="text-secondary text-center py-4">
                                {logs.length === 0
                                    ? "No logs yet. Make some API calls with ?debug=1 to see logs here!"
                                    : "No logs match your filters."}
                            </p>
                        ) : (
                            filteredLogs.map((log, index) => {
                                const isSelected = selectedLogIndex === index;
                                const isExpanded = expandedLogs.has(log.id);
                                const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                                return (
                                    <div
                                        key={log.id}
                                        className="px-2 rounded"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            backgroundColor: getLevelBackground(log.level, isSelected),
                                        }}
                                    >
                                        <div
                                            className="d-flex gap-2 align-items-start"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedLogIndex(isSelected ? null : index)}
                                        >
                                            {/* Expand/Collapse Icon */}
                                            {hasMetadata && (
                                                <span
                                                    className="text-secondary small"
                                                    style={{
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                        width: "12px",
                                                        textAlign: "center",
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleLogExpansion(log.id);
                                                    }}
                                                >
                                                    {isExpanded ? "−" : "+"}
                                                </span>
                                            )}
                                            {!hasMetadata && (
                                                <span style={{ width: "12px" }} />
                                            )}

                                            {/* Log Line */}
                                            <span
                                                className="font-monospace flex-grow-1"
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: getLevelTextColor(log.level),
                                                    whiteSpace: "pre-wrap",
                                                    lineHeight: "1.2",
                                                    userSelect: "text",
                                                }}
                                            >
                                                {formatLogLine(log)}
                                            </span>
                                        </div>

                                        {/* Expanded Metadata */}
                                        {hasMetadata && isExpanded && (
                                            <div
                                                style={{
                                                    paddingLeft: "1.5rem",
                                                    paddingTop: "0.25rem",
                                                    borderLeft: "1px solid #6c757d",
                                                    marginLeft: "0.5rem",
                                                }}
                                            >
                                                <pre
                                                    className="font-monospace text-secondary mb-0"
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        whiteSpace: "pre-wrap",
                                                        userSelect: "text",
                                                        lineHeight: "1.3",
                                                    }}
                                                >
                                                    {typeof log.metadata === "object"
                                                        ? JSON.stringify(log.metadata, null, 2)
                                                        : log.metadata
                                                    }
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Status */}
                <div className="d-flex justify-content-between">
                    <div className="d-flex gap-3">
                        <Badge bg="success">
                            Connected
                        </Badge>
                        {!autoRefresh && (
                            <Badge bg="warning">
                                Real-time Paused
                            </Badge>
                        )}
                    </div>

                    <p className="small text-muted mb-0">
                        Last updated: {logs.length > 0 ? new Date(logs[logs.length - 1]?.timestamp).toLocaleTimeString() : "Never"}
                    </p>
                </div>
            </div>
        </Container>
    );
}
