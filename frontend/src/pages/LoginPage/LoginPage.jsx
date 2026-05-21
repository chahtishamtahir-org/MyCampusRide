import React, { useState } from 'react';
import {
  Box, Container, Card, CardContent, Typography, TextField, Button,
  Link, Alert, CircularProgress, IconButton
} from '@mui/material';
import { Login as LoginIcon, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../../utils/toast';
import { authService } from '../../services';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (error) {
      setError('');
      setShowResend(false);
    }

    if (touched[name]) {
      if (name === 'email') {
        setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }));
      } else if (name === 'password') {
        setFieldErrors(prev => ({ ...prev, password: validatePassword(value) }));
      }
    } 
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === 'email') {
      setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (name === 'password') {
      setFieldErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await authService.resendVerification(formData.email);
      if (response.data.success) {
        toast.success(response.data.message || 'Verification email resent! Please check your inbox.');
        setError('');
        setShowResend(false);
      } else {
        toast.error('Failed to resend verification email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resending verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setFieldErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.success) {
        if (result.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (result.user.role === 'driver') {
          navigate('/driver', { replace: true });
        } else if (result.user.role === 'student') {
          navigate('/student', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        const errorMsg = result.error || 'Login failed. Please check your credentials and try again.';
        setError(errorMsg);
        if (errorMsg.toLowerCase().includes('verify your email')) {
          setShowResend(true);
        } else {
          setShowResend(false);
        }
      }
    } catch (err) {
      let errorMsg;
      if (!err.response) {
        errorMsg = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
      }}
    >
      {/* Decorative gradient circles - matching landing page aesthetic */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />

      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Back to home button */}
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              color: '#0EA5E9',
              '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.08)' },
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        {/* Brand logo/name */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            MyCampusRide
          </Typography>
        </Box>

        {/* Main card with enhanced styling */}
        <Card
          sx={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 0.6s ease-out',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {/* Icon with gradient background - matching landing page style */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
                }}
              >
                <LoginIcon sx={{ fontSize: 36, color: 'white' }} />
              </Box>
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  mb: 0.5,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  textAlign: 'center',
                }}
              >
                Sign in to access your campus transportation
              </Typography>
            </Box>

            {/* Error alert with brand styling */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
                role="alert"
                aria-live="assertive"
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2">{error}</Typography>
                  {showResend && (
                    <Button
                      onClick={handleResendVerification}
                      disabled={resending}
                      size="small"
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        color: '#EF4444',
                        fontWeight: 600,
                        p: 0,
                        minWidth: 0,
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                      }}
                    >
                      {resending ? 'Resending...' : 'Click here to resend verification email'}
                    </Button>
                  )}
                </Box>
              </Alert>
            )}

            {/* Form with enhanced input styling */}
            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && !!fieldErrors.email}
                helperText={touched.email && fieldErrors.email}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#0EA5E9',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0EA5E9',
                  },
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && !!fieldErrors.password}
                helperText={touched.password && fieldErrors.password}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#0EA5E9',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0EA5E9',
                  },
                }}
              />

              {/* Gradient button matching landing page */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
                  boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0284C7 0%, #0F766E 100%)',
                    boxShadow: '0 12px 32px rgba(14, 165, 233, 0.45)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94A3B8 0%, #94A3B8 100%)',
                    color: 'white',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Link with brand color */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    sx={{
                      color: '#0EA5E9',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Container>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default LoginPage;
