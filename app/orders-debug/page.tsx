"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Badge, Card, Spinner, Alert, Button, Table, Form } from "react-bootstrap";
import { MdRefresh, MdSearch, MdLocalShipping } from "react-icons/md";
import PageHeader from "@/app/components/common/PageHeader";

interface EbayAccount {
    id: string;
    friendlyName: string | null;
    ebayUsername: string | null;
    status: string;
}

interface Order {
    orderId: string;
    legacyOrderId?: string;
    creationDate: string;
    orderFulfillmentStatus: string;
    orderPaymentStatus: string;
    buyer: {
        username: string;
    };
    pricingSummary: {
        total: {
            value: string;
            currency: string;
        };
    };
    lineItems: Array<{
        lineItemId: string;
        title: string;
        quantity: number;
        sku?: string;
        lineItemFulfillmentStatus: string;
    }>;
}

export default function OrdersDebugPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<EbayAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");

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

    const loadOrders = async () => {
        if (!selectedAccountId) return;

        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            let url = `/api/ebay/${selectedAccountId}/orders?limit=50`;
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch orders');
            }

            const data = await response.json();
            setOrders(data.data?.orders || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FULFILLED': return 'success';
            case 'IN_PROGRESS': return 'warning';
            case 'NOT_STARTED': return 'danger';
            case 'PAID': return 'success';
            case 'PENDING': return 'warning';
            default: return 'secondary';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('de-DE');
    };

    return (
        <div className="p-4 p-md-5">
            <div className="d-flex flex-column gap-4">
                {/* Page Header */}
                <PageHeader
                    title="Orders Debug"
                    subtitle="View eBay orders for debugging purposes"
                    showRefresh={true}
                    onRefresh={loadOrders}
                    isRefreshing={loading}
                />

                {/* Account Selection */}
                <Card>
                    <Card.Body>
                        <div className="d-flex flex-wrap gap-3">
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <p className="fw-medium mb-2">eBay Account</p>
                                <Form.Select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    disabled={accountsLoading}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.friendlyName || acc.ebayUsername || acc.id}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <p className="fw-medium mb-2">Status Filter</p>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Orders</option>
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="FULFILLED">Fulfilled</option>
                                </Form.Select>
                            </div>

                            <div>
                                <p className="fw-medium mb-2">&nbsp;</p>
                                <Button
                                    variant="primary"
                                    onClick={loadOrders}
                                    disabled={!selectedAccountId || loading}
                                >
                                    <MdSearch /> Load Orders
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => {}}>
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                        <p className="mt-3">Loading orders...</p>
                    </div>
                )}

                {/* Orders List */}
                {!loading && orders.length > 0 && (
                    <Card>
                        <Card.Header>
                            <p className="fw-bold mb-0">Orders ({orders.length})</p>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Buyer</th>
                                        <th>Total</th>
                                        <th>Items</th>
                                        <th>Payment</th>
                                        <th>Fulfillment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.orderId}>
                                            <td>
                                                <span className="small font-monospace">
                                                    {order.orderId.substring(0, 12)}...
                                                </span>
                                            </td>
                                            <td>
                                                <span className="small">{formatDate(order.creationDate)}</span>
                                            </td>
                                            <td>
                                                <span className="small">{order.buyer.username}</span>
                                            </td>
                                            <td>
                                                <span className="fw-bold">
                                                    {order.pricingSummary.total.value} {order.pricingSummary.total.currency}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    {order.lineItems.map(item => (
                                                        <span key={item.lineItemId} className="small">
                                                            {item.quantity}x {item.title.substring(0, 30)}...
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={getStatusColor(order.orderPaymentStatus)}>
                                                    {order.orderPaymentStatus}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={getStatusColor(order.orderFulfillmentStatus)}>
                                                    {order.orderFulfillmentStatus}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}

                {/* No Orders */}
                {!loading && !error && orders.length === 0 && selectedAccountId && (
                    <Card>
                        <Card.Body className="text-center py-5">
                            <p className="text-muted">No orders found. Click "Load Orders" to fetch from eBay.</p>
                        </Card.Body>
                    </Card>
                )}

                {/* No Account Selected */}
                {!accountsLoading && accounts.length === 0 && (
                    <Alert variant="warning" dismissible onClose={() => {}}>
                        No eBay accounts connected. Please connect an eBay account first.
                    </Alert>
                )}
            </div>
        </div>
    );
}
