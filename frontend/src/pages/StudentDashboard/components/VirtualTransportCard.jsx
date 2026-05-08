/**
 * VirtualTransportCard Component
 *
 * Digital transport card displaying:
 * - Student identification with photo placeholder
 * - Assigned bus and route information
 * - Fee status and payment details
 * - Card validity period
 *
 * Horizontal layout with optimized (smaller) font sizes.
 */

import React, { useRef, useState } from 'react';
import {
  Card, CardContent, Typography, Box, Avatar, Chip, Divider, Button, CircularProgress, Grid
} from '@mui/material';
import {
  DirectionsBus, Person, School, Receipt,
  CalendarToday, Badge as BadgeIcon, Download
} from '@mui/icons-material';
import {
  BRAND_COLORS,
  BORDER_RADIUS,
  SHADOWS,
  BUTTON_STYLES,
} from '../../../styles/brandStyles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VirtualTransportCard = ({ user, assignedBus, assignedRoute }) => {
  const getMonthlyFee = () => {
    if (assignedRoute?.stops && user?.stopName) {
      const stop = assignedRoute.stops.find(s => s.name === user.stopName);
      if (stop) return stop.fee;
    }
    if (assignedRoute?.stops?.length > 0) {
      return assignedRoute.stops[0].fee;
    }
    return 0;
  };

  const monthlyFee = getMonthlyFee();
  const feeStatus = user?.feeStatus || 'pending';
  let paidAmount = 0;
  let dueAmount = monthlyFee;

  if (feeStatus === 'paid') {
    paidAmount = monthlyFee;
    dueAmount = 0;
  } else if (feeStatus === 'partially_paid') {
    paidAmount = monthlyFee * 0.5;
    dueAmount = monthlyFee * 0.5;
  }

  const feeInfo = {
    monthlyFee,
    paidAmount,
    dueAmount,
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgWidth = 180; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
      const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`TransportCard_${user?.studentId || 'Student'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
          onClick={handleDownload}
          disabled={downloading}
          sx={{
            ...BUTTON_STYLES.primary,
            px: 3,
            py: 1,
            fontSize: '0.875rem',
            borderRadius: BORDER_RADIUS.lg,
            boxShadow: SHADOWS.md,
          }}
        >
          {downloading ? 'Generating PDF...' : 'Download Transport Card'}
        </Button>
      </Box>

      {/* Horizontal Virtual Transport Card with smaller fonts */}
      <Card 
        ref={cardRef}
        sx={{
          maxWidth: 750, // Slightly reduced width for better scale
          width: '100%',
          mx: 'auto',
          boxShadow: SHADOWS.lg,
          borderRadius: BORDER_RADIUS.xl,
          border: `1.5px solid ${BRAND_COLORS.slate300}`,
          overflow: 'hidden',
          background: '#fff'
        }}
      >
        {/* Header */}
        <Box sx={{
          height: 56, // Reduced height
          background: BRAND_COLORS.primaryGradient,
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}>
          <School sx={{ color: BRAND_COLORS.white, mr: 1, fontSize: 24 }} />
          <Typography variant="h6" sx={{ color: BRAND_COLORS.white, fontWeight: 700, fontSize: '1.1rem' }}>
            MyCampusRide
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box sx={{
                  p: 0.4,
                  borderRadius: '50%',
                  background: BRAND_COLORS.primaryGradient,
                  display: 'flex',
                }}>
                  <Avatar
                    src={user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: BRAND_COLORS.white,
                      color: BRAND_COLORS.skyBlue,
                      border: '2px solid #fff'
                    }}
                  >
                    <Person sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_COLORS.slate900, lineHeight: 1.2 }}>
                    {user?.name || 'Student Name'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.2}>
                    <BadgeIcon sx={{ fontSize: 14, color: BRAND_COLORS.skyBlue }} />
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, fontWeight: 600, fontSize: '0.8rem' }}>
                      ID: {user?.studentId || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: BRAND_COLORS.slate200 }} />

              <Box>
                <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500, fontWeight: 800, mb: 0.5, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
                  Bus Details
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <DirectionsBus sx={{ fontSize: 18, color: BRAND_COLORS.skyBlue }} />
                  <Typography variant="subtitle1" sx={{ color: BRAND_COLORS.slate900, fontWeight: 700 }}>
                    Bus {assignedBus ? assignedBus.busNumber : 'Not Assigned'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, ml: 3.5, fontSize: '0.85rem' }}>
                  Model: {assignedBus ? assignedBus.model : 'N/A'} ({assignedBus ? assignedBus.year : 'N/A'})
                </Typography>
                {user?.stopName && (
                  <Box mt={1} ml={3.5}>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500, fontWeight: 700, fontSize: '0.7rem' }}>
                      PICKUP STOP
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate900, fontWeight: 600, fontSize: '0.85rem' }}>
                      {user.stopName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={6}>
              <Box mb={2}>
                <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500, fontWeight: 800, mb: 0.5, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
                  Route Details
                </Typography>
                <Typography variant="subtitle1" sx={{ color: BRAND_COLORS.slate900, fontWeight: 700, mb: 0.2 }}>
                  {assignedRoute ? assignedRoute.routeName : 'Not Assigned'}
                </Typography>
                {assignedRoute && assignedRoute.routeNo && (
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, fontSize: '0.85rem' }}>
                    Route Number: {assignedRoute.routeNo}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 1.5, borderColor: BRAND_COLORS.slate200 }} />

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Fee Information
                  </Typography>
                  <Chip
                    label={feeStatus === 'paid' ? 'PAID' : feeStatus === 'partially_paid' ? 'PARTIAL' : 'PENDING'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: feeStatus === 'paid' ? BRAND_COLORS.successGreen :
                        feeStatus === 'partially_paid' ? BRAND_COLORS.warningOrange :
                          BRAND_COLORS.errorRed,
                      color: BRAND_COLORS.white,
                      fontWeight: 800,
                      borderRadius: 1,
                    }}
                  />
                </Box>
                <Box sx={{ bgcolor: BRAND_COLORS.slate50, p: 1.5, borderRadius: BORDER_RADIUS.md }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600 }}>Monthly Fee</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>PKR {feeInfo.monthlyFee}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600 }}>Amount Paid</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: BRAND_COLORS.successGreen }}>PKR {feeInfo.paidAmount}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Remaining Due</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: feeInfo.dueAmount > 0 ? BRAND_COLORS.errorRed : BRAND_COLORS.successGreen }}>PKR {feeInfo.dueAmount}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Validity Period */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Box textAlign="center" p={1.5} sx={{ 
              width: '100%',
              maxWidth: 400,
              bgcolor: BRAND_COLORS.skyBlue + '08', 
              borderRadius: BORDER_RADIUS.md, 
              border: `1px solid ${BRAND_COLORS.skyBlue}20` 
            }}>
              <CalendarToday sx={{ color: BRAND_COLORS.skyBlue, mb: 0.2, fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: BRAND_COLORS.slate700, fontWeight: 700, display: 'block', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                VALIDITY PERIOD
              </Typography>
              <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600, fontWeight: 600, fontSize: '0.75rem' }}>
                {user ? new Date().toLocaleDateString() : 'N/A'} — {feeInfo.nextDueDate}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VirtualTransportCard;