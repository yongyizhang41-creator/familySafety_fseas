/**
 * Standardised API response wrapper.
 * Every endpoint returns { success, message, data } via this class.
 */
class ApiResponse {
  constructor(statusCode, message = 'Success', data = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
