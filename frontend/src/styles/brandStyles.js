/**
 * Unified Brand Styling Constants
 * 
 * This file consolidates all brand definitions for Admin, Driver, and Student portals.
 * It ensures consistency with the landing page design across the entire application.
 *
 * IMPORTANT: Base brand values must match the landing page exactly.
 */

// ============================================================================
// PRIMARY BRAND COLORS
// ============================================================================

export const BRAND_COLORS = {
    // Primary gradient used for CTAs, active states, and brand elements
    primaryGradient: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
    primaryGradientHover: 'linear-gradient(135deg, #0284C7 0%, #0F766E 100%)',

    // Individual brand colors
    skyBlue: '#0EA5E9',          // Primary blue for interactive elements
    skyBlueDark: '#0284C7',      // Darker blue for hover states
    teal: '#14B8A6',             // Secondary teal for accents
    tealDark: '#0F766E',         // Darker teal for hover states

    // Role-specific colors
    // Admin
    adminOrange: '#F97316',      // Orange for admin-specific highlights
    adminOrangeDark: '#EA580C',  // Darker orange for hover states

    // Driver (Amber/Orange identity)
    driverAmber: '#F59E0B',
    driverAmberDark: '#D97706',
    driverOrange: '#F97316',
    driverOrangeDark: '#EA580C',
    driverGradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    driverGradientHover: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',

    // Student (Blue identity)
    studentBlue: '#0EA5E9',      // Student portal primary color
    studentBlueDark: '#0284C7',  // Darker for hover states

    // Success, warning, error
    successGreen: '#10B981',     // Success states, checkmarks
    warningOrange: '#F59E0B',    // Warning states
    errorRed: '#EF4444',         // Error states

    // Neutral slate colors for text and backgrounds
    slate900: '#0F172A',         // Headings, primary text
    slate700: '#334155',         // Secondary headings
    slate600: '#64748B',         // Body text, captions
    slate500: '#94A3B8',         // Disabled states
    slate400: '#CBD5E1',         // Borders, dividers
    slate300: '#E2E8F0',         // Light borders
    slate200: '#F1F5F9',         // Light backgrounds
    slate100: '#F8FAFC',         // Very light backgrounds

    // Pure colors
    white: '#FFFFFF',
    black: '#000000',
};

// ============================================================================
// BACKGROUND GRADIENTS
// ============================================================================

export const BACKGROUND_GRADIENTS = {
    // Main page background (light blue to white)
    page: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
    // Driver page variant
    driverPage: 'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 50%, #F0F9FF 100%)',

    // Card hover effect
    cardHover: 'linear-gradient(135deg, rgba(14, 165, 233, 0.04) 0%, rgba(20, 184, 166, 0.04) 100%)',
    // Driver card hover variant
    driverCardHover: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(249, 115, 22, 0.04) 100%)',

    // Subtle background for sections
    sectionLight: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)',

    // Role-specific gradients
    adminGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    driverGradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    studentGradient: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
};

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
    // Standard elevation
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 20px 60px rgba(0, 0, 0, 0.08)',

    // Button shadows with brand color tint
    buttonDefault: '0 8px 24px rgba(14, 165, 233, 0.35)',
    buttonHover: '0 12px 32px rgba(14, 165, 233, 0.45)',

    // Role-specific shadows
    driverButtonDefault: '0 8px 24px rgba(245, 158, 11, 0.35)',
    driverButtonHover: '0 12px 32px rgba(245, 158, 11, 0.45)',

    // Card hover with brand tint
    cardBrand: '0 8px 24px rgba(14, 165, 233, 0.15)',
    cardDriver: '0 8px 24px rgba(245, 158, 11, 0.15)',
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
    xs: '4px',      // Very small, for progress bars
    sm: '8px',      // Small, for chips/badges
    md: '12px',     // Medium, for inputs/buttons
    lg: '16px',     // Large, for cards
    xl: '18px',     // Extra large, for icon boxes
    '2xl': '20px',  // 2X large, for major cards
    full: '50%',    // Full circle
};



// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    weights: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
    },

    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.6,
        loose: 1.8,
    },

    letterSpacing: {
        tight: '-0.5px',
        normal: '0',
        wide: '0.5px',
    },
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const BUTTON_STYLES = {
    // Primary gradient button (matching landing page CTAs)
    primary: {
        background: BRAND_COLORS.primaryGradient,
        color: BRAND_COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semibold,
        borderRadius: BORDER_RADIUS.md,
        boxShadow: SHADOWS.buttonDefault,
        textTransform: 'none',
        padding: '12px 24px',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: BRAND_COLORS.primaryGradientHover,
            boxShadow: SHADOWS.buttonHover,
            transform: 'translateY(-2px)',
        },
        '&:disabled': {
            background: BRAND_COLORS.slate500,
            color: BRAND_COLORS.white,
            boxShadow: 'none',
        },
    },

    // Secondary outlined button
    secondary: {
        borderColor: BRAND_COLORS.skyBlue,
        color: BRAND_COLORS.skyBlue,
        fontWeight: TYPOGRAPHY.weights.semibold,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: '2px',
        textTransform: 'none',
        padding: '12px 24px',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: BRAND_COLORS.skyBlueDark,
            bgcolor: 'rgba(14, 165, 233, 0.08)',
            borderWidth: '2px',
        },
    },

    // Role-specific buttons
    admin: {
        background: BACKGROUND_GRADIENTS.adminGradient,
        color: BRAND_COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semibold,
        borderRadius: BORDER_RADIUS.md,
        boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
        textTransform: 'none',
        '&:hover': {
            background: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
            boxShadow: '0 12px 32px rgba(249, 115, 22, 0.45)',
            transform: 'translateY(-2px)',
        },
    },

    driver: {
        background: BRAND_COLORS.driverGradient,
        color: BRAND_COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semibold,
        borderRadius: BORDER_RADIUS.md,
        boxShadow: SHADOWS.driverButtonDefault,
        textTransform: 'none',
        '&:hover': {
            background: BRAND_COLORS.driverGradientHover,
            boxShadow: SHADOWS.driverButtonHover,
            transform: 'translateY(-2px)',
        },
    },

    student: {
        background: BACKGROUND_GRADIENTS.studentGradient,
        color: BRAND_COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semibold,
        borderRadius: BORDER_RADIUS.md,
        boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
        textTransform: 'none',
        '&:hover': {
            background: BRAND_COLORS.primaryGradientHover,
            boxShadow: '0 12px 32px rgba(14, 165, 233, 0.45)',
            transform: 'translateY(-2px)',
        },
    },
};

// ============================================================================
// INPUT FIELD STYLES
// ============================================================================

export const INPUT_STYLES = {
    standard: {
        '& .MuiOutlinedInput-root': {
            borderRadius: BORDER_RADIUS.md,
            '&:hover fieldset': {
                borderColor: BRAND_COLORS.skyBlue,
            },
            '&.Mui-focused fieldset': {
                borderColor: BRAND_COLORS.skyBlue,
                borderWidth: '2px',
            },
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: BRAND_COLORS.skyBlue,
        },
    },
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const CARD_STYLES = {
    standard: {
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.md,
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: SHADOWS.cardBrand,
            transform: 'translateY(-2px)',
        },
    },

    stat: {
        borderRadius: BORDER_RADIUS.lg,
        background: BRAND_COLORS.primaryGradient,
        color: BRAND_COLORS.white,
        boxShadow: SHADOWS.buttonDefault,
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: SHADOWS.buttonHover,
            transform: 'translateY(-4px)',
        },
    },

    driverStat: {
        borderRadius: BORDER_RADIUS.lg,
        background: BRAND_COLORS.driverGradient,
        color: BRAND_COLORS.white,
        boxShadow: SHADOWS.driverButtonDefault,
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: SHADOWS.driverButtonHover,
            transform: 'translateY(-4px)',
        },
    },

    container: {
        borderRadius: BORDER_RADIUS['2xl'],
        boxShadow: SHADOWS.lg,
        border: `1px solid ${BRAND_COLORS.slate300}`,
    },
};

// ============================================================================
// TABLE STYLES
// ============================================================================

export const TABLE_STYLES = {
    container: {
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.md,
        overflow: 'hidden',
    },

    header: {
        background: BACKGROUND_GRADIENTS.sectionLight,
        fontWeight: TYPOGRAPHY.weights.bold,
        color: BRAND_COLORS.slate900,
    },

    // Driver variant
    headerCell: {
        fontWeight: TYPOGRAPHY.weights.bold,
        color: BRAND_COLORS.slate900,
        borderBottom: `2px solid ${BRAND_COLORS.slate300}`,
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        py: 2,
    },

    bodyCell: {
        color: BRAND_COLORS.slate700,
        fontWeight: TYPOGRAPHY.weights.medium,
        py: 1.5,
        borderBottom: `1px solid ${BRAND_COLORS.slate200}`,
    },

    row: {
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: 'rgba(14, 165, 233, 0.04)',
        },
    },
};

// ============================================================================
// SIDEBAR STYLES
// ============================================================================

export const SIDEBAR_STYLES = {
    width: 280,

    logo: {
        fontWeight: TYPOGRAPHY.weights.extrabold,
        fontSize: '1.25rem',
        background: BRAND_COLORS.primaryGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },

    menuItemActive: {
        borderRadius: BORDER_RADIUS.md,
        background: BRAND_COLORS.primaryGradient,
        color: BRAND_COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semibold,
    },

    menuItemHover: {
        borderRadius: BORDER_RADIUS.md,
        bgcolor: 'rgba(14, 165, 233, 0.08)',
    },
};





// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const glassmorphism = (blur = 10, opacity = 0.95) => ({
    backdropFilter: `blur(${blur}px)`,
    background: `rgba(255, 255, 255, ${opacity})`,
    border: '1px solid rgba(255, 255, 255, 0.8)',
});

export const gradientText = () => ({
    background: BRAND_COLORS.primaryGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
});


export const gradientIconBox = (gradient = BRAND_COLORS.primaryGradient, shadow = '0 4px 16px rgba(14, 165, 233, 0.3)') => ({
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow,
});

