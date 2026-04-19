import React, { useEffect, useState } from 'react';
import { Box, H2, Text, Button, Input, Label, Loader, MessageBox } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const EcomSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [taxRate, setTaxRate] = useState('0.08');
  const [currency, setCurrency] = useState('USD');
  const [siteName, setSiteName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    const api = new ApiClient();
    api
      .getPage({ pageName: 'Settings' })
      .then((res) => {
        const s = res.data?.settings || {};
        setTaxRate(String(s.tax_rate ?? '0.08'));
        setCurrency(String(s.currency ?? 'USD'));
        setSiteName(String(s.site_name ?? 'Demo eCommerce'));
        setSupportEmail(String(s.support_email ?? 'support@example.com'));
      })
      .catch((e) => {
        setError(e?.response?.data?.error || e?.message || 'Failed to load settings');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError(null);
    setNotice(null);
    const api = new ApiClient();
    const data = new FormData();
    data.append('tax_rate', taxRate);
    data.append('currency', currency.trim().toUpperCase());

    try {
      const res = await api.getPage({
        pageName: 'Settings',
        method: 'post',
        data,
      });

      if (res.data?.ok === false) {
        setError(res.data.error || 'Save failed');
        return;
      }

      setNotice('Settings updated.');
      const s = res.data?.settings || {};
      setTaxRate(String(s.tax_rate ?? taxRate));
      setCurrency(String(s.currency ?? currency).toUpperCase());
      setSiteName(String(s.site_name ?? siteName));
      setSupportEmail(String(s.support_email ?? supportEmail));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Save failed');
    }
  };

  if (loading) {
    return (
      <Box p="xxl" display="flex" justifyContent="center">
        <Loader />
      </Box>
    );
  }

  return (
    <Box p="xxl" maxWidth={760}>
      <H2 mb="lg">Settings</H2>

      {error && (
        <Box mb="md">
          <MessageBox message={error} variant="danger" onCloseClick={() => setError(null)} />
        </Box>
      )}

      {notice && (
        <Box mb="md">
          <MessageBox message={notice} variant="success" onCloseClick={() => setNotice(null)} />
        </Box>
      )}

      <Box p="xl" bg="white" boxShadow="card" borderRadius="default">
        <Text mb="lg" color="grey60">
          Editable settings are stored in the database. Site name and support email are read from
          environment variables.
        </Text>

        <Box mb="lg">
          <Label>Tax Rate</Label>
          <Input width={1} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </Box>

        <Box mb="lg">
          <Label>Currency</Label>
          <Input
            width={1}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </Box>

        <Box mb="lg">
          <Label>SITE_NAME (read-only)</Label>
          <Input width={1} value={siteName} disabled />
        </Box>

        <Box mb="xl">
          <Label>SUPPORT_EMAIL (read-only)</Label>
          <Input width={1} value={supportEmail} disabled />
        </Box>

        <Button variant="primary" onClick={save}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default EcomSettingsPage;
