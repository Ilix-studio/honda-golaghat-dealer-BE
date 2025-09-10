import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import Bikes from "../models/Bikes";
import Branch from "../models/Branch";
import { modelNames } from "mongoose";

/**
 * @desc    Get all bike categories
 * @route   GET /api/config/categories
 * @access  Public
 */
export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = [
      { id: "all", name: "All Bikes" },
      { id: "sport", name: "Sport" },
      { id: "commuter", name: "Commuter" },
      { id: "adventure", name: "Adventure" },
      { id: "cruiser", name: "Cruiser" },
      { id: "touring", name: "Touring" },
      { id: "naked", name: "Naked" },
      { id: "electric", name: "Electric" },
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  }
);

/**
 * @desc    Get all available features from existing bikes
 * @route   GET /api/config/features
 * @access  Public
 */
export const getAvailableFeatures = asyncHandler(
  async (req: Request, res: Response) => {
    const bikes = await Bikes.find({ inStock: true }).select("features");
    const allFeatures = bikes.flatMap((bike) => bike.features);
    const uniqueFeatures = [...new Set(allFeatures)].sort();

    res.status(200).json({
      success: true,
      data: uniqueFeatures,
    });
  }
);

/**
 * @desc    Get bike models for dropdowns
 * @route   GET /api/config/bike-models
 * @access  Public
 */
export const getBikeModels = asyncHandler(
  async (req: Request, res: Response) => {
    const bikes = await Bikes.find({ inStock: true })
      .select("modelName category")
      .sort("modelName");

    const bikeModels = bikes.map((bike) => ({
      id: bike._id,
      modelName: bike.modelName,
      category: bike.category,
    }));

    res.status(200).json({
      success: true,
      data: bikeModels,
    });
  }
);

/**
 * @desc    Get service types
 * @route   GET /api/config/service-types
 * @access  Public
 */
export const getServiceTypes = asyncHandler(
  async (req: Request, res: Response) => {
    const serviceTypes = [
      {
        id: "regular",
        name: "Regular Service",
        description: "Basic maintenance and inspection",
        estimatedTime: "2-3 hours",
        price: "₹1,500 - ₹3,000",
      },
      {
        id: "major",
        name: "Major Service",
        description: "Comprehensive inspection and maintenance",
        estimatedTime: "4-6 hours",
        price: "₹3,000 - ₹6,000",
      },
      {
        id: "tires",
        name: "Tire Service",
        description: "Tire replacement and wheel alignment",
        estimatedTime: "1-2 hours",
        price: "₹2,000 - ₹8,000",
      },
      {
        id: "diagnostic",
        name: "Diagnostic Check",
        description: "Computer diagnostic and troubleshooting",
        estimatedTime: "1 hour",
        price: "₹500 - ₹1,500",
      },
      {
        id: "repair",
        name: "Repair Service",
        description: "Specific component repair or replacement",
        estimatedTime: "Varies",
        price: "Varies",
      },
      {
        id: "warranty",
        name: "Warranty Service",
        description: "Warranty covered repairs and maintenance",
        estimatedTime: "Varies",
        price: "Free",
      },
    ];

    res.status(200).json({
      success: true,
      data: serviceTypes,
    });
  }
);

/**
 * @desc    Get additional services
 * @route   GET /api/config/additional-services
 * @access  Public
 */
export const getAdditionalServices = asyncHandler(
  async (req: Request, res: Response) => {
    const additionalServices = [
      { id: "wash", name: "Bike Wash & Clean", price: "₹300" },
      { id: "brake", name: "Brake Inspection", price: "₹500" },
      { id: "chain", name: "Chain Cleaning & Lubrication", price: "₹400" },
      { id: "battery", name: "Battery Check", price: "₹200" },
      { id: "suspension", name: "Suspension Check", price: "₹800" },
      { id: "oil-change", name: "Engine Oil Change", price: "₹1,200" },
      {
        id: "filter-replacement",
        name: "Air Filter Replacement",
        price: "₹600",
      },
      { id: "tune-up", name: "Engine Tune-up", price: "₹2,000" },
    ];

    res.status(200).json({
      success: true,
      data: additionalServices,
    });
  }
);

/**
 * @desc    Get available time slots
 * @route   GET /api/config/time-slots
 * @access  Public
 */
export const getTimeSlots = asyncHandler(
  async (req: Request, res: Response) => {
    const timeSlots = [
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
      "3:00 PM",
      "4:00 PM",
      "5:00 PM",
    ];

    res.status(200).json({
      success: true,
      data: timeSlots,
    });
  }
);

/**
 * @desc    Get service locations (branches that offer service)
 * @route   GET /api/config/service-locations
 * @access  Public
 */
export const getServiceLocations = asyncHandler(
  async (req: Request, res: Response) => {
    const branches = await Branch.find()
      .select("name address phone hours")
      .sort("name");

    const serviceLocations = branches.map((branch) => ({
      id: branch._id,
      name: branch.branchName,
      address: branch.address,
      phone: branch.phone,
      hours: branch.hours,
    }));

    res.status(200).json({
      success: true,
      data: serviceLocations,
    });
  }
);
