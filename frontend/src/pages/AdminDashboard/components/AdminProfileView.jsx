import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, TextField,
  Button, Avatar, Chip, CircularProgress, Tab, Tabs, IconButton
} from '@mui/material';
import { Person as PersonIcon, Email, Phone, Lock as LockIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { authService } from '../../../services';
import PasswordChangeForm from '../../../components/PasswordChangeForm';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';

const AdminProfileView = () => {
  const { updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      const userData = response.data.data || response.data;

      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    } catch (err) {
      console.error('Error loading user data:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Validate name
      if (!formData.name || formData.name.trim().length < 2 || formData.name.length > 50) {
        toast.error('Name must be between 2 and 50 characters');
        setSaving(false);
        return;
      }

      // Validate email
      const emailRegex = /^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        setSaving(false);
        return;
      }

      // Validate phone
      const phoneRegex = /^0\d{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error('Phone must be in format 03XXXXXXXXX (e.g., 03001234567)');
        setSaving(false);
        return;
      }

      const updateData = new FormData();
      updateData.append('name', formData.name);
      updateData.append('email', formData.email);
      updateData.append('phone', formData.phone);
      if (profilePicture) {
        updateData.append('profilePicture', profilePicture);
      }

      const response = await authService.updateProfile(updateData);
      const updatedUser = response.data?.data || response.data;

      // Update global context so sidebar reflects changes
      updateUser(updatedUser);

      toast.success('Your profile has been updated successfully. Changes are now active.');

      loadUserData();
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 8 }}>
          <CircularProgress size={24} />
          <Typography>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your account settings
              </Typography>
            </Box>
          </Box>

          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Personal Information" />
            <Tab label="Security" />
          </Tabs>

          {activeTab === 0 && (
            <>
              <Box textAlign="center" mb={4}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={previewUrl || (user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined)}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Avatar>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <PhotoCameraIcon color="primary" fontSize="small" />
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {user?.name || 'Admin'}
                </Typography>
                <Chip
                  label="Administrator"
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Box>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box textAlign="right">
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={saving}
                        size="large"
                      >
                        {saving ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                            <Typography>Saving your changes...</Typography>
                          </Box>
                        ) : (
                          'Update Profile'
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </>
          )}

          {activeTab === 1 && (
            <Box py={3}>
              <PasswordChangeForm />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminProfileView;
