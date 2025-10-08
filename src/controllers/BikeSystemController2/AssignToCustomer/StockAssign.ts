import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { StockConceptModel } from "../../../models/BikeSystemModel2/StockConcept";
import { BaseCustomerModel } from "../../../models/CustomerSystem/BaseCustomer";
import { CustomerVehicleModel } from "../../../models/BikeSystemModel2/CustomerVehicleModel";
import logger from "../../../utils/logger";

/**
 * @desc    Assign stock item to customer
 * @route   PATCH /api/stock-concept/:id/assign
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const assignToCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      phoneNumber,
      salePrice,
      invoiceNumber,
      paymentStatus = "Pending",
      registrationDate,
      numberPlate,
      registeredOwnerName,
      insurance = false,
      isPaid = false,
      isFinance = false,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid stock item ID");
    }

    // Validate required fields
    if (!phoneNumber || !salePrice || !invoiceNumber) {
      res.status(400);
      throw new Error(
        "Please provide customer phone number, sale price, and invoice number"
      );
    }

    // Check stock item exists and is available
    const stockItem = await StockConceptModel.findById(id);
    if (!stockItem) {
      res.status(404);
      throw new Error("Stock item not found");
    }

    if (stockItem.stockStatus.status !== "Available") {
      res.status(400);
      throw new Error("Stock item is not available for sale");
    }

    // Validate customer exists by phone number
    const customer = await BaseCustomerModel.findOne({ phoneNumber });
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found with this phone number");
    }

    // Create customer vehicle record
    const customerVehicle = await CustomerVehicleModel.create({
      stockConcept: stockItem._id,
      modelName: stockItem.modelName,
      registrationDate: registrationDate
        ? new Date(registrationDate)
        : undefined,
      numberPlate: numberPlate?.toUpperCase(),
      insurance,
      isPaid,
      isFinance,
      color: stockItem.color,
      customerPhoneNumber: customer._id,
      registeredOwnerName: registeredOwnerName || undefined,
      rtoInfo: numberPlate
        ? {
            rtoCode: numberPlate.substring(0, 4).toUpperCase(),
            rtoName: "RTO Office",
            rtoAddress: "RTO Address",
            state: "AS",
          }
        : undefined,
      servicePackage: {
        packageId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        currentServiceLevel: 1,
        nextServiceType: "firstService",
        completedServices: [],
      },
      serviceStatus: {
        serviceType: "Regular",
        kilometers: 0,
        serviceHistory: 0,
      },
      activeValueAddedServices: [],
    });

    // Save previous owner to sales history if this is a resale
    if (stockItem.salesInfo && stockItem.salesInfo.soldTo) {
      stockItem.salesHistory.push({
        soldTo: stockItem.salesInfo.soldTo,
        soldDate: stockItem.salesInfo.soldDate || new Date(),
        salePrice: stockItem.salesInfo.salePrice || 0,
        salesPerson: stockItem.salesInfo.salesPerson!,
        invoiceNumber: stockItem.salesInfo.invoiceNumber || "",
        paymentStatus: stockItem.salesInfo.paymentStatus || "Pending",
        customerVehicleId: stockItem.salesInfo.customerVehicleId!,
        transferType: "Ownership Transfer",
      });
    }

    // Update stock item with sales information
    stockItem.salesInfo = {
      soldTo: new mongoose.Types.ObjectId(customer._id),
      soldDate: new Date(),
      salePrice,

      invoiceNumber,
      paymentStatus,
      customerVehicleId: new mongoose.Types.ObjectId(customerVehicle._id),
    };

    stockItem.stockStatus.status = "Sold";
    stockItem.stockStatus.location = "Customer";
    stockItem.stockStatus.lastUpdated = new Date();

    await stockItem.save();

    await stockItem.populate([
      { path: "salesInfo.soldTo", select: "phoneNumber" },
      { path: "stockStatus.branchId", select: "branchName" },
    ]);

    logger.info(
      `Stock item ${stockItem.stockId} assigned to customer ${
        customer.phoneNumber
      } by ${req.user!._id}`
    );

    res.status(200).json({
      success: true,
      message: "Stock item successfully assigned to customer",
      data: {
        stockItem,
        customerVehicle: {
          _id: customerVehicle._id,
          modelName: customerVehicle.modelName,
          numberPlate: customerVehicle.numberPlate,
        },
      },
    });
  }
);
