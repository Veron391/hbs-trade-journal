/**
 * Parse and humanize error messages from backend API responses
 * Handles Django REST Framework error format: {"non_field_errors": ["Invalid credentials"]}
 * or {"field_name": ["Error message"]}
 */
export function parseApiError(errorText: string): string {
  if (!errorText) {
    return '';
  }

  try {
    // Try to parse as JSON
    const errorObj = JSON.parse(errorText);
    
    // Handle Django REST Framework error format
    if (typeof errorObj === 'object' && errorObj !== null) {
      // Check for non_field_errors (general errors)
      if (errorObj.non_field_errors && Array.isArray(errorObj.non_field_errors)) {
        return errorObj.non_field_errors[0] || '';
      }
      
      // Check for detail field (common in DRF)
      if (errorObj.detail) {
        if (typeof errorObj.detail === 'string') {
          return errorObj.detail;
        }
        if (Array.isArray(errorObj.detail) && errorObj.detail.length > 0) {
          return errorObj.detail[0];
        }
      }
      
      // Check for error field
      if (errorObj.error) {
        if (typeof errorObj.error === 'string') {
          return errorObj.error;
        }
        if (Array.isArray(errorObj.error) && errorObj.error.length > 0) {
          return errorObj.error[0];
        }
      }
      
      // Check for message field
      if (errorObj.message) {
        if (typeof errorObj.message === 'string') {
          return errorObj.message;
        }
        if (Array.isArray(errorObj.message) && errorObj.message.length > 0) {
          return errorObj.message[0];
        }
      }
      
      // If it's an object with field-specific errors, get the first error
      const keys = Object.keys(errorObj);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const firstError = errorObj[firstKey];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0];
        }
        if (typeof firstError === 'string') {
          return firstError;
        }
      }
    }
    
    // If it's already a string, return it
    if (typeof errorObj === 'string') {
      return errorObj;
    }
  } catch {
    // If parsing fails, return the original text
    return errorText;
  }
  
  return errorText;
}

/**
 * Map common error messages to translation keys
 */
export function getErrorTranslationKey(errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase();
  
  // Map common error messages to translation keys
  if (lowerError.includes('invalid credentials') || lowerError.includes('invalid email or password') || lowerError.includes('unable to log in')) {
    return 'errorInvalidCredentials';
  }
  if (lowerError.includes('user not found') || lowerError.includes('user does not exist')) {
    return 'errorUserNotFound';
  }
  if (lowerError.includes('password') && lowerError.includes('incorrect')) {
    return 'errorIncorrectPassword';
  }
  if (lowerError.includes('email') && (lowerError.includes('required') || lowerError.includes('invalid'))) {
    return 'errorInvalidEmail';
  }
  if (lowerError.includes('username') && (lowerError.includes('required') || lowerError.includes('invalid'))) {
    return 'errorInvalidUsername';
  }
  if (lowerError.includes('account') && lowerError.includes('disabled')) {
    return 'errorAccountDisabled';
  }
  if (lowerError.includes('account') && lowerError.includes('locked')) {
    return 'errorAccountLocked';
  }
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return 'errorNetwork';
  }
  if (lowerError.includes('server') || lowerError.includes('internal')) {
    return 'errorServer';
  }
  
  // Default fallback
  return 'errorGeneric';
}
