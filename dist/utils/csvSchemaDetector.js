"use strict";
// utils/csvSchemaDetector.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCSVSchema = detectCSVSchema;
const CORE_FIELD_MAPPINGS = {
    modelName: ["Model Variant", "Model", "Variant", "Model Name"],
    engineNumber: ["Engine Number", "Engine No", "Engine"],
    chassisNumber: ["Frame Number", "Chassis Number", "Chassis", "Frame"],
    color: ["Color", "Colour"],
    location: ["LOCATION", "Location", "Branch"],
};
function detectCSVSchema(records) {
    if (records.length === 0) {
        throw new Error("No records to analyze");
    }
    const columns = Object.keys(records[0]);
    const mappings = {};
    // Auto-map known fields
    for (const [targetField, possibleNames] of Object.entries(CORE_FIELD_MAPPINGS)) {
        const match = columns.find((col) => possibleNames.some((name) => col.toLowerCase() === name.toLowerCase()));
        if (match) {
            mappings[targetField] = match;
        }
    }
    // Validate required mappings
    const required = ["modelName", "engineNumber", "chassisNumber", "color"];
    const missing = required.filter((field) => !mappings[field]);
    if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(", ")}`);
    }
    return {
        columns,
        mappings,
        sampleData: records.slice(0, 3),
    };
}
