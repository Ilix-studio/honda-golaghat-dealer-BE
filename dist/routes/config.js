"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_controller_1 = require("../controllers/config.controller");
const router = express_1.default.Router();
// Public configuration endpoints
router.get("/categories", config_controller_1.getCategories);
router.get("/features", config_controller_1.getAvailableFeatures);
router.get("/bike-models", config_controller_1.getBikeModels);
router.get("/service-types", config_controller_1.getServiceTypes);
router.get("/additional-services", config_controller_1.getAdditionalServices);
router.get("/time-slots", config_controller_1.getTimeSlots);
router.get("/service-locations", config_controller_1.getServiceLocations);
exports.default = router;
