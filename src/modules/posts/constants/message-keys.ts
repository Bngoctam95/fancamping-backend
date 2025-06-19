export const POSTS_MESSAGE_KEYS = {
  // Post messages
  POST_NOT_FOUND: 'posts.not_found',
  POST_CREATED: 'posts.created',
  POST_UPDATED: 'posts.updated',
  POST_DELETED: 'posts.deleted',
  POST_CREATE_FAILED: 'posts.create_failed',
  POST_UPDATE_FAILED: 'posts.update_failed',
  POST_DELETE_FAILED: 'posts.delete_failed',
  POST_FETCH_SUCCESS: 'posts.fetch_success',
  POST_FETCH_ALL_SUCCESS: 'posts.fetch_all_success',
  POST_ALREADY_EXISTS: 'posts.already_exists',

  // Category messages
  CATEGORY_NOT_FOUND: 'posts.category.not_found',
  CATEGORY_ALREADY_EXISTS: 'posts.category.already_exists',
  CATEGORY_CREATED: 'posts.category.created',
  CATEGORY_UPDATED: 'posts.category.updated',
  CATEGORY_DELETED: 'posts.category.deleted',
  CATEGORY_CREATE_FAILED: 'posts.category.create_failed',
  CATEGORY_UPDATE_FAILED: 'posts.category.update_failed',
  CATEGORY_DELETE_FAILED: 'posts.category.delete_failed',
  CATEGORY_FETCH_SUCCESS: 'posts.category.fetch_success',
  CATEGORY_FETCH_ALL_SUCCESS: 'posts.category.fetch_all_success',

  // Comment messages
  COMMENT_NOT_FOUND: 'posts.comment.not_found',
  COMMENT_CREATED: 'posts.comment.created',
  COMMENT_UPDATED: 'posts.comment.updated',
  COMMENT_DELETED: 'posts.comment.deleted',
  COMMENT_CREATE_FAILED: 'posts.comment.create_failed',
  COMMENT_UPDATE_FAILED: 'posts.comment.update_failed',
  COMMENT_DELETE_FAILED: 'posts.comment.delete_failed',
  COMMENT_FETCH_SUCCESS: 'posts.comment.fetch_success',
  COMMENT_FETCH_ALL_SUCCESS: 'posts.comment.fetch_all_success',

  // Like messages
  LIKE_TOGGLED: 'posts.like.toggled',
  LIKE_FETCH_SUCCESS: 'posts.like.fetch_success',

  // Upload messages
  UPLOAD_SUCCESS: 'posts.upload.success',
  UPLOAD_FAILED: 'posts.upload.failed',
} as const;
