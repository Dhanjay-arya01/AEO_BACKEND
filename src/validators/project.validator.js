const VALID_WEBSITE_TYPES = ['SaaS', 'E-commerce', 'Agency', 'Blog', 'Portfolio', 'Other'];

export function validateCreateProject(req) {
  const { name, websiteUrl, websiteType, keywords, competitors } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Project name must be at least 2 characters long');
  }

  if (!websiteUrl || typeof websiteUrl !== 'string' || !websiteUrl.trim().startsWith('http')) {
    errors.push('Website URL is required and must begin with http:// or https://');
  }

  if (websiteType && !VALID_WEBSITE_TYPES.includes(websiteType)) {
    errors.push(`Website type must be one of: ${VALID_WEBSITE_TYPES.join(', ')}`);
  }

  if (keywords && !Array.isArray(keywords)) {
    errors.push('Keywords must be an array of strings');
  }

  if (competitors && !Array.isArray(competitors)) {
    errors.push('Competitors must be an array of strings');
  }

  return errors;
}

export function validateUpdateProject(req) {
  const { name, websiteUrl, websiteType, keywords, competitors } = req.body || {};
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Project name must be at least 2 characters long');
  }

  if (websiteUrl !== undefined && (typeof websiteUrl !== 'string' || !websiteUrl.trim().startsWith('http'))) {
    errors.push('Website URL must begin with http:// or https://');
  }

  if (websiteType !== undefined && !VALID_WEBSITE_TYPES.includes(websiteType)) {
    errors.push(`Website type must be one of: ${VALID_WEBSITE_TYPES.join(', ')}`);
  }

  if (keywords !== undefined && !Array.isArray(keywords)) {
    errors.push('Keywords must be an array of strings');
  }

  if (competitors !== undefined && !Array.isArray(competitors)) {
    errors.push('Competitors must be an array of strings');
  }

  return errors;
}

export default {
  validateCreateProject,
  validateUpdateProject,
};
