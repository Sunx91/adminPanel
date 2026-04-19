import React, { useEffect, useState } from 'react';
import {
  Box,
  H2,
  Text,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Loader,
} from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const formatUsd = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const Metric = ({ label, children }) => (
  <Box
    p="lg"
    bg="white"
    boxShadow="card"
    borderRadius="default"
    flex="1 1 150px"
    minWidth={150}
    maxWidth={220}
  >
    <Text fontSize="sm" color="grey60">
      {label}
    </Text>
    <Text fontSize="xl" fontWeight="bold" mt="sm">
      {children}
    </Text>
  </Box>
);

const SectionTitle = ({ children }) => (
  <Text as="h3" fontSize="lg" fontWeight="bold" mb="md" color="grey100">
    {children}
  </Text>
);

const EcomDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const api = new ApiClient();
    api
      .getDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch((e) => {
        setError(e?.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box p="xxl" display="flex" justifyContent="center">
        <Loader />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="xxl">
        <Text color="error">{error}</Text>
      </Box>
    );
  }

  if (!data || !data.role) {
    return (
      <Box p="xxl">
        <Text>No dashboard data.</Text>
      </Box>
    );
  }

  if (data.role === 'admin') {
    const s = data.stats || {};
    const orders = data.recentOrders || [];

    return (
      <Box p="xxl" maxWidth={1200}>
        <H2 mb="lg">Overview</H2>

        <Box display="flex" flexWrap="wrap" style={{ gap: 16 }} mb="xxl">
          <Metric label="Users">{s.userCount ?? 0}</Metric>
          <Metric label="Products">{s.productCount ?? 0}</Metric>
          <Metric label="Categories">{s.categoryCount ?? 0}</Metric>
          <Metric label="All orders">{s.orderCount ?? 0}</Metric>
          <Metric label="Pending orders">{s.pendingOrders ?? 0}</Metric>
          <Metric label="Completed orders">{s.completedOrders ?? 0}</Metric>
          <Metric label="Total revenue (USD)">{formatUsd(s.totalRevenue)}</Metric>
          <Metric label={`Low stock (≤${s.lowStockThreshold ?? 10} units)`}>{s.lowStockProducts ?? 0}</Metric>
        </Box>

        <SectionTitle>Recent orders</SectionTitle>
        <Text fontSize="sm" color="grey60" mb="md">
          Last 5 orders across the store
        </Text>

        {orders.length === 0 ? (
          <Text color="grey60">No orders yet.</Text>
        ) : (
          <Box bg="white" boxShadow="card" borderRadius="default" overflow="hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.id}</TableCell>
                    <TableCell>{o.customerEmail || '—'}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>{formatUsd(o.total)}</TableCell>
                    <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    );
  }

  const profile = data.profile || {};
  const orders = data.recentOrders || [];
  const items = data.recentOrderItems || [];

  return (
    <Box p="xxl" maxWidth={960}>
      <H2 mb="lg">Your dashboard</H2>

      <Box mb="xxl" p="lg" bg="white" boxShadow="card" borderRadius="default">
        <Text fontSize="sm" color="grey60">
          Signed in as
        </Text>
        <Text mt="xs">
          <strong>{profile.email}</strong>
          <Text as="span" color="grey60" ml="sm">
            ({profile.role})
          </Text>
        </Text>
      </Box>

      <SectionTitle>Your recent orders</SectionTitle>
      <Text fontSize="sm" color="grey60" mb="md">
        Up to 5 most recent orders
      </Text>
      {orders.length === 0 ? (
        <Text color="grey60" mb="xxl">
          No orders yet.
        </Text>
      ) : (
        <Box bg="white" boxShadow="card" borderRadius="default" overflow="hidden" mb="xxl">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>{formatUsd(o.total)}</TableCell>
                  <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <SectionTitle>Your order line items</SectionTitle>
      <Text fontSize="sm" color="grey60" mb="md">
        Recent lines from your orders (product, quantity, line price)
      </Text>
      {items.length === 0 ? (
        <Text color="grey60">No line items yet.</Text>
      ) : (
        <Box bg="white" boxShadow="card" borderRadius="default" overflow="hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Order status</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Line total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => {
                const line = Number(row.quantity) * Number(row.unitPrice);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>#{row.orderId}</TableCell>
                    <TableCell>{row.orderStatus}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{formatUsd(row.unitPrice)}</TableCell>
                    <TableCell>{formatUsd(line)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default EcomDashboard;
