/**
 * PA_REQUIRED_CPTS — CPT codes that require prior authorization.
 * In production this would be loaded from the payer's PA requirement API.
 */
export const PA_REQUIRED_CPTS = new Set([
  "43644", // Laparoscopic Roux-en-Y gastric bypass (bariatric)
  "43645", // Laparoscopic gastric bypass, revision
  "43770", // Laparoscopic adjustable gastric restrictive device
  "27447", // Total knee arthroplasty
  "27130", // Total hip arthroplasty
  "22612", // Lumbar spinal fusion
  "22630", // Lumbar interbody fusion
  "72148", // MRI lumbar spine w/o contrast
  "71275", // CT angiography, chest
  "74178", // CT abdomen/pelvis w and w/o contrast
  "93015", // Cardiovascular stress test
  "95810", // Polysomnography, ≥7 parameters
  "99601", // Home infusion therapy
]);

/**
 * NETWORK_ORGS — Organizations considered in-network.
 * In production resolved via PDex Plan-Net directory.
 */
export const NETWORK_ORGS = new Set([
  "org-metro-general",
  "Metro General Surgical Associates",
]);
