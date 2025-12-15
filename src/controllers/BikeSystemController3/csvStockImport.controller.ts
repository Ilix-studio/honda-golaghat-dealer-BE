// controllers/BikeSystemController2/csvStockImport.controller.ts

import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { parse } from "csv-parse";

import { detectCSVSchema } from "../../utils/csvSchemaDetector";
import { StockConceptCSVModel } from "../../models/BikeSystemModel3/StockConceptCSV";
import mongoose, { Types } from "mongoose";
import { StockConceptModel } from "../../models/BikeSystemModel2/StockConcept";
import { CustomerVehicleModel } from "../../models/BikeSystemModel2/CustomerVehicleModel";

export const importCSVStock = asyncHandler(
  async (req: Request, res: Response) => {
    const file = req.file;
    const { defaultBranchId } = req.body;

    if (!file) {
      res.status(400);
      throw new Error("CSV file required");
    }

    if (!defaultBranchId) {
      res.status(400);
      throw new Error("defaultBranchId required");
    }

    // Change parse implementation to:
    const records = await new Promise<Record<string, any>[]>(
      (resolve, reject) => {
        parse(
          file.buffer,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          },
          (err, output: unknown) => {
            if (err) reject(err);
            else resolve(output as Record<string, any>[]);
          }
        );
      }
    );

    // Detect schema
    const schema = detectCSVSchema(records);

    // Generate batch ID
    const batchId = `CSV-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    const importDate = new Date();

    const results = {
      success: false,
      totalRows: records.length,
      successCount: 0,
      failureCount: 0,
      batchId,
      detectedColumns: schema.columns,
      errors: [] as any[],
      created: [] as string[],
    };

    // Process records
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;

      try {
        // Extract core fields using detected mappings
        const modelName = row[schema.mappings.modelName];
        const engineNumber = row[schema.mappings.engineNumber]?.toUpperCase();
        const chassisNumber = row[schema.mappings.chassisNumber]?.toUpperCase();
        const color = row[schema.mappings.color];
        const location =
          row[schema.mappings.location]?.toUpperCase() || "WAREHOUSE";

        if (!engineNumber || !chassisNumber) {
          throw new Error("Engine/Chassis number missing");
        }

        // Check duplicates across BOTH models
        const [existingCSV, existingStock] = await Promise.all([
          StockConceptCSVModel.findOne({
            $or: [{ engineNumber }, { chassisNumber }],
          }),
          mongoose.model("StockConcept").findOne({
            $or: [{ engineNumber }, { chassisNumber }],
          }),
        ]);

        if (existingCSV || existingStock) {
          throw new Error(`Duplicate: ${engineNumber || chassisNumber}`);
        }

        // Generate stock ID
        const stockCount = await StockConceptCSVModel.countDocuments();
        const stockId = `CSV-${Date.now()}-${String(stockCount + 1).padStart(
          4,
          "0"
        )}`;

        // Create with ALL CSV data
        const csvStock = await StockConceptCSVModel.create({
          stockId,
          modelName,
          engineNumber,
          chassisNumber,
          color,

          csvImportBatch: batchId,
          csvImportDate: importDate,
          csvFileName: file.originalname,

          // Store ALL columns dynamically
          csvData: row,
          detectedColumns: schema.columns,
          schemaVersion: 1,

          stockStatus: {
            status: "Available",
            location,
            branchId: defaultBranchId,
            updatedBy: req.user!._id,
          },
        });

        results.created.push(csvStock.stockId);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : "Unknown",
        });
      }
    }

    results.success = results.failureCount === 0;

    res.status(results.success ? 201 : 207).json({
      success: true,
      message: `Imported ${results.successCount}/${results.totalRows}`,
      data: results,
    });
  }
);

// Get all CSV stocks
export const getCSVStocks = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, batchId, status, location } = req.query;

    const query: any = {};
    if (batchId) query.csvImportBatch = batchId;
    if (status) query["stockStatus.status"] = status;
    if (location) query["stockStatus.location"] = location;

    const skip = (Number(page) - 1) * Number(limit);

    const [stocks, total] = await Promise.all([
      StockConceptCSVModel.find(query)
        .populate("stockStatus.branchId", "branchName")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      StockConceptCSVModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: stocks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

export const assignCSVStockToCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { stockId } = req.params;
    const {
      stockType, // "manual" | "csv"
      customerId,
      salePrice,
      invoiceNumber,
      paymentStatus = "Paid",
      registrationDate,
      numberPlate,
      registeredOwnerName,
      insurance = false,
      isPaid = false,
      isFinance = false,
    } = req.body;

    if (!["manual", "csv"].includes(stockType)) {
      res.status(400);
      throw new Error("stockType must be 'manual' or 'csv'");
    }

    // Select model based on type
    const StockModel =
      stockType === "csv" ? StockConceptCSVModel : StockConceptModel;

    // With type guard approach:
    const stock =
      stockType === "csv"
        ? await StockConceptCSVModel.findOne({ stockId }).exec()
        : await StockConceptModel.findOne({ stockId }).exec();

    if (!stock) {
      res.status(404);
      throw new Error(`${stockType} stock not found`);
    }

    if (stock.stockStatus.status !== "Available") {
      res.status(400);
      throw new Error("Stock not available");
    }

    // Create CustomerVehicle (works with both models)
    const customerVehicle = await CustomerVehicleModel.create({
      stockConcept: stock._id, // Reference works for both
      customer: customerId,
      registrationDate,
      numberPlate,
      registeredOwnerName,
      isPaid,
      isFinance,
      insurance,
    });

    // Update stock
    stock.stockStatus.status = "Sold";
    stock.salesInfo = {
      soldTo: new Types.ObjectId(customerId), // Convert string to ObjectId
      soldDate: new Date(),
      salePrice,
      invoiceNumber,
      paymentStatus,
    };

    await stock.save();

    res.status(200).json({
      success: true,
      message: "Stock assigned successfully",
      data: {
        stockType,
        stock,
        customerVehicle,
      },
    });
  }
);
