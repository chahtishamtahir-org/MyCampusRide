/**
 * DriverProfileView Component
 *
 * Driver profile management with brand styling.
 * Features gradient avatar border, brand-styled tabs,
 * styled text fields, and gradient save button.
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, TextField,
  Button, Avatar, Chip, CircularProgress, Tab, Tabs, IconButton
} from '@mui/material';
import {
  Person as PersonIcon, Email, Phone, Badge as BadgeIcon, Lock as LockIcon, PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { authService } from '../../../services';
import PasswordChangeForm from '../../../components/PasswordChangeForm';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  BUTTON_STYLES,
  INPUT_STYLES,
  gradientIconBox,
} from '../../../styles/brandStyles';

const DriverProfileView = () => {
  const { updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        phone: userData.phone || '',
        licenseNumber: userData.licenseNumber || ''
      });
    } catch (err) {
      console.error('Error loading user data:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
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
      
      const updateData = new FormData();
      if (formData.name) updateData.append('name', formData.name);
      if (formData.email) updateData.append('email', formData.email);
      if (formData.phone) updateData.append('phone', formData.phone);
      if (profilePicture) updateData.append('profilePicture', profilePicture);

      const response = await authService.updateProfile(updateData);
      const updatedUser = response.data?.data || response.data;
      
      updateUser(updatedUser);
      
      toast.success('Your profile has been updated successfully. Changes are now active.');
      loadUserData();
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress size={48} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
        <CardContent>
          {/* Card Header */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box sx={gradientIconBox(BRAND_COLORS.primaryGradient, '0 4px 16px rgba(14, 165, 233, 0.3)')}>
              <PersonIcon sx={{ color: BRAND_COLORS.white }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                Profile
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                Manage your account information
              </Typography>
            </Box>
          </Box>

          {/* Brand-styled Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                fontWeight: TYPOGRAPHY.weights.semibold,
                textTransform: 'none',
                fontSize: '1rem',
                color: BRAND_COLORS.slate600,
                '&.Mui-selected': {
                  color: BRAND_COLORS.skyBlue,
                },
              },
              '& .MuiTabs-indicator': {
                background: BRAND_COLORS.primaryGradient,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab label="Personal Information" />
            <Tab label="Security" />
          </Tabs>

          {activeTab === 0 && (
            <>
              {/* Profile Avatar with gradient border */}
              <Box textAlign="center" mb={4}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box sx={{
                    p: 0.5,
                    borderRadius: '50%',
                    background: BRAND_COLORS.primaryGradient,
                    display: 'inline-flex',
                    boxShadow: SHADOWS.buttonDefault,
                  }}>
                    <Avatar
                      src={previewUrl || (user?.profilePicture ? `${API_URL}/${user.profilePicture}` : undefined)}
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: BRAND_COLORS.white,
                        color: BRAND_COLORS.skyBlue,
                        fontSize: '2.5rem',
                        fontWeight: TYPOGRAPHY.weights.bold,
                        border: `3px solid ${BRAND_COLORS.white}`,
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'D'}
                    </Avatar>
                  </Box>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: BRAND_COLORS.white,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': { bgcolor: BRAND_COLORS.slate100 }
                    }}
                  >
                    <PhotoCameraIcon sx={{ color: BRAND_COLORS.skyBlue, fontSize: 20 }} />
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{
                  fontWeight: TYPOGRAPHY.weights.bold,
                  color: BRAND_COLORS.slate900,
                  mt: 2,
                }}>
                  {user?.name || 'Driver'}
                </Typography>
                <Chip
                  label="Driver"
                  size="small"
                  sx={{
                    mt: 1,
                    background: BRAND_COLORS.primaryGradient,
                    color: BRAND_COLORS.white,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                  }}
                />
              </Box>

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      disabled
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: BRAND_COLORS.slate400 }} />,
                        endAdornment: <LockIcon sx={{ color: BRAND_COLORS.slate400, fontSize: 20 }} />,
                      }}
                      helperText="Name cannot be changed. Contact admin to update."
                      sx={{
                        ...INPUT_STYLES.standard,
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: BRAND_COLORS.slate700,
                          color: BRAND_COLORS.slate700,
                        },
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
                        startAdornment: <Email sx={{ mr: 1, color: BRAND_COLORS.skyBlue }} />,
                      }}
                      sx={INPUT_STYLES.standard}
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
                        startAdornment: <Phone sx={{ mr: 1, color: BRAND_COLORS.skyBlue }} />,
                      }}
                      sx={INPUT_STYLES.standard}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="License Number"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      disabled
                      InputProps={{
                        startAdornment: <BadgeIcon sx={{ mr: 1, color: BRAND_COLORS.slate400 }} />,
                        endAdornment: <LockIcon sx={{ color: BRAND_COLORS.slate400, fontSize: 20 }} />,
                      }}
                      helperText="License number cannot be changed. Contact admin to update."
                      sx={{
                        ...INPUT_STYLES.standard,
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: BRAND_COLORS.slate700,
                          color: BRAND_COLORS.slate700,
                        },
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
                        sx={{
                          ...BUTTON_STYLES.primary,
                          px: 4,
                          py: 1.5,
                        }}
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

export default DriverProfileView;