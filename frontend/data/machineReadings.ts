export interface MachineReadingPoint {
  step: number;
  testType: "Weighing" | "Repeatability" | "Eccentricity";
  nominalLoad: number;
  loadUnit: string;
  indication: number;
  deltaL: number;
  turningPointP: number;
  correctedError: number; // in e units
  mpeLimit: number; // in e units
  isPass: boolean;
}

export interface MachineDataset {
  instrumentId: number;
  purchaseDate: string;
  boughtDescription: string;
  supplierInvoice: string;
  commissionDate: string;
  lastVerificationDate: string;
  manufacturerCountry: string;
  baselineReadings: MachineReadingPoint[];
  currentReadings: MachineReadingPoint[];
}

export function computeDatasetStats(readings: MachineReadingPoint[]) {
  if (!readings || readings.length === 0) {
    return { mean: 0, std: 0.1, maxError: 0, passCount: 0, totalCount: 0 };
  }
  const n = readings.length;
  const errors = readings.map((r) => r.correctedError);
  const sum = errors.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / n) * 1000) / 1000;

  const variance =
    n > 1
      ? errors.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1)
      : 0.01;
  const std = Math.round(Math.sqrt(variance) * 1000) / 1000;
  const maxError = Math.max(...errors.map((e) => Math.abs(e)));
  const passCount = readings.filter((r) => r.isPass).length;

  return {
    mean,
    std: std || 0.05,
    maxError: Math.round(maxError * 1000) / 1000,
    passCount,
    totalCount: n,
  };
}

// 5 Dedicated Datasets for Default Instruments
export const machineDatasets: Record<number, MachineDataset> = {
  1: {
    // XPR205 Analytical (Class I, 220g, e=0.001g)
    instrumentId: 1,
    purchaseDate: "2023-03-15",
    boughtDescription: "Purchased March 15, 2023 (Bought 3.5 years ago)",
    supplierInvoice: "INV-MT-2023-0891 (Direct from Mettler-Toledo AG)",
    commissionDate: "2023-04-15",
    lastVerificationDate: "2026-08-10",
    manufacturerCountry: "Greifensee, Switzerland",
    baselineReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 5, loadUnit: "g", indication: 5.0000, deltaL: 0.0005, turningPointP: 5.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 20, loadUnit: "g", indication: 20.0000, deltaL: 0.0005, turningPointP: 20.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 50, loadUnit: "g", indication: 50.0000, deltaL: 0.0004, turningPointP: 50.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 4, testType: "Weighing", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 5, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0006, turningPointP: 99.9999, correctedError: -0.10, mpeLimit: 0.50, isPass: true },
      { step: 6, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 150, loadUnit: "g", indication: 150.0000, deltaL: 0.0004, turningPointP: 150.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 200, loadUnit: "g", indication: 200.0000, deltaL: 0.0005, turningPointP: 200.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 220, loadUnit: "g", indication: 220.0000, deltaL: 0.0006, turningPointP: 219.9999, correctedError: -0.10, mpeLimit: 1.00, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 70, loadUnit: "g", indication: 70.0000, deltaL: 0.0005, turningPointP: 70.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
    ],
    currentReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 5, loadUnit: "g", indication: 5.0000, deltaL: 0.0004, turningPointP: 5.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 20, loadUnit: "g", indication: 20.0000, deltaL: 0.0005, turningPointP: 20.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 50, loadUnit: "g", indication: 50.0001, deltaL: 0.0004, turningPointP: 50.0002, correctedError: 0.20, mpeLimit: 0.50, isPass: true },
      { step: 4, testType: "Weighing", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0004, turningPointP: 100.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 5, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0003, turningPointP: 100.0002, correctedError: 0.20, mpeLimit: 0.50, isPass: true },
      { step: 6, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 150, loadUnit: "g", indication: 150.0000, deltaL: 0.0004, turningPointP: 150.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 200, loadUnit: "g", indication: 200.0001, deltaL: 0.0005, turningPointP: 200.0001, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 220, loadUnit: "g", indication: 220.0000, deltaL: 0.0005, turningPointP: 220.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 70, loadUnit: "g", indication: 70.0000, deltaL: 0.0005, turningPointP: 70.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
    ],
  },

  2: {
    // Secura-324 High Precision (Class I, 320g, e=0.001g)
    instrumentId: 2,
    purchaseDate: "2022-10-10",
    boughtDescription: "Purchased October 10, 2022 (Bought 4 years ago)",
    supplierInvoice: "SAR-INV-2022-993 (Sartorius Lab Instruments GmbH)",
    commissionDate: "2022-11-20",
    lastVerificationDate: "2026-07-28",
    manufacturerCountry: "Göttingen, Germany",
    baselineReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 10, loadUnit: "g", indication: 10.0000, deltaL: 0.0005, turningPointP: 10.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 50, loadUnit: "g", indication: 50.0000, deltaL: 0.0005, turningPointP: 50.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0004, turningPointP: 100.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 5, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0006, turningPointP: 99.9999, correctedError: -0.10, mpeLimit: 0.50, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 200, loadUnit: "g", indication: 200.0000, deltaL: 0.0005, turningPointP: 200.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 250, loadUnit: "g", indication: 250.0000, deltaL: 0.0005, turningPointP: 250.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 300, loadUnit: "g", indication: 300.0000, deltaL: 0.0004, turningPointP: 300.0001, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 320, loadUnit: "g", indication: 320.0000, deltaL: 0.0005, turningPointP: 320.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0006, turningPointP: 99.9999, correctedError: -0.10, mpeLimit: 0.50, isPass: true },
    ],
    currentReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 10, loadUnit: "g", indication: 10.0000, deltaL: 0.0005, turningPointP: 10.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 50, loadUnit: "g", indication: 50.0000, deltaL: 0.0004, turningPointP: 50.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 100, loadUnit: "g", indication: 100.0001, deltaL: 0.0005, turningPointP: 100.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0004, turningPointP: 100.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 5, testType: "Repeatability", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 200, loadUnit: "g", indication: 200.0001, deltaL: 0.0005, turningPointP: 200.0001, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 250, loadUnit: "g", indication: 250.0000, deltaL: 0.0005, turningPointP: 250.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 300, loadUnit: "g", indication: 300.0000, deltaL: 0.0004, turningPointP: 300.0001, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 320, loadUnit: "g", indication: 320.0000, deltaL: 0.0005, turningPointP: 320.0000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 100, loadUnit: "g", indication: 100.0000, deltaL: 0.0005, turningPointP: 100.0000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
    ],
  },

  3: {
    // SC-II 800 Dual Range (Class III, 15000g, e=1/2/10g)
    instrumentId: 3,
    purchaseDate: "2023-12-05",
    boughtDescription: "Purchased December 5, 2023 (Bought 2.8 years ago)",
    supplierInvoice: "BIZ-DE-2023-4481 (Bizerba SE & Co. KG)",
    commissionDate: "2024-01-10",
    lastVerificationDate: "2026-09-02",
    manufacturerCountry: "Balingen, Germany",
    baselineReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 500, loadUnit: "g", indication: 500, deltaL: 0.5, turningPointP: 500.0, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 1500, loadUnit: "g", indication: 1500, deltaL: 0.4, turningPointP: 1500.1, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 3000, loadUnit: "g", indication: 3000, deltaL: 0.5, turningPointP: 3000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 3000, loadUnit: "g", indication: 3000, deltaL: 0.6, turningPointP: 2999.9, correctedError: -0.10, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 5000, loadUnit: "g", indication: 5000, deltaL: 0.5, turningPointP: 5000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 8000, loadUnit: "g", indication: 8000, deltaL: 0.4, turningPointP: 8000.1, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 10000, loadUnit: "g", indication: 10000, deltaL: 0.5, turningPointP: 10000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 12000, loadUnit: "g", indication: 12000, deltaL: 0.5, turningPointP: 12000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 15000, loadUnit: "g", indication: 15000, deltaL: 0.6, turningPointP: 14999.9, correctedError: -0.10, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 5000, loadUnit: "g", indication: 5000, deltaL: 0.5, turningPointP: 5000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
    ],
    currentReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 500, loadUnit: "g", indication: 500, deltaL: 0.3, turningPointP: 500.2, correctedError: 0.20, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 1500, loadUnit: "g", indication: 1500, deltaL: 0.2, turningPointP: 1500.3, correctedError: 0.30, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 3000, loadUnit: "g", indication: 3000, deltaL: 0.3, turningPointP: 3000.2, correctedError: 0.20, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 3000, loadUnit: "g", indication: 3000, deltaL: 0.2, turningPointP: 3000.3, correctedError: 0.30, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 5001, loadUnit: "g", indication: 5001, deltaL: 0.6, turningPointP: 5000.9, correctedError: 0.40, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 8000, loadUnit: "g", indication: 8000, deltaL: 0.3, turningPointP: 8000.2, correctedError: 0.20, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 10000, loadUnit: "g", indication: 10000, deltaL: 0.3, turningPointP: 10000.2, correctedError: 0.20, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 12000, loadUnit: "g", indication: 12000, deltaL: 0.4, turningPointP: 12000.1, correctedError: 0.10, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 15000, loadUnit: "g", indication: 15000, deltaL: 0.2, turningPointP: 15000.3, correctedError: 0.30, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 5000, loadUnit: "g", indication: 5000, deltaL: 0.3, turningPointP: 5000.2, correctedError: 0.20, mpeLimit: 1.00, isPass: true },
    ],
  },

  4: {
    // ZM305 Industrial Scale (Class III, 6000kg, e=1/2kg)
    instrumentId: 4,
    purchaseDate: "2021-05-12",
    boughtDescription: "Purchased May 12, 2021 (Bought 5.3 years ago)",
    supplierInvoice: "AV-USA-2021-1029 (Avery Weigh-Tronix LLC)",
    commissionDate: "2021-06-18",
    lastVerificationDate: "2026-06-15",
    manufacturerCountry: "Fairmont, MN, USA",
    baselineReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 50, loadUnit: "kg", indication: 50, deltaL: 0.5, turningPointP: 50.0, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 500, loadUnit: "kg", indication: 500, deltaL: 0.4, turningPointP: 500.1, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 1000, loadUnit: "kg", indication: 1000, deltaL: 0.5, turningPointP: 1000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 1000, loadUnit: "kg", indication: 1000, deltaL: 0.6, turningPointP: 999.9, correctedError: -0.10, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 2000, loadUnit: "kg", indication: 2000, deltaL: 0.5, turningPointP: 2000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 3000, loadUnit: "kg", indication: 3000, deltaL: 0.4, turningPointP: 3000.1, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 4000, loadUnit: "kg", indication: 4000, deltaL: 0.5, turningPointP: 4000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 5000, loadUnit: "kg", indication: 5000, deltaL: 0.5, turningPointP: 5000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 6000, loadUnit: "kg", indication: 6000, deltaL: 0.6, turningPointP: 5999.9, correctedError: -0.10, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 2000, loadUnit: "kg", indication: 2000, deltaL: 0.5, turningPointP: 2000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
    ],
    currentReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 50, loadUnit: "kg", indication: 50, deltaL: 0.3, turningPointP: 50.2, correctedError: 0.20, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 500, loadUnit: "kg", indication: 500, deltaL: 0.2, turningPointP: 500.3, correctedError: 0.30, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 1000, loadUnit: "kg", indication: 1000, deltaL: 0.2, turningPointP: 1000.3, correctedError: 0.30, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 1000, loadUnit: "kg", indication: 1000, deltaL: 0.1, turningPointP: 1000.4, correctedError: 0.40, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 2001, loadUnit: "kg", indication: 2001, deltaL: 0.7, turningPointP: 2000.8, correctedError: 0.40, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 3000, loadUnit: "kg", indication: 3000, deltaL: 0.2, turningPointP: 3000.3, correctedError: 0.30, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 4000, loadUnit: "kg", indication: 4000, deltaL: 0.3, turningPointP: 4000.2, correctedError: 0.20, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 5000, loadUnit: "kg", indication: 5000, deltaL: 0.2, turningPointP: 5000.3, correctedError: 0.30, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 6001, loadUnit: "kg", indication: 6001, deltaL: 0.6, turningPointP: 6000.9, correctedError: 0.45, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 2000, loadUnit: "kg", indication: 2000, deltaL: 0.3, turningPointP: 2000.2, correctedError: 0.25, mpeLimit: 1.00, isPass: true },
    ],
  },

  5: {
    // Crane-Pro 10T Heavy Duty (Class IIII, 10000kg, e=10kg)
    instrumentId: 5,
    purchaseDate: "2020-08-14",
    boughtDescription: "Purchased August 14, 2020 (Bought 6.1 years ago)",
    supplierInvoice: "DA-IT-2020-771 (Dini Argeo S.r.l.)",
    commissionDate: "2020-09-05",
    lastVerificationDate: "2026-09-25",
    manufacturerCountry: "Modena, Italy",
    baselineReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 500, loadUnit: "kg", indication: 500, deltaL: 5.0, turningPointP: 500.0, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 1000, loadUnit: "kg", indication: 1000, deltaL: 4.0, turningPointP: 1001.0, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
      { step: 3, testType: "Weighing", nominalLoad: 2000, loadUnit: "kg", indication: 2000, deltaL: 5.0, turningPointP: 2000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 2000, loadUnit: "kg", indication: 2000, deltaL: 6.0, turningPointP: 1999.0, correctedError: -0.10, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 4000, loadUnit: "kg", indication: 4000, deltaL: 5.0, turningPointP: 4000.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 6000, loadUnit: "kg", indication: 6000, deltaL: 4.0, turningPointP: 6001.0, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 8000, loadUnit: "kg", indication: 8000, deltaL: 5.0, turningPointP: 8000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 9000, loadUnit: "kg", indication: 9000, deltaL: 5.0, turningPointP: 9000.0, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 10000, loadUnit: "kg", indication: 10000, deltaL: 6.0, turningPointP: 9999.0, correctedError: -0.10, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 3300, loadUnit: "kg", indication: 3300, deltaL: 5.0, turningPointP: 3300.0, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
    ],
    currentReadings: [
      { step: 1, testType: "Weighing", nominalLoad: 500, loadUnit: "kg", indication: 500, deltaL: 2.0, turningPointP: 503.0, correctedError: 0.30, mpeLimit: 0.50, isPass: true },
      { step: 2, testType: "Weighing", nominalLoad: 1000, loadUnit: "kg", indication: 1010, deltaL: 6.0, turningPointP: 1009.0, correctedError: 0.60, mpeLimit: 0.50, isPass: false },
      { step: 3, testType: "Weighing", nominalLoad: 2000, loadUnit: "kg", indication: 2010, deltaL: 5.0, turningPointP: 2010.0, correctedError: 0.50, mpeLimit: 1.00, isPass: true },
      { step: 4, testType: "Repeatability", nominalLoad: 2000, loadUnit: "kg", indication: 2010, deltaL: 4.0, turningPointP: 2011.0, correctedError: 0.60, mpeLimit: 1.00, isPass: true },
      { step: 5, testType: "Weighing", nominalLoad: 4000, loadUnit: "kg", indication: 4010, deltaL: 3.0, turningPointP: 4012.0, correctedError: 0.70, mpeLimit: 1.00, isPass: true },
      { step: 6, testType: "Weighing", nominalLoad: 6000, loadUnit: "kg", indication: 6010, deltaL: 2.0, turningPointP: 6013.0, correctedError: 0.80, mpeLimit: 1.00, isPass: true },
      { step: 7, testType: "Weighing", nominalLoad: 8000, loadUnit: "kg", indication: 8010, deltaL: 3.0, turningPointP: 8012.0, correctedError: 0.70, mpeLimit: 1.50, isPass: true },
      { step: 8, testType: "Weighing", nominalLoad: 9000, loadUnit: "kg", indication: 9010, deltaL: 4.0, turningPointP: 9011.0, correctedError: 0.60, mpeLimit: 1.50, isPass: true },
      { step: 9, testType: "Weighing", nominalLoad: 10000, loadUnit: "kg", indication: 1010, deltaL: 4.0, turningPointP: 10011.0, correctedError: 0.55, mpeLimit: 1.50, isPass: true },
      { step: 10, testType: "Eccentricity", nominalLoad: 3300, loadUnit: "kg", indication: 3310, deltaL: 3.0, turningPointP: 3312.0, correctedError: 0.70, mpeLimit: 1.00, isPass: true },
    ],
  },
};

// Fallback dynamic generator for user-added machines
export function getOrCreateMachineDataset(inst: {
  id: number;
  manufacturer: string;
  max_capacity: string;
  capacity_unit: string;
  verification_interval_e: string;
  commission_date?: string;
  last_calibrated?: string;
}): MachineDataset {
  if (machineDatasets[inst.id]) {
    return machineDatasets[inst.id];
  }

  const cap = parseFloat(inst.max_capacity) || 100;
  const unit = inst.capacity_unit || "g";
  const eVal = parseFloat(inst.verification_interval_e) || 0.001;

  const baselineReadings: MachineReadingPoint[] = [
    { step: 1, testType: "Weighing", nominalLoad: Math.round(cap * 0.05 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.05 * 1000) / 1000, deltaL: eVal * 0.5, turningPointP: Math.round(cap * 0.05 * 1000) / 1000, correctedError: 0.00, mpeLimit: 0.50, isPass: true },
    { step: 2, testType: "Weighing", nominalLoad: Math.round(cap * 0.20 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.20 * 1000) / 1000, deltaL: eVal * 0.4, turningPointP: Math.round((cap * 0.20 + eVal * 0.1) * 1000) / 1000, correctedError: 0.10, mpeLimit: 0.50, isPass: true },
    { step: 3, testType: "Weighing", nominalLoad: Math.round(cap * 0.50 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.50 * 1000) / 1000, deltaL: eVal * 0.5, turningPointP: Math.round(cap * 0.50 * 1000) / 1000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
    { step: 4, testType: "Repeatability", nominalLoad: Math.round(cap * 0.50 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.50 * 1000) / 1000, deltaL: eVal * 0.6, turningPointP: Math.round((cap * 0.50 - eVal * 0.1) * 1000) / 1000, correctedError: -0.10, mpeLimit: 1.00, isPass: true },
    { step: 5, testType: "Repeatability", nominalLoad: Math.round(cap * 0.50 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.50 * 1000) / 1000, deltaL: eVal * 0.5, turningPointP: Math.round(cap * 0.50 * 1000) / 1000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
    { step: 6, testType: "Weighing", nominalLoad: Math.round(cap * 0.75 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.75 * 1000) / 1000, deltaL: eVal * 0.4, turningPointP: Math.round((cap * 0.75 + eVal * 0.1) * 1000) / 1000, correctedError: 0.10, mpeLimit: 1.00, isPass: true },
    { step: 7, testType: "Weighing", nominalLoad: Math.round(cap * 0.90 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.90 * 1000) / 1000, deltaL: eVal * 0.5, turningPointP: Math.round(cap * 0.90 * 1000) / 1000, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
    { step: 8, testType: "Weighing", nominalLoad: cap, loadUnit: unit, indication: cap, deltaL: eVal * 0.5, turningPointP: cap, correctedError: 0.00, mpeLimit: 1.50, isPass: true },
    { step: 9, testType: "Weighing", nominalLoad: cap, loadUnit: unit, indication: cap, deltaL: eVal * 0.6, turningPointP: Math.round((cap - eVal * 0.1) * 1000) / 1000, correctedError: -0.10, mpeLimit: 1.50, isPass: true },
    { step: 10, testType: "Eccentricity", nominalLoad: Math.round(cap * 0.33 * 1000) / 1000, loadUnit: unit, indication: Math.round(cap * 0.33 * 1000) / 1000, deltaL: eVal * 0.5, turningPointP: Math.round(cap * 0.33 * 1000) / 1000, correctedError: 0.00, mpeLimit: 1.00, isPass: true },
  ];

  const currentReadings: MachineReadingPoint[] = baselineReadings.map((pt, idx) => {
    const driftE = idx % 2 === 0 ? 0.10 : 0.05;
    const err = Math.round((pt.correctedError + driftE) * 100) / 100;
    return {
      ...pt,
      turningPointP: Math.round((pt.turningPointP + driftE * eVal) * 10000) / 10000,
      correctedError: err,
      isPass: Math.abs(err) <= pt.mpeLimit,
    };
  });

  const generated: MachineDataset = {
    instrumentId: inst.id,
    purchaseDate: "2024-02-14",
    boughtDescription: "Purchased February 14, 2024 (Bought 2.6 years ago)",
    supplierInvoice: `INV-MET-${inst.id}-GEN (Authorized Distributor)`,
    commissionDate: inst.commission_date || "2024-03-01",
    lastVerificationDate: inst.last_calibrated || "2026-08-15",
    manufacturerCountry: "Factory OEM (ISO 17025 Accredited)",
    baselineReadings,
    currentReadings,
  };

  machineDatasets[inst.id] = generated;
  return generated;
}
