// Validation patterns and functions - FULLY UPDATED VERSION
export const validationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s-()]{10,}$/,
  URL: /^https?:\/\/.+\..+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  HASHTAG: /^#[a-zA-Z0-9_]+$/,
  FILE_NAME: /^[a-zA-Z0-9_\-.() ]+$/
};

export const validateEmail = (email) => {
  return validationPatterns.EMAIL.test(email);
};

export const validatePassword = (password) => {
  return validationPatterns.PASSWORD.test(password);
};

export const validatePhone = (phone) => {
  return validationPatterns.PHONE.test(phone);
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, min) => {
  return value && value.toString().trim().length >= min;
};

export const validateMaxLength = (value, max) => {
  return value && value.toString().trim().length <= max;
};

export const validateFileType = (file, acceptedTypes) => {
  if (typeof acceptedTypes === 'string') {
    // Handle string like "image/*,video/*"
    const types = acceptedTypes.split(',').map(type => type.trim());
    return types.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(`${category}/`);
      }
      return file.type === type;
    });
  } else if (Array.isArray(acceptedTypes)) {
    // Handle array of types
    return acceptedTypes.includes(file.type);
  }
  return false;
};

export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

export const validateFileName = (fileName) => {
  return validationPatterns.FILE_NAME.test(fileName);
};

// File validation helpers
export const fileValidation = {
  // Logo validation
  validateLogo: (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Logo must be a JPEG, PNG, GIF, or WebP image');
    }

    if (file.size > maxSize) {
      throw new Error('Logo size must be less than 5MB');
    }

    if (!validateFileName(file.name)) {
      throw new Error('Invalid file name. Only letters, numbers, underscores, hyphens, and periods are allowed');
    }

    return true;
  },

  // Post media validation
  validatePostMedia: (file) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Media must be an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV)');
    }

    if (file.size > maxSize) {
      throw new Error('Media size must be less than 100MB');
    }

    if (!validateFileName(file.name)) {
      throw new Error('Invalid file name. Only letters, numbers, underscores, hyphens, and periods are allowed');
    }

    return true;
  },

  // Multiple files validation
  validateMultipleFiles: (files, options = {}) => {
    const {
      maxFiles = 10,
      maxSizePerFile = 100 * 1024 * 1024,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'],
      requireAtLeastOne = false
    } = options;

    if (requireAtLeastOne && (!files || files.length === 0)) {
      throw new Error('At least one file is required');
    }

    if (files.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`);
    }

    const errors = [];
    const totalSize = files.reduce((total, file) => total + file.size, 0);
    const maxTotalSize = maxSizePerFile * maxFiles;

    if (totalSize > maxTotalSize) {
      throw new Error(`Total size of all files exceeds maximum allowed (${maxTotalSize / (1024 * 1024)}MB)`);
    }

    files.forEach((file, index) => {
      try {
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.name}. Supported types: ${allowedTypes.join(', ')}`);
        }

        if (file.size > maxSizePerFile) {
          throw new Error(`File too large: ${file.name}. Maximum size is ${maxSizePerFile / (1024 * 1024)}MB`);
        }

        if (!validateFileName(file.name)) {
          throw new Error(`Invalid file name: ${file.name}. Only letters, numbers, underscores, hyphens, and periods are allowed`);
        }
      } catch (error) {
        errors.push(`File ${index + 1} (${file.name}): ${error.message}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  },

  // Validate file array for post creation
  validatePostMediaFiles: (files) => {
    return fileValidation.validateMultipleFiles(files, {
      maxFiles: 10,
      maxSizePerFile: 100 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'],
      requireAtLeastOne: false
    });
  },

  // Get file type category
  getFileType: (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  },

  // Get file extension
  getFileExtension: (fileName) => {
    return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Check if file is image
  isImage: (file) => {
    return file.type.startsWith('image/');
  },

  // Check if file is video
  isVideo: (file) => {
    return file.type.startsWith('video/');
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Form validation schemas
export const loginValidation = {
  email: {
    required: true,
    validate: validateEmail,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    validate: (value) => validateMinLength(value, 6),
    message: 'Password must be at least 6 characters'
  }
};

export const registerValidation = {
  username: {
    required: true,
    validate: (value) => validateMinLength(value, 3) && validateMaxLength(value, 50),
    message: 'Username must be between 3 and 50 characters'
  },
  email: {
    required: true,
    validate: validateEmail,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    validate: validatePassword,
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character'
  },
  user_type: {
    required: true,
    validate: (value) => ['customer', 'business_owner'].includes(value),
    message: 'Please select a valid user type'
  }
};

export const businessValidation = {
  name: {
    required: true,
    validate: (value) => validateMinLength(value, 2) && validateMaxLength(value, 100),
    message: 'Business name must be between 2 and 100 characters'
  },
  category: {
    required: true,
    validate: validateRequired,
    message: 'Please select a business category'
  },
  address: {
    required: true,
    validate: validateRequired,
    message: 'Please enter a business address'
  },
  city: {
    required: true,
    validate: validateRequired,
    message: 'Please enter a city'
  },
  phone: {
    required: true,
    validate: validatePhone,
    message: 'Please enter a valid phone number'
  },
  email: {
    required: true,
    validate: validateEmail,
    message: 'Please enter a valid business email'
  },
  latitude: {
    required: true,
    validate: (value) => value >= -90 && value <= 90,
    message: 'Please enter a valid latitude'
  },
  longitude: {
    required: true,
    validate: (value) => value >= -180 && value <= 180,
    message: 'Please enter a valid longitude'
  }
};

export const postValidation = {
  title: {
    required: true,
    validate: (value) => validateMinLength(value, 1) && validateMaxLength(value, 200),
    message: 'Title must be between 1 and 200 characters'
  },
  post_type: {
    required: true,
    validate: (value) => ['post', 'offer', 'event', 'announcement'].includes(value),
    message: 'Please select a valid post type'
  },
  content: {
    required: false,
    validate: (value) => !value || validateMaxLength(value, 2000),
    message: 'Content must be less than 2000 characters'
  },
  media_files: {
    required: false,
    validate: (files) => !files || files.length <= 10,
    message: 'Maximum 10 media files allowed'
  }
};

export const eventValidation = {
  title: {
    required: true,
    validate: (value) => validateMinLength(value, 1) && validateMaxLength(value, 200),
    message: 'Event title must be between 1 and 200 characters'
  },
  start_time: {
    required: true,
    validate: (value) => new Date(value) > new Date(),
    message: 'Event start time must be in the future'
  },
  event_type: {
    required: true,
    validate: (value) => ['workshop', 'networking', 'sale', 'open_house', 'other'].includes(value),
    message: 'Please select a valid event type'
  }
};

// Media upload validation schema
export const mediaUploadValidation = {
  single: {
    validate: (file, options = {}) => {
      const { maxSize = 100 * 1024 * 1024, allowedTypes = ['image/*', 'video/*'] } = options;

      if (!validateFileType(file, allowedTypes)) {
        throw new Error('Unsupported file type');
      }

      if (!validateFileSize(file, maxSize)) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      }

      return true;
    }
  },
  multiple: {
    validate: (files, options = {}) => {
      const {
        maxFiles = 10,
        maxSizePerFile = 100 * 1024 * 1024,
        allowedTypes = ['image/*', 'video/*'],
        maxTotalSize = 500 * 1024 * 1024
      } = options;

      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      const totalSize = files.reduce((total, file) => total + file.size, 0);
      if (totalSize > maxTotalSize) {
        throw new Error(`Total size of all files must be less than ${maxTotalSize / (1024 * 1024)}MB`);
      }

      files.forEach(file => {
        if (!validateFileType(file, allowedTypes)) {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        if (!validateFileSize(file, maxSizePerFile)) {
          throw new Error(`File too large: ${file.name}. Maximum size is ${maxSizePerFile / (1024 * 1024)}MB`);
        }
      });

      return true;
    }
  }
};

// Helper function to validate form data with files
export const validateFormWithFiles = (formData, validationSchema, files = null) => {
  const errors = {};

  // Validate regular form fields
  Object.keys(validationSchema).forEach(field => {
    if (field === 'media_files') return; // Skip media files for now

    const validation = validationSchema[field];
    const value = formData[field];

    if (validation.required && !value) {
      errors[field] = validation.message || `${field} is required`;
    } else if (value && validation.validate && !validation.validate(value)) {
      errors[field] = validation.message;
    }
  });

  // Validate files if provided
  if (files && validationSchema.media_files) {
    try {
      validationSchema.media_files.validate(files);
    } catch (error) {
      errors.media_files = error.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};