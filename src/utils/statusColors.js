/**
 * Status badge colors configuration
 * Consistent across all pages in the application
 * 
 * Status colors mapping:
 * - Bajarmaganlar → red
 * - Qaytarilgan → yellow
 * - Kutilmoqda → blue
 * - Berilmagan → gray
 */

export const STATUS_COLORS = {
  'Bajarmaganlar': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    hex: {
      bg: '#fee2e2',
      text: '#b91c1c',
      border: '#fecaca'
    }
  },
  'Qaytarilgan': {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    hex: {
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fde68a'
    }
  },
  'Kutilmoqda': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hex: {
      bg: '#dbeafe',
      text: '#1d4ed8',
      border: '#bfdbfe'
    }
  },
  'Berilmagan': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    hex: {
      bg: '#f3f4f6',
      text: '#374151',
      border: '#e5e7eb'
    }
  },
  // Fallback for other statuses
  'default': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    hex: {
      bg: '#f3f4f6',
      text: '#374151',
      border: '#e5e7eb'
    }
  }
};

/**
 * Get status colors for badge (Tailwind class names)
 * @param {string} status - Lesson/homework status
 * @returns {Object} Color configuration with Tailwind classes
 */
export const getStatusColors = (status) => {
  if (!status) return STATUS_COLORS.default;
  return STATUS_COLORS[status] || STATUS_COLORS.default;
};

/**
 * Get status colors for badge (Hex color values)
 * @param {string} status - Lesson/homework status
 * @returns {Object} Color configuration with hex values
 */
export const getStatusColorsHex = (status) => {
  const colors = getStatusColors(status);
  return colors.hex || STATUS_COLORS.default.hex;
};

/**
 * Get inline styles for status badge
 * @param {string} status - Lesson/homework status
 * @returns {Object} Inline style object
 */
export const getStatusBadgeStyle = (status) => {
  const hex = getStatusColorsHex(status);
  return {
    backgroundColor: hex.bg,
    color: hex.text,
    border: `1px solid ${hex.border}`
  };
};
