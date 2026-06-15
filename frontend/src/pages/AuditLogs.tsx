import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { HistoryToggleOffOutlined } from '@mui/icons-material';
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
      setLoading(true);
      let response;
      if (entityFilter) {
        response = await auditAPI.getByEntity(entityFilter);
      } else {
        response = await auditAPI.getAll();
      }
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColors = (action: string) => {
    const act = action.toUpperCase();
    switch (act) {
      case 'CREATE':
        return { bg: 'rgba(16, 185, 129, 0.08)', text: '#10b981' };
      case 'UPDATE':
        return { bg: 'rgba(59, 130, 246, 0.08)', text: '#3b82f6' };
      case 'DELETE':
        return { bg: 'rgba(239, 68, 68, 0.08)', text: '#ef4444' };
      case 'LOGIN':
        return { bg: 'rgba(79, 70, 229, 0.08)', text: '#4f46e5' };
      case 'LOGOUT':
        return { bg: 'rgba(100, 116, 139, 0.08)', text: '#64748b' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.05)', text: '#475569' };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* Header section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trace security events, creation operations, and system administrative state changes.
          </Typography>
        </Box>

        {/* Filter dropdown */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-entity-label">Filter by Entity</InputLabel>
          <Select
            labelId="filter-entity-label"
            value={entityFilter}
            label="Filter by Entity"
            onChange={(e) => setEntityFilter(e.target.value)}
            sx={{
              borderRadius: 2,
              bgcolor: '#ffffff',
              '& fieldset': { borderColor: 'rgba(15, 23, 42, 0.08)' },
            }}
          >
            <MenuItem value="">All Entities</MenuItem>
            <MenuItem value="users">Users</MenuItem>
            <MenuItem value="roles">Roles</MenuItem>
            <MenuItem value="settings">Settings</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Audit Logs Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Log ID</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Action Type</TableCell>
              <TableCell>Target Entity</TableCell>
              <TableCell>Record ID</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} thickness={4} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading audit trail logs...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No audit log records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const colors = getActionColors(log.action_type);
                return (
                  <TableRow
                    key={log.audit_id}
                    sx={{
                      transition: 'background-color 0.15s',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 0.6)',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      #{log.audit_id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryToggleOffOutlined sx={{ fontSize: 16, color: 'primary.main' }} />
                        {log.username || 'System Daemon'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action_type}
                        size="small"
                        sx={{
                          bgcolor: colors.bg,
                          color: colors.text,
                          fontWeight: 700,
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          color: 'text.primary',
                        }}
                      >
                        {log.entity_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                          color: 'text.secondary',
                        }}
                      >
                        {log.record_id || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                          color: 'text.secondary',
                        }}
                      >
                        {log.ip_address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 500, color: 'text.primary' }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AuditLogs;
