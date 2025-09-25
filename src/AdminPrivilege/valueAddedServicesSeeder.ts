import ValueAddedServiceModel from "../models/BikeSystemModel2/VASmodel";

export const seedValueAddedServices = async () => {
  const services = [
    {
      serviceName: "Extended Warranty",
      serviceType: "Extended Warranty",
      description:
        "Protects against the repair or replacement of defective parts and labor, extending the standard warranty coverage for up to 7 years.",
      coverageYears: 7,
      maxEnrollmentPeriod: 108, // 9 years in months
      vehicleEligibility: {
        maxEngineCapacity: 250,
        categories: ["bike", "scooty"],
      },
      priceStructure: {
        basePrice: 2500,
        pricePerYear: 1500,
        engineCapacityMultiplier: 1.2,
      },
      benefits: [
        "Protects against repair or replacement of defective parts and labor",
        "Coverage for up to 7 years from purchase date",
        "Pan-India service network coverage",
        "Certified technicians",
        "Transferable warranty adds value to resale",
      ],
      coverage: {
        partsAndLabor: true,
        unlimitedKilometers: false,
        transferable: true,
        panIndiaService: true,
      },
      terms: [
        "Available for vehicles up to 250cc",
        "Can be purchased during new vehicle purchase or within warranty period",
        "Coverage starts after standard warranty expires",
        "Valid at Honda's authorized service centers",
      ],
      exclusions: [
        "Consumable items like oil, filters",
        "Damage due to accidents or misuse",
        "Modifications not approved by Honda",
      ],
      badges: [
        {
          name: "Extended Coverage",
          description: "7 Years Extended Warranty",
          icon: "shield-check",
          color: "#10B981",
          isActive: true,
        },
      ],
      validUntil: new Date("2025-12-31"),
    },

    {
      serviceName: "Extended Warranty Plus",
      serviceType: "Extended Warranty Plus",
      description:
        "Premium coverage providing protection for up to 10 years from purchase date with unlimited kilometers and comprehensive benefits.",
      coverageYears: 10,
      maxEnrollmentPeriod: 108,
      vehicleEligibility: {
        maxEngineCapacity: 250,
        categories: ["scooter", "motorcycle", "commuter"],
      },
      priceStructure: {
        basePrice: 4000,
        pricePerYear: 2000,
        engineCapacityMultiplier: 1.3,
      },
      benefits: [
        "Coverage for up to 10 years from purchase date",
        "Unlimited kilometer coverage for peace of mind",
        "Comprehensive parts and labor coverage",
        "Transferable warranty adds resale value",
        "24/7 roadside assistance",
        "Priority service appointments",
      ],
      coverage: {
        partsAndLabor: true,
        unlimitedKilometers: true,
        transferable: true,
        panIndiaService: true,
      },
      terms: [
        "Flexible enrollment within first 9 years",
        "Premium coverage with enhanced benefits",
        "Includes roadside assistance program",
      ],
      exclusions: [
        "Consumable items",
        "Accidental damage",
        "Racing or commercial use",
      ],
      badges: [
        {
          name: "Premium Warranty",
          description: "10 Years Comprehensive Coverage",
          icon: "star",
          color: "#F59E0B",
          isActive: true,
        },
        {
          name: "Unlimited KMs",
          description: "No Mileage Restrictions",
          icon: "infinity",
          color: "#8B5CF6",
          isActive: true,
        },
      ],
      validUntil: new Date("2025-12-31"),
    },

    {
      serviceName: "Annual Maintenance Contract",
      serviceType: "Annual Maintenance Contract",
      description:
        "Comprehensive maintenance packages covering periodic services, washing, and health checkups at reasonable costs.",
      coverageYears: 1,
      maxEnrollmentPeriod: 12,
      vehicleEligibility: {
        maxEngineCapacity: 999, // No engine limit for AMC
        categories: ["scooter", "motorcycle", "commuter", "sports", "cruiser"],
      },
      priceStructure: {
        basePrice: 3000,
        pricePerYear: 3000,
        engineCapacityMultiplier: 1.5,
      },
      benefits: [
        "Periodic maintenance services covered",
        "Vehicle washing and detailing",
        "Health checkups and diagnostics",
        "Genuine Honda parts and oils",
        "Certified technician services",
        "Cost-effective maintenance solution",
      ],
      coverage: {
        partsAndLabor: true,
        unlimitedKilometers: false,
        transferable: false,
        panIndiaService: true,
      },
      terms: [
        "Annual contract renewable yearly",
        "Covers scheduled maintenance only",
        "Valid for 12 months from purchase",
      ],
      exclusions: [
        "Major repairs not covered",
        "Accident-related damages",
        "Non-genuine parts usage voids contract",
      ],
      badges: [
        {
          name: "Annual Care",
          description: "Complete Year-round Maintenance",
          icon: "calendar-check",
          color: "#06B6D4",
          isActive: true,
        },
      ],
      validUntil: new Date("2025-12-31"),
    },

    {
      serviceName: "Engine Health Assurance",
      serviceType: "Engine Health Assurance",
      description:
        "Specialized program ensuring optimal engine performance and longevity for specific Honda models with comprehensive engine care.",
      coverageYears: 3,
      maxEnrollmentPeriod: 36,
      vehicleEligibility: {
        maxEngineCapacity: 200,
        categories: ["scooter", "commuter"],
      },
      priceStructure: {
        basePrice: 2000,
        pricePerYear: 1000,
        engineCapacityMultiplier: 1.1,
      },
      benefits: [
        "Engine quality assurance program",
        "Specialized engine diagnostics",
        "Preventive maintenance for engine health",
        "Expert technician consultation",
        "Engine performance optimization",
        "Extended engine life guarantee",
      ],
      coverage: {
        partsAndLabor: true,
        unlimitedKilometers: false,
        transferable: false,
        panIndiaService: true,
      },
      terms: [
        "Available for specific Honda models",
        "Engine-focused maintenance program",
        "Regular engine health monitoring",
      ],
      exclusions: [
        "Non-engine related issues",
        "External damage to engine",
        "Use of non-genuine engine oil",
      ],
      badges: [
        {
          name: "Engine Care",
          description: "Specialized Engine Protection",
          icon: "cog",
          color: "#EF4444",
          isActive: true,
        },
      ],
      validUntil: new Date("2025-12-31"),
    },

    {
      serviceName: "24/7 Roadside Assistance",
      serviceType: "Roadside Assistance",
      description:
        "Round-the-clock emergency assistance for situations like flat tires, dead batteries, or engine breakdowns with prompt on-road mechanic support.",
      coverageYears: 1,
      maxEnrollmentPeriod: 12,
      vehicleEligibility: {
        maxEngineCapacity: 999,
        categories: ["scooter", "motorcycle", "commuter", "sports", "cruiser"],
      },
      priceStructure: {
        basePrice: 1500,
        pricePerYear: 1500,
        engineCapacityMultiplier: 1.0,
      },
      benefits: [
        "24/7 emergency roadside assistance",
        "Flat tire replacement service",
        "Jump start for dead batteries",
        "On-road mechanic support",
        "Emergency fuel delivery",
        "Towing service to nearest Honda center",
      ],
      coverage: {
        partsAndLabor: false,
        unlimitedKilometers: true,
        transferable: false,
        panIndiaService: true,
      },
      terms: [
        "Available 24 hours, 365 days",
        "Coverage across major cities and highways",
        "Response time within 60 minutes in cities",
      ],
      exclusions: [
        "Parts and labor costs extra",
        "Services in remote areas may have delays",
        "Accident-related damages not covered",
      ],
      badges: [
        {
          name: "24/7 Support",
          description: "Round-the-clock Assistance",
          icon: "phone",
          color: "#DC2626",
          isActive: true,
        },
      ],
      validUntil: new Date("2025-12-31"),
    },
  ];

  try {
    await ValueAddedServiceModel.deleteMany({}); // Clear existing data
    await ValueAddedServiceModel.insertMany(services);
    console.log("Value Added Services seeded successfully");
  } catch (error) {
    console.error("Error seeding Value Added Services:", error);
  }
};
