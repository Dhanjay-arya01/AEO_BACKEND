import { ApiError } from '../utils/apiError.util.js';

/**
 * Creates an Express middleware from a validator function.
 * @param {Function} validatorFn - Function receiving req that returns an array of error messages or string
 */
export function validate(validatorFn) {
  return (req, res, next) => {
    try {
      const errors = validatorFn(req);
      if (errors && errors.length > 0) {
        return next(
          ApiError.badRequest(
            Array.isArray(errors) ? errors[0] : errors,
            Array.isArray(errors) ? errors : [errors],
            'VALIDATION_ERROR'
          )
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default validate;
