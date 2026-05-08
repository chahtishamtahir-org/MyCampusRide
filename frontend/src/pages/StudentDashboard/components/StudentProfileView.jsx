/**
 * StudentProfileView Component
 *
 * Student profile management interface with:
 * - Personal Information tab with editable fields (email, phone)
 * - Transport Card tab showing virtual card
 * - Security tab for password change
 * - Read-only fields for name and student ID
 *
 * Features brand styling with gradient accents.
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Box, Avatar, Grid,
  TextField, Button, Tab, Tabs, CircularProgress, IconButton
} from '@mui/material';
import {
  Person as PersonIcon, Email, Phone, Badge as BadgeIcon, CreditCard, Lock as LockIcon, PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { authService } from '../../../services';
import VirtualTransportCard from './VirtualTransportCard';
import PasswordChangeForm from '../../../components/PasswordChangeForm';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  BUTTON_STYLES,
  INPUT_STYLES,
} from '../../../styles/brandStyles';

const StudentProfileView = () => {
  const { updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [assignedBus, setAssignedBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Load user profile data including assigned bus and route
   * Populates form with current user information
   */
  const loadUserData = async () => {
    try {
      setLoading(true);

      const userResponse = await authService.getMe();
      const userData = userResponse.data.data || userResponse.data;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        studentId: userData.studentId || ''
      });

      if (userData?.assignedBus) {
        if (typeof userData.assignedBus === 'object' && userData.assignedBus._id) {
          setAssignedBus(userData.assignedBus);

          if (userData.assignedBus.routeId) {
            if (typeof userData.assignedBus.routeId === 'object') {
              setAssignedRoute(userData.assignedBus.routeId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   * Updates formData state with new values
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /**
   * Save profile changes to backend
   * Only email and phone can be updated by student
   */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const updateData = new FormData();
      updateData.append('email', formData.email);
      updateData.append('phone', formData.phone);
      if (profilePicture) {
        updateData.append('profilePicture', profilePicture);
      }

      const response = await authService.updateProfile(updateData);
      const updatedUser = response.data?.data || response.data;
      
      updateUser(updatedUser);
      
      toast.success('Your profile has been updated successfully. Changes are now active.');

      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state with brand color
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND_COLORS.skyBlue }} />
          <Typography variant="h6" sx={{ color: BRAND_COLORS.slate700 }}>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ p: 4 }}>
      {/* Profile Card with brand styling */}
      <Card sx={{
        ...CARD_STYLES.standard,
        border: `1px solid ${BRAND_COLORS.slate300}`,
      }}>
        <CardContent>
          {/* Header with gradient icon */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box sx={{
              width: 56,
              height: 56,
              borderRadius: BORDER_RADIUS.xl,
              background: BRAND_COLORS.primaryGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(14, 165, 233, 0.3)',
            }}>
              <PersonIcon sx={{ fontSize: 32, color: BRAND_COLORS.white }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                Profile
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                Manage your personal information
              </Typography>
            </Box>
          </Box>

          {/* Tabs with brand styling */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                fontWeight: 600,
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
              },
            }}
          >
            <Tab label="Personal Information" />
            <Tab label="Transport Card" />
            <Tab label="Security" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box textAlign="center" mb={3}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Box sx={{
                      p: 0.5,
                      borderRadius: '50%',
                      background: BRAND_COLORS.primaryGradient,
                      display: 'inline-flex',
                    }}>
                      <Avatar
                        src={previewUrl || (user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined)}
                        sx={{
                          width: 120,
                          height: 120,
                          bgcolor: BRAND_COLORS.white,
                          color: BRAND_COLORS.skyBlue,
                          fontSize: '2.5rem',
                          fontWeight: 700,
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
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
                  <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                    {user?.name || 'Student'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box mb={2}>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 1 }}>
                    Student ID
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BadgeIcon sx={{ color: BRAND_COLORS.skyBlue }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      {user?.studentId || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 1 }}>
                    Fee Status
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CreditCard sx={{ color: BRAND_COLORS.teal }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      {user?.feeStatus === 'paid' ? 'Paid' :
                        user?.feeStatus === 'partially_paid' ? 'Partially Paid' :
                          'Pending'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box display="flex" justifyContent="center" py={3}>
              <VirtualTransportCard user={user} assignedBus={assignedBus} assignedRoute={assignedRoute} />
            </Box>
          )}

          {activeTab === 2 && (
            <Box py={3}>
              <PasswordChangeForm />
            </Box>
          )}

          {activeTab === 0 && (
            <>
              {/* Editable Form Fields with brand styling */}
              <Grid container spacing={3} mt={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    disabled
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: BRAND_COLORS.slate500 }} />,
                      endAdornment: <LockIcon sx={{ color: BRAND_COLORS.slate500, fontSize: 20 }} />,
                    }}
                    helperText="Name cannot be changed. Contact admin to update."
                    sx={{
                      ...INPUT_STYLES.standard,
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: BRAND_COLORS.slate600,
                        color: BRAND_COLORS.slate600,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    type="email"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: BRAND_COLORS.skyBlue }} />,
                    }}
                    sx={INPUT_STYLES.standard}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: BRAND_COLORS.teal }} />,
                    }}
                    sx={INPUT_STYLES.standard}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    value={formData.studentId}
                    disabled
                    InputProps={{
                      startAdornment: <BadgeIcon sx={{ mr: 1, color: BRAND_COLORS.slate500 }} />,
                      endAdornment: <LockIcon sx={{ color: BRAND_COLORS.slate500, fontSize: 20 }} />,
                    }}
                    helperText="Student ID cannot be changed. Contact admin to update."
                    sx={{
                      ...INPUT_STYLES.standard,
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: BRAND_COLORS.slate600,
                        color: BRAND_COLORS.slate600,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Save Button with gradient styling */}
              <Box mt={3} textAlign="right">
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
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
                    'Save Changes'
                  )}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentProfileView;