export const AUTH_MESSAGE_KEYS = {
  // Thông báo chung
  SUCCESS: 'success',
  FAILURE: 'failure',

  // Đăng nhập
  LOGIN_SUCCESS: 'login.success',
  LOGIN_FAILURE: 'login.failure',
  INVALID_CREDENTIALS: 'login.invalid_credentials',

  // Đăng ký
  REGISTER_SUCCESS: 'register.success',
  REGISTER_FAILURE: 'register.failure',
  EMAIL_ALREADY_EXISTS: 'register.email_already_exists',

  // Đăng xuất
  LOGOUT_SUCCESS: 'logout.success',

  // Refresh token
  TOKEN_REFRESH_SUCCESS: 'token.refresh_success',
  TOKEN_REFRESH_FAILURE: 'token.refresh_failure',
  ACCESS_DENIED: 'token.access_denied',

  // Validate user
  USER_NOT_FOUND: 'user.not_found',
  PASSWORD_REQUIRED: 'user.password_required',
  PASSWORD_NOT_SET: 'user.password_not_set',
  INVALID_PASSWORD: 'user.invalid_password',

  // Thông tin người dùng
  PROFILE_FETCHED: 'profile.fetched',
  INVALID_USER_DATA: 'user.invalid_data',
};
