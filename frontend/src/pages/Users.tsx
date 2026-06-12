import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
} from "@mui/icons-material";

import { userAPI, roleAPI } from "../services/api";
import type { User } from "../types";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role_id: null as number | null,
  });

  useEffect(() => {
    fetchUsers();
    loadRoles();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll(search);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);

      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.roles?.[0]?.role_id ?? null,
      });
    } else {
      setEditingUser(null);

      setFormData({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role_id: null,
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);

    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role_id: null,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await userAPI.update(editingUser.user_id, formData);
      } else {
        await userAPI.create(formData);
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userAPI.delete(userId);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleDisable = async (userId: number) => {
    try {
      await userAPI.disable(userId);
      fetchUsers();
    } catch (error) {
      console.error("Error disabling user:", error);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Users</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>

                <TableCell>
                  {user.roles?.map((role, idx) => (
                    <Chip
                      key={idx}
                      label={typeof role === 'string' ? role : role.role_name}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.is_active ? "Active" : "Disabled"}
                    color={user.is_active ? "success" : "error"}
                    size="small"
                  />
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(user)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    onClick={() => handleDisable(user.user_id)}
                    size="small"
                  >
                    <BlockIcon />
                  </IconButton>

                  <IconButton
                    onClick={() => handleDelete(user.user_id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value,
                })
              }
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
            />

            {/* Role Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>

              <Select
                value={formData.role_id}
                label="Role"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role_id: Number(e.target.value), // convert string to number
                  })
                }
              >
                {roles.map((role) => (
                  <MenuItem key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!editingUser && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
              />
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    first_name: e.target.value,
                  })
                }
              />

              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_name: e.target.value,
                  })
                }
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>

          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
