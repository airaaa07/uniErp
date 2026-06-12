import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { auditAPI } from '../services/api';
import type { AuditLog } from '../types';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const fetchLogs = async () => {
    try {
      let response;
      if (entityFilter) {
        response = await auditAPI.getByEntity(entityFilter);
      } else {
        response = await auditAPI.getAll();
      }
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'LOGIN':
        return 'primary';
      case 'LOGOUT':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Entity</InputLabel>
          <Select
            value={entityFilter}
            label="Filter by Entity"
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <MenuItem value="">All Entities</MenuItem>
            <MenuItem value="users">Users</MenuItem>
            <MenuItem value="roles">Roles</MenuItem>
            <MenuItem value="settings">Settings</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Record ID</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.audit_id}>
                <TableCell>{log.audit_id}</TableCell>
                <TableCell>{log.username || 'System'}</TableCell>
                <TableCell>
                  <Chip label={log.action_type} color={getActionColor(log.action_type) as any} size="small" />
                </TableCell>
                <TableCell>{log.entity_name}</TableCell>
                <TableCell>{log.record_id || '-'}</TableCell>
                <TableCell>{log.ip_address || '-'}</TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AuditLogs;
