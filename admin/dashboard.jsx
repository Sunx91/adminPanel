import React, { useEffect, useState } from 'react';
import { Box, H2, Text, Table, TableHead, TableRow, TableCell, TableBody, Loader } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const Stat = ({ label, value }) => (
  <Box p="lg" bg="white" boxShadow="card" borderRadius="default" width={1 / 4} minWidth={160}>
    <Text fontSize="sm" color="grey60">
      {label}
    </Text>
    <H2 mt="sm">
      {value}
    </H2>
  </Box>
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
    return (
      <Box p="xxl">
        <H2 mb="xl">Admin overview</H2>
        <Box display="flex" flexWrap="wrap" style={{ gap: 16 }}>
          <Stat label="Users" value={s.userCount ?? 0} />
          <Stat label="Orders" value={s.orderCount ?? 0} />
          <Stat label="Products" value={s.productCount ?? 0} />
          <Stat label="Categories" value={s.categoryCount ?? 0} />
          <Stat label="Revenue (paid + shipped)" value={`$${Number(s.revenue || 0).toFixed(2)}`} />
        </Box>
      </Box>
    );
  }

  const profile = data.profile || {};
  const orders = data.recentOrders || [];

  return (
    <Box p="xxl">
      <H2 mb="md">Your dashboard</H2>
      <Box mb="xl" p="lg" bg="white" boxShadow="card" borderRadius="default">
        <Text>
          Signed in as <strong>{profile.email}</strong> ({profile.role})
        </Text>
      </Box>
      <H2 mb="md">Recent orders</H2>
      {orders.length === 0 ? (
        <Text color="grey60">No orders yet.</Text>
      ) : (
        <Box bg="white" boxShadow="card" borderRadius="default" overflow="hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>${Number(o.total).toFixed(2)}</TableCell>
                  <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default EcomDashboard;
