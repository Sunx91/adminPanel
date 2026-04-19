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

const Metric = ({ label, children, accent }) => (
  <Box
    p="lg"
    bg="white"
    boxShadow="card"
    borderRadius="default"
    flex="1 1 220px"
    minWidth={220}
    borderLeft={accent ? '4px solid' : undefined}
    borderLeftColor={accent || undefined}
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

/** Completed-order revenue by month (SVG area + line, no extra deps). */
function RevenueChart({ series }) {
  if (!series || series.length === 0) return null;

  const w = 1200;
  const h = 360;
  const pad = { t: 28, r: 28, b: 64, l: 68 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxVal = Math.max(...series.map((s) => s.revenue), 1);
  const n = series.length;

  const coords = series.map((s, i) => {
    const x = n > 1 ? pad.l + (i / (n - 1)) * cw : pad.l + cw / 2;
    const y = pad.t + ch - (s.revenue / maxVal) * ch;
    return { x, y, ...s };
  });

  const lineD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaD = `${lineD} L ${last.x} ${pad.t + ch} L ${first.x} ${pad.t + ch} Z`;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => pad.t + ch - t * ch);

  return (
    <Box
      as="figure"
      m={0}
      p="lg"
      bg="white"
      boxShadow="card"
      borderRadius="default"
      style={{ overflow: 'hidden' }}
    >
      <Text fontSize="sm" fontWeight="bold" color="grey100" mb="sm">
        Income by month
      </Text>
      <Text fontSize="sm" color="grey60" mb="md">
        Sum of paid-order totals (last 12 months, UTC).
      </Text>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="auto"
        style={{ maxHeight: 460, display: 'block' }}
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="dashboardRevenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4268F6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4268F6" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {gridYs.map((gy, idx) => (
          <line
            key={gy}
            x1={pad.l}
            x2={pad.l + cw}
            y1={gy}
            y2={gy}
            stroke="#e8eaf0"
            strokeWidth={idx === gridYs.length - 1 ? 1.5 : 1}
            strokeDasharray={idx === gridYs.length - 1 ? undefined : '4 5'}
          />
        ))}

        <text x={pad.l - 8} y={pad.t + 4} textAnchor="end" fontSize="11" fill="#8891a8">
          {formatUsd(maxVal)}
        </text>
        <text x={pad.l - 8} y={pad.t + ch / 2} textAnchor="end" fontSize="11" fill="#8891a8">
          {formatUsd(maxVal / 2)}
        </text>
        <text x={pad.l - 8} y={pad.t + ch} textAnchor="end" fontSize="11" fill="#8891a8">
          $0
        </text>

        <path d={areaD} fill="url(#dashboardRevenueFill)" />
        <path
          d={lineD}
          fill="none"
          stroke="#4268F6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((p) => (
          <g key={p.key}>
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#4268F6" strokeWidth="2.5" />
            <title>{`${p.label}: ${formatUsd(p.revenue)}`}</title>
          </g>
        ))}

        {coords.map((p) => {
          const short = p.label.split(' ')[0];
          const tilt =
            coords.length > 8 ? { transform: `rotate(-35 ${p.x} ${h - 12})` } : {};
          return (
            <text
              key={`lbl-${p.key}`}
              x={p.x}
              y={h - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#5c6478"
              {...tilt}
            >
              {short}
            </text>
          );
        })}
      </svg>
    </Box>
  );
}

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
    const incomeByMonth = data.incomeByMonth || [];

    return (
      <Box p="xxl" width="100%">
        <Box
          p="xxl"
          mb="xxl"
          borderRadius="12px"
          color="white"
          style={{
            background: 'linear-gradient(125deg, #141b2d 0%, #243056 42%, #3d5af1 100%)',
            boxShadow: '0 12px 40px rgba(36, 48, 86, 0.35)',
          }}
        >
          <Text fontSize="sm" opacity={0.85} letterSpacing="0.04em" textTransform="uppercase">
            Store overview
          </Text>
          <H2 mt="sm" mb="sm" style={{ color: 'white', fontWeight: 700 }}>
            Welcome back
          </H2>
          <Text opacity={0.9} fontSize="md" mt="md" style={{ maxWidth: 760 }}>
            This dashboard offers a centralized view of your store’s activity, allowing you to
            track users, products, orders, and overall system performance.
          </Text>
        </Box>

        <Box display="flex" flexWrap="wrap" style={{ gap: 16 }} mb="xxl">
          <Metric label="Users">{s.userCount ?? 0}</Metric>
          <Metric label="Products">{s.productCount ?? 0}</Metric>
          <Metric label="Categories">{s.categoryCount ?? 0}</Metric>
          <Metric label="All orders">{s.orderCount ?? 0}</Metric>
          <Metric label="Paid orders" accent="#3d5af1">
            {s.paidOrders ?? 0}
          </Metric>
          <Metric label="Revenue (paid orders)" accent="#0a7f35">
            {formatUsd(s.paidRevenue)}
          </Metric>
          <Metric label="Paid tax" accent="#c27803">
            {formatUsd(s.paidTax)}
          </Metric>
          <Text fontSize="xs" color="grey60" width="100%">
            Paid tax is estimated as paid revenue × current tax_rate.
          </Text>
        </Box>

        <Box mb="xxl">
          <RevenueChart series={incomeByMonth} />
        </Box>

        <SectionTitle>Recent orders</SectionTitle>
        <Text fontSize="sm" color="grey60" mb="md">
          Last 5 orders across the store
        </Text>

        {orders.length === 0 ? (
          <Text color="grey60">No orders yet.</Text>
        ) : (
          <Box
            bg="white"
            boxShadow="card"
            borderRadius="default"
            overflow="hidden"
            style={{ border: '1px solid #e8eaf0' }}
          >
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
                    <TableCell>
                      {o.customerName ? (
                        <>
                          <Text fontWeight="bold">{o.customerName}</Text>
                          <Text fontSize="sm" color="grey60">
                            {o.customerEmail || ''}
                          </Text>
                        </>
                      ) : (
                        o.customerEmail || '—'
                      )}
                    </TableCell>
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
          {profile.name ? (
            <>
              <strong>{profile.name}</strong>
              <Text as="span" color="grey60" ml="sm">
                {profile.email}
              </Text>
            </>
          ) : (
            <strong>{profile.email}</strong>
          )}
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
