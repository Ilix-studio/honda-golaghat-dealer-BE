import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import CustomerDashModel from "../../models/CustomerSystem/CustomerDashModel";
import ServiceAddonsModel from "../../models/CustomerSystem/ServiceAddons";

/**
 * @desc    Get customer service dashboard
 * @route   GET /api/customer-service-dashboard
 * @access  Private (Customer)
 */
export const getCustomerServiceDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    // Get customer vehicles
    const vehicles = await CustomerDashModel.find({
      customer: customerId,
      isActive: true,
    }).populate("customer", "firstName lastName phoneNumber");

    if (vehicles.length === 0) {
      res.status(404).json({
        success: false,
        message: "No vehicles found for customer",
      });
    }

    // Get service packages for vehicles
    const vehicleServiceData = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Find service package for this vehicle's model (you'll need to link this)
        const servicePackage = await ServiceAddonsModel.findOne({
          isActive: true,
          validFrom: { $lte: new Date() },
          validUntil: { $gte: new Date() },
        }).populate("motorcycleModel", "modelName category");

        const serviceHistory = vehicle.serviceStatus.serviceHistory;
        let nextService = null;

        if (serviceHistory === 0 && servicePackage) {
          nextService = {
            type: "firstService",
            service: servicePackage.firstService,
            description: "First Free Service",
          };
        } else if (serviceHistory === 1 && servicePackage) {
          nextService = {
            type: "secondService",
            service: servicePackage.secondService,
            description: "Second Free Service",
          };
        } else if (serviceHistory === 2 && servicePackage) {
          nextService = {
            type: "thirdService",
            service: servicePackage.thirdService,
            description: "Third Free Service",
          };
        } else if (serviceHistory >= 3 && servicePackage) {
          nextService = {
            type: "paidServiceOne",
            service: servicePackage.paidServiceOne,
            description: "Regular Paid Service",
          };
        }

        return {
          vehicle: {
            _id: vehicle._id,
            motorcyclemodelName: vehicle.motorcyclemodelName,
            numberPlate: vehicle.numberPlate,
            serviceStatus: vehicle.serviceStatus,
          },
          nextService,
          servicePackage: servicePackage
            ? {
                _id: servicePackage._id,
                validUntil: servicePackage.validUntil,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalVehicles: vehicles.length,
        vehicles: vehicleServiceData,
      },
    });
    return;
  }
);

/**
 * @desc    Get available services for customer
 * @route   GET /api/customer-service-dashboard/available-services
 * @access  Private (Customer)
 */
export const getAvailableServices = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;
    const { vehicleId } = req.query;

    const query: any = { customer: customerId, isActive: true };
    if (vehicleId) query._id = vehicleId;

    const vehicles = await CustomerDashModel.find(query);

    const availableServices = await Promise.all(
      vehicles.map(async (vehicle) => {
        const servicePackage = await ServiceAddonsModel.findOne({
          isActive: true,
          validFrom: { $lte: new Date() },
          validUntil: { $gte: new Date() },
        });

        if (!servicePackage) return { vehicle, services: [] };

        const serviceHistory = vehicle.serviceStatus.serviceHistory;
        const services = [];

        // Free services
        if (serviceHistory === 0) {
          services.push({
            type: "firstService",
            service: servicePackage.firstService,
            eligible: true,
          });
        } else if (serviceHistory === 1) {
          services.push({
            type: "secondService",
            service: servicePackage.secondService,
            eligible: true,
          });
        } else if (serviceHistory === 2) {
          services.push({
            type: "thirdService",
            service: servicePackage.thirdService,
            eligible: true,
          });
        }

        // Paid services (always available after 3rd service)
        if (serviceHistory >= 3) {
          services.push(
            {
              type: "paidServiceOne",
              service: servicePackage.paidServiceOne,
              eligible: true,
            },
            {
              type: "paidServiceTwo",
              service: servicePackage.paidServiceTwo,
              eligible: true,
            }
          );
        }

        // Additional services (always available)
        servicePackage.additionalServices.forEach((service, index) => {
          services.push({
            type: `additionalService${index + 1}`,
            service,
            eligible: true,
          });
        });

        return {
          vehicle: {
            _id: vehicle._id,
            motorcyclemodelName: vehicle.motorcyclemodelName,
            numberPlate: vehicle.numberPlate,
          },
          services,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: availableServices,
    });
  }
);

/**
 * @desc    Get service details
 * @route   GET /api/customer-service-dashboard/service/:serviceType
 * @access  Private (Customer)
 */
export const getServiceDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceType } = req.params;
    const { vehicleId } = req.query;
    const customerId = req.customer?._id;

    // Validate vehicle ownership
    const vehicle = await CustomerDashModel.findOne({
      _id: vehicleId,
      customer: customerId,
      isActive: true,
    });

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    const servicePackage = await ServiceAddonsModel.findOne({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    }).populate("applicableBranches", "name address phone");

    if (!servicePackage) {
      res.status(404);
      throw new Error("Service package not found");
    }

    let serviceDetails = null;

    // Get specific service based on type
    switch (serviceType) {
      case "firstService":
        serviceDetails = servicePackage.firstService;
        break;
      case "secondService":
        serviceDetails = servicePackage.secondService;
        break;
      case "thirdService":
        serviceDetails = servicePackage.thirdService;
        break;
      case "paidServiceOne":
        serviceDetails = servicePackage.paidServiceOne;
        break;
      case "paidServiceTwo":
        serviceDetails = servicePackage.paidServiceTwo;
        break;
      default:
        res.status(400);
        throw new Error("Invalid service type");
    }

    res.status(200).json({
      success: true,
      data: {
        vehicle: {
          _id: vehicle._id,
          motorcyclemodelName: vehicle.motorcyclemodelName,
          numberPlate: vehicle.numberPlate,
          currentKilometers: vehicle.serviceStatus.kilometers,
        },
        serviceDetails,
        availableBranches: servicePackage.applicableBranches,
      },
    });
  }
);

/**
 * @desc    Get service history
 * @route   GET /api/customer-service-dashboard/history
 * @access  Private (Customer)
 */
export const getServiceHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    const vehicles = await CustomerDashModel.find({
      customer: customerId,
      isActive: true,
    });

    // Mock service history - in real app, this would come from ServiceBooking model
    const serviceHistory = vehicles.map((vehicle) => ({
      vehicle: {
        _id: vehicle._id,
        motorcyclemodelName: vehicle.motorcyclemodelName,
        numberPlate: vehicle.numberPlate,
      },
      services: [
        {
          date: vehicle.serviceStatus.lastServiceDate,
          type: "Regular Service",
          kilometers: vehicle.serviceStatus.kilometers,
          cost: vehicle.serviceStatus.serviceHistory > 3 ? 2500 : 0,
          status: "Completed",
        },
      ],
      totalServices: vehicle.serviceStatus.serviceHistory,
      nextServiceDue: vehicle.serviceStatus.nextServiceDue,
    }));

    res.status(200).json({
      success: true,
      data: serviceHistory,
    });
  }
);

/**
 * @desc    Get service recommendations
 * @route   GET /api/customer-service-dashboard/recommendations
 * @access  Private (Customer)
 */
export const getServiceRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    const vehicles = await CustomerDashModel.find({
      customer: customerId,
      isActive: true,
    });

    const recommendations = vehicles.map((vehicle) => {
      const currentKm = vehicle.serviceStatus.kilometers;
      const serviceHistory = vehicle.serviceStatus.serviceHistory;
      const recs = [];

      // Mileage-based recommendations
      if (currentKm > 10000 && serviceHistory < 2) {
        recs.push({
          type: "service",
          priority: "high",
          message: "Vehicle is due for service based on mileage",
        });
      }

      // Time-based recommendations
      const daysSinceLastService = vehicle.serviceStatus.lastServiceDate
        ? Math.floor(
            (new Date().getTime() -
              new Date(vehicle.serviceStatus.lastServiceDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 365;

      if (daysSinceLastService > 180) {
        recs.push({
          type: "service",
          priority: "medium",
          message: "Consider scheduling a service - it's been over 6 months",
        });
      }

      // Fitness certificate check
      if (vehicle.fitnessUpTo < new Date()) {
        recs.push({
          type: "fitness",
          priority: "urgent",
          message: "Fitness certificate has expired",
        });
      }

      return {
        vehicle: {
          _id: vehicle._id,
          motorcyclemodelName: vehicle.motorcyclemodelName,
          numberPlate: vehicle.numberPlate,
        },
        recommendations: recs,
      };
    });

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  }
);
