import express from "express";
import {
  getCategories,
  getAvailableFeatures,
  getBikeModels,
  getServiceTypes,
  getAdditionalServices,
  getTimeSlots,
  getServiceLocations,
} from "../controllers/config.controller";

const router = express.Router();

// Public configuration endpoints
router.get("/categories", getCategories);
router.get("/features", getAvailableFeatures);
router.get("/bike-models", getBikeModels);
router.get("/service-types", getServiceTypes);
router.get("/additional-services", getAdditionalServices);
router.get("/time-slots", getTimeSlots);
router.get("/service-locations", getServiceLocations);

export default router;
