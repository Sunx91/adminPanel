import React, { useEffect, useState } from 'react';
import {
  Box,
  H2,
  Text,
  Button,
  Input,
  Label,
  Loader,
  MessageBox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const EcomSettingsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    const api = new ApiClient();
    api
      .getPage({ pageName: 'configuration' })
      .then((res) => {
        setRows(res.data?.settings || []);
      })
      .catch((e) => {
        setError(e?.response?.data?.error || e?.message || 'Failed to load settings');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveRow = async (id, key, value) => {
    setNotice(null);
    const api = new ApiClient();
    const data = new FormData();
    data.append('id', String(id));
    data.append('key', key);
    data.append('value', value);
    try {
      const res = await api.getPage({
        pageName: 'configuration',
        method: 'post',
        data,
      });
      if (res.data?.settings) {
        setRows(res.data.settings);
      }
      setNotice('Saved.');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Save failed');
    }
  };

  const createRow = async () => {
    setNotice(null);
    if (!newKey.trim()) {
      setError('Key is required');
      return;
    }
    const api = new ApiClient();
    const data = new FormData();
    data.append('key', newKey.trim());
    data.append('value', newValue);
    try {
      const res = await api.getPage({
        pageName: 'configuration',
        method: 'post',
        data,
      });
      if (res.data?.settings) {
        setRows(res.data.settings);
      }
      setNewKey('');
      setNewValue('');
      setNotice('Setting created or updated.');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Create failed');
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
    <Box p="xxl">
      <H2 mb="lg">Configuration</H2>
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
      <Box mb="xl" p="lg" bg="white" boxShadow="card" borderRadius="default">
        <Text mb="md">Add or update a key-value setting.</Text>
        <Box display="flex" flexWrap="wrap" style={{ gap: 12 }} alignItems="flex-end">
          <Box flexGrow={1} minWidth={180}>
            <Label>Key</Label>
            <Input width={1} value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          </Box>
          <Box flexGrow={2} minWidth={220}>
            <Label>Value</Label>
            <Input width={1} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          </Box>
          <Button variant="primary" onClick={createRow}>
            Save key
          </Button>
        </Box>
      </Box>
      <Box bg="white" boxShadow="card" borderRadius="default" overflow="hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell width={120} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <SettingRow key={row.id} row={row} onSave={saveRow} />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

const SettingRow = ({ row, onSave }) => {
  const [value, setValue] = useState(row.value || '');

  useEffect(() => {
    setValue(row.value || '');
  }, [row.value]);

  return (
    <TableRow>
      <TableCell>{row.key}</TableCell>
      <TableCell>
        <Input width={1} value={value} onChange={(e) => setValue(e.target.value)} />
      </TableCell>
      <TableCell>
        <Button size="sm" onClick={() => onSave(row.id, row.key, value)}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default EcomSettingsPage;
