export const PRODUCTS_MESSAGE_KEYS = {
  // Product chung
  PRODUCT_NOT_FOUND: 'products.not_found',
  PRODUCT_CREATED: 'products.created',
  PRODUCT_UPDATED: 'products.updated',
  PRODUCT_DELETED: 'products.deleted',
  PRODUCT_FETCH_SUCCESS: 'products.fetch.success',
  PRODUCT_FETCH_ALL_SUCCESS: 'products.fetch.all.success',

  // Lỗi
  PRODUCT_CREATE_FAILED: 'products.create.failed',
  PRODUCT_UPDATE_FAILED: 'products.update.failed',
  PRODUCT_DELETE_FAILED: 'products.delete.failed',
  PRODUCT_ALREADY_EXISTS: 'products.already_exists',

  // Danh mục
  CATEGORY_NOT_FOUND: 'products.category.not_found',
  CATEGORY_CREATED: 'products.category.created',
  CATEGORY_UPDATED: 'products.category.updated',
  CATEGORY_DELETED: 'products.category.deleted',
  CATEGORY_ALREADY_EXISTS: 'products.category.already_exists',
  CATEGORY_CREATE_FAILED: 'products.category.create.failed',
  CATEGORY_UPDATE_FAILED: 'products.category.update.failed',
  CATEGORY_DELETE_FAILED: 'products.category.delete.failed',
  CATEGORY_FETCH_SUCCESS: 'products.category.fetch.success',
  CATEGORY_FETCH_ALL_SUCCESS: 'products.category.fetch.all.success',

  // Đánh giá
  REVIEW_CREATED: 'products.review.created',
  REVIEW_NOT_FOUND: 'products.review.not_found',
  REVIEW_DELETED: 'products.review.deleted',

  // Upload messages
  UPLOAD_SUCCESS: 'UPLOAD_SUCCESS',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
} as const;
