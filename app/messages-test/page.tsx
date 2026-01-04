"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Badge, Card, Spinner, Alert, Button, Table, Form, Nav, Tab } from "react-bootstrap";
import { MdRefresh, MdSend, MdMail, MdMailOutline } from "react-icons/md";
import PageHeader from "@/app/components/common/PageHeader";

interface EbayAccount {
    id: string;
    friendlyName: string | null;
    ebayUsername: string | null;
}

interface Message {
    messageId: string;
    messageType: string;
    subject?: string;
    body?: string;
    sender?: string;
    creationDate: string;
    read: boolean;
    flagged: boolean;
    folder: string;
    itemId?: string;
    itemTitle?: string;
}

export default function MessagesTestPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<EbayAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Send message form
    const [itemId, setItemId] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [messageSubject, setMessageSubject] = useState("");
    const [questionType, setQuestionType] = useState("General");

    // Check auth and load accounts
    useEffect(() => {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!user || !token) {
            router.push('/login');
            return;
        }
        loadAccounts();
    }, [router]);

    const loadAccounts = async () => {
        try {
            setAccountsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ebay-accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
                if (data.accounts?.length > 0) {
                    setSelectedAccountId(data.accounts[0].id);
                }
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
        } finally {
            setAccountsLoading(false);
        }
    };

    const loadMessages = async () => {
        if (!selectedAccountId) return;

        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const response = await fetch(
                `/api/ebay/${selectedAccountId}/messages?limit=20&includeBody=true`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch messages');
            }

            const data = await response.json();
            setMessages(data.data?.messages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load messages');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedAccountId || !itemId || !recipientId || !messageBody) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const token = localStorage.getItem('token');

            const response = await fetch(
                `/api/ebay/${selectedAccountId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        itemId,
                        recipientId,
                        body: messageBody,
                        subject: messageSubject || undefined,
                        questionType,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to send message');
            }

            setSuccess('Message sent successfully!');
            setItemId('');
            setRecipientId('');
            setMessageBody('');
            setMessageSubject('');
            loadMessages(); // Refresh messages
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageId: string, read: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `/api/ebay/${selectedAccountId}/messages/${messageId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ read }),
                }
            );

            if (response.ok) {
                loadMessages(); // Refresh messages
            }
        } catch (err) {
            console.error('Error updating message:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('de-DE');
    };

    return (
        <div className="p-4 p-md-5">
            <div className="d-flex flex-column gap-4">
                <PageHeader
                    title="Messages Test"
                    subtitle="Test eBay Messaging API endpoints"
                    showRefresh={true}
                    onRefresh={loadMessages}
                    isRefreshing={loading}
                />

                {/* Account Selection */}
                <Card>
                    <Card.Body>
                        <div className="d-flex gap-3">
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <p className="fw-medium mb-2">eBay Account</p>
                                <Form.Select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.friendlyName || acc.ebayUsername || acc.id}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <div>
                                <p className="fw-medium mb-2">&nbsp;</p>
                                <Button
                                    variant="primary"
                                    onClick={loadMessages}
                                    disabled={!selectedAccountId || loading}
                                >
                                    <MdRefresh /> Load Messages
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Error/Success Alerts */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => {}}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" dismissible onClose={() => {}}>
                        {success}
                    </Alert>
                )}

                {/* Tabs */}
                <Tab.Container defaultActiveKey="inbox">
                    <Nav variant="tabs">
                        <Nav.Item>
                            <Nav.Link eventKey="inbox">
                                <MdMailOutline /> Inbox
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="send">
                                <MdSend /> Send Message
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {/* Inbox Tab */}
                    <Tab.Content>
                        <Tab.Pane eventKey="inbox">
                            {loading && (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                                    <p className="mt-3">Loading messages...</p>
                                </div>
                            )}

                            {!loading && messages.length > 0 && (
                                <Card className="mt-3">
                                    <Card.Header>
                                        <p className="fw-bold mb-0">Messages ({messages.length})</p>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>Status</th>
                                                    <th>Type</th>
                                                    <th>Subject</th>
                                                    <th>From</th>
                                                    <th>Date</th>
                                                    <th>Item</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {messages.map(message => (
                                                    <tr key={message.messageId}>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                {message.read ? (
                                                                    <MdMailOutline />
                                                                ) : (
                                                                    <MdMail />
                                                                )}
                                                                {message.flagged && (
                                                                    <Badge bg="danger">Flagged</Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="small">{message.messageType}</span>
                                                        </td>
                                                        <td>
                                                            <span className={message.read ? "" : "fw-bold"}>
                                                                {message.subject || '(No subject)'}
                                                            </span>
                                                            {message.body && (
                                                                <div className="small text-muted">
                                                                    {message.body.substring(0, 50)}...
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="small">{message.sender || 'N/A'}</span>
                                                        </td>
                                                        <td>
                                                            <span className="small">{formatDate(message.creationDate)}</span>
                                                        </td>
                                                        <td>
                                                            {message.itemTitle && (
                                                                <span className="small">{message.itemTitle.substring(0, 30)}...</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {!message.read && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => markAsRead(message.messageId, true)}
                                                                >
                                                                    Mark Read
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            )}

                            {!loading && messages.length === 0 && selectedAccountId && (
                                <Card className="mt-3">
                                    <Card.Body className="text-center py-5">
                                        <p className="text-muted">No messages found</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </Tab.Pane>

                    {/* Send Message Tab */}
                        <Tab.Pane eventKey="send">
                            <Card className="mt-3">
                                <Card.Header>
                                    <p className="fw-bold mb-0">Send New Message</p>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <p className="fw-medium mb-2">Item ID *</p>
                                            <Form.Control
                                                value={itemId}
                                                onChange={(e) => setItemId(e.target.value)}
                                                placeholder="Enter eBay item ID"
                                            />
                                        </div>

                                        <div>
                                            <p className="fw-medium mb-2">Recipient Username *</p>
                                            <Form.Control
                                                value={recipientId}
                                                onChange={(e) => setRecipientId(e.target.value)}
                                                placeholder="Enter buyer/seller username"
                                            />
                                        </div>

                                        <div>
                                            <p className="fw-medium mb-2">Subject</p>
                                            <Form.Control
                                                value={messageSubject}
                                                onChange={(e) => setMessageSubject(e.target.value)}
                                                placeholder="Optional subject"
                                            />
                                        </div>

                                        <div>
                                            <p className="fw-medium mb-2">Question Type</p>
                                            <Form.Select
                                                value={questionType}
                                                onChange={(e) => setQuestionType(e.target.value)}
                                            >
                                                <option value="General">General</option>
                                                <option value="Shipping">Shipping</option>
                                                <option value="Payment">Payment</option>
                                                <option value="MultipleItemShipping">Multiple Item Shipping</option>
                                            </Form.Select>
                                        </div>

                                        <div>
                                            <p className="fw-medium mb-2">Message *</p>
                                            <Form.Control
                                                as="textarea"
                                                value={messageBody}
                                                onChange={(e) => setMessageBody(e.target.value)}
                                                placeholder="Enter your message (max 2000 characters)"
                                                rows={6}
                                            />
                                            <div className="small text-muted mt-1">
                                                {messageBody.length} / 2000 characters
                                            </div>
                                        </div>

                                        <Button
                                            variant="primary"
                                            onClick={sendMessage}
                                            disabled={!itemId || !recipientId || !messageBody || loading}
                                        >
                                            <MdSend /> Send Message
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </div>
        </div>
    );
}
