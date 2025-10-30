import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { body } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.type === "field" ? error.path : "unknown",
        message: error.msg,
        value: error.type === "field" ? error.value : undefined,
      })),
    });
    return;
  }

  next();
};

export const validatePhoneCheck: ValidationChain[] = [
  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 6-9"),
];

export const validateBatchPhoneCheck: ValidationChain[] = [
  body("phoneNumbers")
    .isArray({ min: 1, max: 10 })
    .withMessage("Phone numbers must be an array with 1-10 items"),
  body("phoneNumbers.*")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Each phone number must be 10 digits starting with 6-9"),
];
