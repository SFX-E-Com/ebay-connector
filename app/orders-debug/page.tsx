"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Card,
    Spinner,
    Alert,
    Button,
    Table,
    Input,
    NativeSelect as Select
} from "@chakra-ui/react";
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
            case 'FULFILLED': return 'green';
            case 'IN_PROGRESS': return 'yellow';
            case 'NOT_STARTED': return 'red';
            case 'PAID': return 'green';
            case 'PENDING': return 'yellow';
            default: return 'gray';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('de-DE');
    };

    return (
        <Box p={8}>
            <VStack gap={6} align="stretch">
                {/* Page Header */}
                <PageHeader
                    title="Orders Debug"
                    subtitle="View eBay orders for debugging purposes"
                    showRefresh={true}
                    onRefresh={loadOrders}
                    isRefreshing={loading}
                />

                {/* Account Selection */}
                <Card.Root>
                    <Card.Body>
                        <HStack gap={4} flexWrap="wrap">
                            <Box flex="1" minW="200px">
                                <Text fontWeight="medium" mb={2}>eBay Account</Text>
                                <Select.Root
                                    value={[selectedAccountId]}
                                    onValueChange={(e) => setSelectedAccountId(e.value[0])}
                                    disabled={accountsLoading}
                                >
                                    <Select.Field>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.friendlyName || acc.ebayUsername || acc.id}
                                            </option>
                                        ))}
                                    </Select.Field>
                                </Select.Root>
                            </Box>

                            <Box flex="1" minW="200px">
                                <Text fontWeight="medium" mb={2}>Status Filter</Text>
                                <Select.Root
                                    value={[statusFilter]}
                                    onValueChange={(e) => setStatusFilter(e.value[0])}
                                >
                                    <Select.Field>
                                        <option value="all">All Orders</option>
                                        <option value="NOT_STARTED">Not Started</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="FULFILLED">Fulfilled</option>
                                    </Select.Field>
                                </Select.Root>
                            </Box>

                            <Box>
                                <Text fontWeight="medium" mb={2}>&nbsp;</Text>
                                <Button
                                    colorPalette="orange"
                                    onClick={loadOrders}
                                    disabled={!selectedAccountId || loading}
                                >
                                    <MdSearch /> Load Orders
                                </Button>
                            </Box>
                        </HStack>
                    </Card.Body>
                </Card.Root>

                {/* Error Alert */}
                {error && (
                    <Alert.Root status="error" borderRadius="md">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Description>{error}</Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {/* Loading */}
                {loading && (
                    <Box textAlign="center" py={10}>
                        <Spinner size="xl" color="orange.500" />
                        <Text mt={4}>Loading orders...</Text>
                    </Box>
                )}

                {/* Orders List */}
                {!loading && orders.length > 0 && (
                    <Card.Root>
                        <Card.Header>
                            <Text fontWeight="bold">Orders ({orders.length})</Text>
                        </Card.Header>
                        <Card.Body p={0}>
                            <Table.Root>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeader>Order ID</Table.ColumnHeader>
                                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                                        <Table.ColumnHeader>Buyer</Table.ColumnHeader>
                                        <Table.ColumnHeader>Total</Table.ColumnHeader>
                                        <Table.ColumnHeader>Items</Table.ColumnHeader>
                                        <Table.ColumnHeader>Payment</Table.ColumnHeader>
                                        <Table.ColumnHeader>Fulfillment</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {orders.map(order => (
                                        <Table.Row key={order.orderId}>
                                            <Table.Cell>
                                                <Text fontSize="sm" fontFamily="mono">
                                                    {order.orderId.substring(0, 12)}...
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text fontSize="sm">{formatDate(order.creationDate)}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text fontSize="sm">{order.buyer.username}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text fontWeight="bold">
                                                    {order.pricingSummary.total.value} {order.pricingSummary.total.currency}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <VStack align="start" gap={1}>
                                                    {order.lineItems.map(item => (
                                                        <Text key={item.lineItemId} fontSize="xs">
                                                            {item.quantity}x {item.title.substring(0, 30)}...
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge colorPalette={getStatusColor(order.orderPaymentStatus)}>
                                                    {order.orderPaymentStatus}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge colorPalette={getStatusColor(order.orderFulfillmentStatus)}>
                                                    {order.orderFulfillmentStatus}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Card.Body>
                    </Card.Root>
                )}

                {/* No Orders */}
                {!loading && !error && orders.length === 0 && selectedAccountId && (
                    <Card.Root>
                        <Card.Body textAlign="center" py={10}>
                            <Text color="gray.500">No orders found. Click "Load Orders" to fetch from eBay.</Text>
                        </Card.Body>
                    </Card.Root>
                )}

                {/* No Account Selected */}
                {!accountsLoading && accounts.length === 0 && (
                    <Alert.Root status="warning" borderRadius="md">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Description>
                                No eBay accounts connected. Please connect an eBay account first.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                )}
            </VStack>
        </Box>
    );
}
