import { z } from 'zod';

// --- Form Input Schema (what the user submits) ---
export const formInputSchema = z.object({
  ownerName: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  propertyAddress: z.string().min(1, 'Property address is required'),
  monthlyRent: z.number().min(1, 'Monthly rent is required'),
  managementFeeCurrent: z.number().min(0, 'Current management fee is required'),
  leasingFeeCurrent: z.number().min(0).optional().default(0),
  managementType: z.enum(['self-managed', 'current_pm']),
  numUnits: z.number().min(1, 'Number of units is required'),
  hasCleanStatement: z.boolean(),
  avgMonthlyRepairs: z.number().min(0).optional(),
  reserveTarget: z.number().min(0).optional(),
  utilitiesResponsibility: z.enum(['owner', 'tenant']),
  hoaPassthrough: z.number().min(0).optional().default(0),
  passthroughCategories: z.array(z.string()).optional().default([]),
  desiredSwitchDate: z.string().min(1, 'Switch date is required'),
  switchTimeline: z.enum(['< 30 days', '30-60 days', '60-90 days', '90+ days']),
  primaryProblem: z.enum([
    'Messy statements',
    'Unclear owner payout',
    'Approval confusion',
    'Too many pass-through surprises',
    'No real portfolio visibility',
  ]),
});

export type FormInput = z.infer<typeof formInputSchema>;

// --- Sample Statement Output ---
export interface SampleStatement {
  grossRent: number;
  hearthManagementFee: number;
  effectiveManagementRate: number;
  repairsEstimate: number;
  reserveContribution: number;
  hoaPassthrough: number;
  utilities: number;
  totalDeductions: number;
  netOwnerDistribution: number;
}

// --- Reserve Recommendation ---
export interface ReserveRecommendation {
  targetAmount: number;
  monthlyContribution: number;
  rationale: string;
}

// --- Approval Breakdown (fixed) ---
export interface ApprovalBreakdown {
  ownerApproves: string[];
  hearthHandles: string[];
}

// --- Score Classification ---
export type ScoreClassification = 'low' | 'moderate' | 'high' | 'immediate';

// --- Scoring Output ---
export interface ScoreResult {
  leadScore: number;
  maxScore: number;
  scoreClassification: ScoreClassification;
  breakdown: {
    signal: string;
    points: number;
    triggered: boolean;
  }[];
}

// --- Full Statement Result ---
export interface StatementResult {
  sampleStatement: SampleStatement;
  reserveRecommendation: ReserveRecommendation;
  approvalBreakdown: ApprovalBreakdown;
}

// --- API Response ---
export interface SubmitResponse {
  success: boolean;
  statement: StatementResult;
  score: ScoreResult;
  closeLeadId?: string;
  resultUrl: string;
}

// --- Management type label helper ---
export type ManagementType = FormInput['managementType'];
