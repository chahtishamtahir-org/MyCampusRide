import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { authService } from '../../services';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
        } else {
          setStatus('error');
          setMessage('Email verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'There was an error verifying your email. The token might have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          {status === 'loading' && (
            <Box sx={{ py: 4 }}>
              <CircularProgress sx={{ color: '#0EA5E9', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Verifying your email...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                Email Verified!
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B', mb: 4 }}>
                {message || 'Your email has been successfully verified. You can now access your account.'}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#0EA5E9',
                  '&:hover': { bgcolor: '#0284C7' }
                }}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ py: 4 }}>
              <Cancel sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                Verification Failed
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B', mb: 4 }}>
                {message}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/register')}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#0EA5E9',
                  '&:hover': { bgcolor: '#0284C7' }
                }}
              >
                Back to Registration
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmailPage;
