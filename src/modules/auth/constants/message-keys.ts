export const AUTH_MESSAGE_KEYS = {
  // Thông báo chung
  SUCCESS: 'auth.success',
  FAILURE: 'auth.failure',

  // Đăng nhập
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  INVALID_CREDENTIALS: 'auth.login.invalid_credentials',

  // Đăng ký
  REGISTER_SUCCESS: 'auth.register.success',
  REGISTER_FAILURE: 'auth.register.failure',
  EMAIL_ALREADY_EXISTS: 'auth.register.email_already_exists',

  // Đăng xuất
  LOGOUT_SUCCESS: 'auth.logout.success',

  // Refresh token
  TOKEN_REFRESH_SUCCESS: 'auth.token.refresh_success',
  TOKEN_REFRESH_FAILURE: 'auth.token.refresh_failure',
  ACCESS_DENIED: 'auth.token.access_denied',

  // Validate user
  USER_NOT_FOUND: 'auth.user.not_found',
  PASSWORD_REQUIRED: 'auth.user.password_required',
  PASSWORD_NOT_SET: 'auth.user.password_not_set',
  INVALID_PASSWORD: 'auth.user.invalid_password',

  // Thông tin người dùng
  PROFILE_FETCHED: 'auth.profile.fetched',
  INVALID_USER_DATA: 'auth.user.invalid_data',
};
