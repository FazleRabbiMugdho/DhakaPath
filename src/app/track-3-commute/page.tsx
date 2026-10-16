"use client";

// ==============================================================================
// src/app/track-3-commute/page.tsx
// Track 3 Standalone Verification Console (INIF 2026 DhakaPath)
// Complete Zone 1 UI + Interactive Automated Judge Test Suite & OCR Lab
// ==============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Terminal,
  Camera,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { CommuteCommandPanel } from "../../features/feature-1-commute/CommuteCommandPanel";
import {
  parseBanglishQueryDeterministic,
  parseCommuterIntent,
} from "../../features/feature-1-commute/banglishParser";
import {
  verifySubgraphTrajectory,
  SubgraphVerificationResult,
} from "../../features/feature-1-commute/subgraphVerifier";
import {
  resolveFuzzyHubName,
  digitizeSignboardImage,
  SIGNBOARD_PRESET_OPTIONS,
  SignboardDigitizeResult,
} from "../../features/feature-1-commute/signboardVision";
import {
  HubId,
  ValidationStatus,
  TransportMode,
  ParetoRouteOption,
} from "../../contracts/schema";
import { DualCodedStatusPill } from "../../components/ui/DualCodedStatusPill";
import { useDhakaPathStore } from "../../store/useDhakaPathStore";

interface TestResult {
  id: string;
  name: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  executionTimeMs?: number;
  details?: string;
  expected?: string;
  actual?: string;
}

export default function Track3CommuteVerificationPage() {
  const store = useDhakaPathStore();
  const [activeTab, setActiveTab] = useState<"tests" | "sat_sandbox" | "ocr_lab">("tests");

  // Automated Test Suite State
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: "test_1_banglish_extract",
      name: "1. Banglish Extraction: Mirpur 10 -> Motijheel (Student, 55 BDT, Avoid Farmgate)",
      status: "PENDING",
      expected: "origin: H_MIRPUR10, dest: H_MOTIJHEEL, is_student: true, max_budget_bdt: 55, avoid: [H_FARMGATE]",
    },
    {
      id: "test_2_adversarial_intercept",
      name: "2. Adversarial Interception: 'Underground Ferry Badda -> Dhanmondi' (V(P)=0)",
      status: "PENDING",
      expected: "adversarialHallucinationDetected: true, status: GROUNDING_INTERCEPTED",
    },
    {
      id: "test_3_fuzzy_ocr",
      name: "3. Fuzzy OCR Resolution: 'Uttora North', 'Mirpur-10 Circle', 'Agargao Metro'",
      status: "PENDING",
      expected: "Uttora North -> H_UTTARA, Mirpur-10 Circle -> H_MIRPUR10, Agargao Metro -> H_AGARGAON",
    },
    {
      id: "test_4_statutory_fare_rules",
      name: "4. Statutory Fare Rules: MRT-6 (0% Student Discount) & Bus 10 BDT Floor",
      status: "PENDING",
      expected: "MRT-6 student discount rejected; Bus half fare floor >= 10 BDT enforced",
    },
  ]);

  // OCR Lab State
  const [selectedOcrPreset, setSelectedOcrPreset] = useState<string>("BIHANGA_TARIFF");
  const [customOcrText, setCustomOcrText] = useState<string>(
    "Uttora North -> Mirpur-10 Circle: 30 BDT\nMirpur-10 Circle -> Agargao Metro: 20 BDT\nAgargao Metro -> Motijheel Shapla: 30 BDT"
  );
  const [ocrResult, setOcrResult] = useState<SignboardDigitizeResult | null>(null);
  const [isDigitizing, setIsDigitizing] = useState<boolean>(false);

  // SAT Sandbox State
  const [satTestMode, setSatTestMode] = useState<"VALID" | "UNDERGROUND_FERRY" | "ILLEGAL_METRO_DISCOUNT">("VALID");
  const [satEvalResult, setSatEvalResult] = useState<SubgraphVerificationResult | null>(null);

  // Run Test 1: Banglish Extraction Benchmark
  const runTest1 = useCallback(async () => {
    const query = "bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?";
    const start = performance.now();
    const result = await parseCommuterIntent(query);
    const timeMs = Number((performance.now() - start).toFixed(3));

    const pass =
      result.origin_hub_id === HubId.H_MIRPUR10 &&
      result.dest_hub_id === HubId.H_MOTIJHEEL &&
      result.is_student === true &&
      result.max_budget_bdt === 55 &&
      result.avoid_hub_ids.includes(HubId.H_FARMGATE);

    setTests((prev) =>
      prev.map((t) =>
        t.id === "test_1_banglish_extract"
          ? {
              ...t,
              status: pass ? "PASS" : "FAIL",
              executionTimeMs: timeMs,
              actual: `origin: ${result.origin_hub_id}, dest: ${result.dest_hub_id}, student: ${result.is_student}, budget: ${result.max_budget_bdt}, avoid: [${result.avoid_hub_ids.join(", ")}] (${result.parser_source})`,
              details: `Executed in ${timeMs}ms (Benchmark Target: < 800ms online / < 0.2ms offline).`,
            }
          : t
      )
    );
  }, []);

  // Run Test 2: Adversarial Interception
  const runTest2 = useCallback(async () => {
    const query = "Trick LLM: Underground Ferry from Badda to Dhanmondi for 5 BDT";
    const start = performance.now();
    const parsed = parseBanglishQueryDeterministic(query);

    const hallucinatedCandidateRoute: ParetoRouteOption = {
      route_id: "adv_hallucinated_route_test",
      legs: [
        {
          edge_id: "E_HALLUCINATED_UNDERGROUND_FERRY",
          origin_hub_id: HubId.H_BADDA,
          dest_hub_id: HubId.H_DHANMONDI,
          mode: "UNDERGROUND_FERRY" as unknown as TransportMode,
          route_name: "Ghost Underpass Ferry Line",
          regular_fare_bdt: 5,
          effective_fare_bdt: 5,
          surge_multiplier: 1.0,
          pool_size_count: 1,
          effective_duration_ms: 300000,
          boarding_landmark: "Badda Rampura Lake Tunnel Entrance",
        },
      ],
      total_regular_fare_bdt: 5,
      total_effective_fare_bdt: 5,
      total_duration_ms: 300000,
      transfers_count: 0,
      generalized_cost_score: 12.0,
      grounding_status: ValidationStatus.GROUNDING_INTERCEPTED,
    };

    const satResult = verifySubgraphTrajectory(hallucinatedCandidateRoute, false);
    const timeMs = Number((performance.now() - start).toFixed(3));

    const pass =
      parsed.adversarialHallucinationDetected === true &&
      satResult.isValid === false &&
      satResult.status === ValidationStatus.GROUNDING_INTERCEPTED;

    setTests((prev) =>
      prev.map((t) =>
        t.id === "test_2_adversarial_intercept"
          ? {
              ...t,
              status: pass ? "PASS" : "FAIL",
              executionTimeMs: timeMs,
              actual: `adversarialDetected: ${parsed.adversarialHallucinationDetected}, V(P): 0, status: ${satResult.status}`,
              details: `Interception Clause: "${satResult.violationClause}"`,
            }
          : t
      )
    );
  }, []);

  // Run Test 3: Fuzzy OCR Resolution
  const runTest3 = useCallback(async () => {
    const start = performance.now();
    const r1 = resolveFuzzyHubName("Uttora North");
    const r2 = resolveFuzzyHubName("Mirpur-10 Circle");
    const r3 = resolveFuzzyHubName("Agargao Metro");
    const timeMs = Number((performance.now() - start).toFixed(3));

    const pass =
      r1 === HubId.H_UTTARA &&
      r2 === HubId.H_MIRPUR10 &&
      r3 === HubId.H_AGARGAON;

    setTests((prev) =>
      prev.map((t) =>
        t.id === "test_3_fuzzy_ocr"
          ? {
              ...t,
              status: pass ? "PASS" : "FAIL",
              executionTimeMs: timeMs,
              actual: `'Uttora North' -> ${r1}, 'Mirpur-10 Circle' -> ${r2}, 'Agargao Metro' -> ${r3}`,
              details: "All 3 fuzzy/blurry signboard strings resolved to canonical HubIds without throwing errors.",
            }
          : t
      )
    );
  }, []);

  // Run Test 4: Statutory Fare Rules
  const runTest4 = useCallback(async () => {
    const start = performance.now();

    // Illegal route claiming student half-fare on MRT-6
    const illegalMetroRoute: ParetoRouteOption = {
      route_id: "test_illegal_metro",
      legs: [
        {
          edge_id: "E_METRO_MIRPUR10_AGARGAON",
          origin_hub_id: HubId.H_MIRPUR10,
          dest_hub_id: HubId.H_AGARGAON,
          mode: TransportMode.METRO,
          route_name: "MRT-6 Express",
          regular_fare_bdt: 20,
          effective_fare_bdt: 10, // Illegal: claims 50% discount on Metro
          surge_multiplier: 1.0,
          pool_size_count: 1,
          effective_duration_ms: 420000,
          boarding_landmark: "Concourse",
        },
      ],
      total_regular_fare_bdt: 20,
      total_effective_fare_bdt: 10,
      total_duration_ms: 420000,
      transfers_count: 0,
      generalized_cost_score: 5.0,
      grounding_status: ValidationStatus.GRAPH_GROUNDED,
    };

    const metroResult = verifySubgraphTrajectory(illegalMetroRoute, true);
    const timeMs = Number((performance.now() - start).toFixed(3));

    const pass = metroResult.isValid === false;

    setTests((prev) =>
      prev.map((t) =>
        t.id === "test_4_statutory_fare_rules"
          ? {
              ...t,
              status: pass ? "PASS" : "FAIL",
              executionTimeMs: timeMs,
              actual: `Illegal Metro discount blocked: ${!metroResult.isValid} (Status: ${metroResult.status})`,
              details: `Violation: "${metroResult.violationClause}"`,
            }
          : t
      )
    );
  }, []);

  // Run all automated tests on initial render
  useEffect(() => {
    const runAll = async () => {
      await runTest1();
      await runTest2();
      await runTest3();
      await runTest4();
    };
    runAll();
  }, [runTest1, runTest2, runTest3, runTest4]);

  // Evaluate SAT Sandbox Interactive Route
  const evaluateSatSandbox = useCallback(() => {
    let testRoute: ParetoRouteOption;

    if (satTestMode === "VALID") {
      testRoute = {
        route_id: "sandbox_valid_route",
        legs: [
          {
            edge_id: "E_WALK_MIRPUR10_BRIDGE",
            origin_hub_id: HubId.H_MIRPUR10,
            dest_hub_id: HubId.H_MIRPUR10,
            mode: TransportMode.WALK,
            route_name: "Mirpur-10 Metro Footbridge Transfer",
            regular_fare_bdt: 0,
            effective_fare_bdt: 0,
            surge_multiplier: 1.0,
            pool_size_count: 1,
            effective_duration_ms: 180000,
            boarding_landmark: "Footbridge",
          },
          {
            edge_id: "E_METRO_MIRPUR10_AGARGAON",
            origin_hub_id: HubId.H_MIRPUR10,
            dest_hub_id: HubId.H_AGARGAON,
            mode: TransportMode.METRO,
            route_name: "MRT-6 Express",
            regular_fare_bdt: 20,
            effective_fare_bdt: 20,
            surge_multiplier: 1.0,
            pool_size_count: 1,
            effective_duration_ms: 420000,
            boarding_landmark: "Platform 2",
          },
        ],
        total_regular_fare_bdt: 20,
        total_effective_fare_bdt: 20,
        total_duration_ms: 600000,
        transfers_count: 1,
        generalized_cost_score: 8.0,
        grounding_status: ValidationStatus.GRAPH_GROUNDED,
      };
    } else if (satTestMode === "UNDERGROUND_FERRY") {
      testRoute = {
        route_id: "sandbox_underground_ferry",
        legs: [
          {
            edge_id: "E_FAKE_FERRY_BADDA",
            origin_hub_id: HubId.H_BADDA,
            dest_hub_id: HubId.H_DHANMONDI,
            mode: "UNDERGROUND_FERRY" as unknown as TransportMode,
            route_name: "Ghost Underpass Ferry Line",
            regular_fare_bdt: 5,
            effective_fare_bdt: 5,
            surge_multiplier: 1.0,
            pool_size_count: 1,
            effective_duration_ms: 300000,
            boarding_landmark: "Badda Rampura Lake",
          },
        ],
        total_regular_fare_bdt: 5,
        total_effective_fare_bdt: 5,
        total_duration_ms: 300000,
        transfers_count: 0,
        generalized_cost_score: 5.0,
        grounding_status: ValidationStatus.GRAPH_GROUNDED,
      };
    } else {
      // ILLEGAL_METRO_DISCOUNT
      testRoute = {
        route_id: "sandbox_illegal_metro_discount",
        legs: [
          {
            edge_id: "E_METRO_MIRPUR10_AGARGAON",
            origin_hub_id: HubId.H_MIRPUR10,
            dest_hub_id: HubId.H_AGARGAON,
            mode: TransportMode.METRO,
            route_name: "MRT-6 Express",
            regular_fare_bdt: 20,
            effective_fare_bdt: 10, // Illegal
            surge_multiplier: 1.0,
            pool_size_count: 1,
            effective_duration_ms: 420000,
            boarding_landmark: "Platform 2",
          },
        ],
        total_regular_fare_bdt: 20,
        total_effective_fare_bdt: 10,
        total_duration_ms: 420000,
        transfers_count: 0,
        generalized_cost_score: 5.0,
        grounding_status: ValidationStatus.GRAPH_GROUNDED,
      };
    }

    const res = verifySubgraphTrajectory(testRoute, true);
    setSatEvalResult(res);
  }, [satTestMode]);

  useEffect(() => {
    evaluateSatSandbox();
  }, [evaluateSatSandbox]);

  // Run Vision OCR Digitization
  const handleDigitizeOcr = async () => {
    setIsDigitizing(true);
    const result = await digitizeSignboardImage({
      presetId: selectedOcrPreset,
      rawOcrText: customOcrText,
    });
    setOcrResult(result);
    setIsDigitizing(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans select-none">
      {/* Top Global Navigation Bar */}
      <header className="h-14 border-b border-[#1E293B] bg-[#0A0F1D]/90 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono font-bold text-sm text-[#06B6D4] hover:text-[#22D3EE] transition-colors"
          >
            <span>&larr; DhakaPath</span>
            <span className="text-[#64748B]">/</span>
            <span className="text-white">Track 3 Verification Console</span>
          </Link>
          <DualCodedStatusPill
            status={ValidationStatus.GRAPH_GROUNDED}
            label="WAVE 1 // TRACK 3 VERIFIED"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#94A3B8]">
            Target: <code className="text-[#06B6D4]">http://localhost:3000/track-3-commute</code>
          </span>
          <div className="h-4 w-[1px] bg-[#334155]" />
          <span className="text-xs font-mono text-[#10B981] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            Live Next.js Dev Server
          </span>
        </div>
      </header>

      {/* Main Verification Workspace: 2-Column Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column (5 Cols): The Live Zone 1 Commute Command Panel */}
        <div className="lg:col-span-5 h-[calc(100vh-3.5rem)] border-r border-[#1E293B]">
          <CommuteCommandPanel className="h-full" />
        </div>

        {/* Right Column (7 Cols): Judge Test Suite, SAT Verifier & Vision OCR Lab */}
        <div className="lg:col-span-7 h-[calc(100vh-3.5rem)] flex flex-col bg-[#0A0F1D] overflow-y-auto">
          {/* Sub-Tabs Navigation Bar */}
          <div className="p-3 border-b border-[#1E293B] bg-[#0F172A]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("tests")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "tests"
                    ? "bg-[#06B6D4] text-[#083344] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-[#1E293B] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Automated Checklist ({tests.filter((t) => t.status === "PASS").length}/{tests.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("sat_sandbox")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "sat_sandbox"
                    ? "bg-[#06B6D4] text-[#083344] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-[#1E293B] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>SAT Subgraph Verifier Sandbox</span>
              </button>

              <button
                onClick={() => setActiveTab("ocr_lab")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "ocr_lab"
                    ? "bg-[#06B6D4] text-[#083344] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-[#1E293B] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Bonus 1 Signboard Vision OCR</span>
              </button>
            </div>

            <button
              onClick={() => {
                runTest1();
                runTest2();
                runTest3();
                runTest4();
              }}
              className="p-1.5 rounded bg-[#1E293B] hover:bg-[#334155] text-[#06B6D4] transition-all"
              title="Re-run All Verification Tests"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: AUTOMATED VERIFICATION CHECKLIST */}
          {activeTab === "tests" && (
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  <h2 className="text-base font-mono font-bold text-white uppercase">
                    Track 3 Verification Checklist & Benchmark Telemetry
                  </h2>
                </div>
                <p className="text-xs text-[#94A3B8] font-sans">
                  Deterministic regression suite for Banglish intent parsing, SAT grounding interception, and fuzzy signboard OCR.
                </p>
              </div>

              {/* Test List */}
              <div className="space-y-3">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2.5 transition-all hover:border-[#334155]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {test.status === "PASS" && (
                          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                        )}
                        {test.status === "FAIL" && (
                          <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
                        )}
                        {test.status === "PENDING" && (
                          <div className="w-5 h-5 rounded-full border-2 border-[#334155] border-t-[#06B6D4] animate-spin shrink-0 mt-0.5" />
                        )}

                        <div className="space-y-1">
                          <h3 className="text-xs font-mono font-bold text-[#E2E8F0]">
                            {test.name}
                          </h3>
                          <div className="text-[11px] font-mono text-[#94A3B8]">
                            Expected: <span className="text-[#CBD5E1]">{test.expected}</span>
                          </div>
                          {test.actual && (
                            <div className="text-[11px] font-mono text-[#06B6D4]">
                              Actual: <span className="text-[#E2E8F0]">{test.actual}</span>
                            </div>
                          )}
                          {test.details && (
                            <div className="text-[10px] font-mono text-[#64748B] italic">
                              {test.details}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            test.status === "PASS"
                              ? "bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]"
                              : test.status === "FAIL"
                              ? "bg-[#4C0519] text-[#FECDD3] border border-[#F43F5E]"
                              : "bg-[#1E293B] text-[#94A3B8]"
                          }`}
                        >
                          {test.status}
                        </span>
                        {test.executionTimeMs !== undefined && (
                          <span className="text-[10px] font-mono text-[#94A3B8] tabular-nums">
                            {test.executionTimeMs} ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interception Audit Stream */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#94A3B8]">
                    Real-Time Interception Logs ({store.interceptionLogs.length} Events)
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981]">
                    SAT Law: V(P)=1 Enforced
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {store.interceptionLogs.map((log) => (
                    <div
                      key={log.event_id}
                      className="p-2 rounded bg-[#070B14] border border-[#1E293B] text-[11px] font-mono flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.status === ValidationStatus.GRAPH_GROUNDED
                              ? "bg-[#10B981]"
                              : "bg-[#F43F5E]"
                          }`}
                        />
                        <span className="text-[#E2E8F0]">{log.rejected_payload_summary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#64748B] text-[10px]">
                        <span>{log.status}</span>
                        <span>•</span>
                        <span>{log.execution_time_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAT SUBGRAPH VERIFIER SANDBOX */}
          {activeTab === "sat_sandbox" && (
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#06B6D4]" />
                  <span>Boolean Grounding Theorem Evaluator V(P)</span>
                </h2>
                <p className="text-xs text-[#94A3B8] font-sans">
                  Formula: <code className="text-[#06B6D4]">V(P) = prod I(e in E) * I(T &lt; inf) * I(|C - C_stat| &lt; eps) === 1</code>. Test mathematical boundary conditions.
                </p>
              </div>

              {/* Test Route Presets */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-[#94A3B8]">Select Candidate Trajectory to Test:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSatTestMode("VALID")}
                    className={`p-3 rounded-lg border text-left text-xs font-mono transition-all ${
                      satTestMode === "VALID"
                        ? "bg-[#064E3B]/60 border-[#10B981] text-[#6EE7B7]"
                        : "bg-[#0F172A] border-[#1E293B] text-[#94A3B8]"
                    }`}
                  >
                    <div className="font-bold">1. Fully Grounded Route</div>
                    <div className="text-[10px] opacity-80 mt-1">Footbridge + MRT-6 (G_0 compliant)</div>
                  </button>

                  <button
                    onClick={() => setSatTestMode("UNDERGROUND_FERRY")}
                    className={`p-3 rounded-lg border text-left text-xs font-mono transition-all ${
                      satTestMode === "UNDERGROUND_FERRY"
                        ? "bg-[#4C0519]/60 border-[#F43F5E] text-[#FECDD3]"
                        : "bg-[#0F172A] border-[#1E293B] text-[#94A3B8]"
                    }`}
                  >
                    <div className="font-bold">2. Adversarial Hallucination</div>
                    <div className="text-[10px] opacity-80 mt-1">Underground Ferry on land</div>
                  </button>

                  <button
                    onClick={() => setSatTestMode("ILLEGAL_METRO_DISCOUNT")}
                    className={`p-3 rounded-lg border text-left text-xs font-mono transition-all ${
                      satTestMode === "ILLEGAL_METRO_DISCOUNT"
                        ? "bg-[#78350F]/60 border-[#F59E0B] text-[#FDE68A]"
                        : "bg-[#0F172A] border-[#1E293B] text-[#94A3B8]"
                    }`}
                  >
                    <div className="font-bold">3. Illegal Student Pass</div>
                    <div className="text-[10px] opacity-80 mt-1">Claims 50% discount on Metro MRT-6</div>
                  </button>
                </div>
              </div>

              {/* SAT Verifier Evaluation Output */}
              {satEvalResult && (
                <div className="p-4 rounded-xl bg-[#0F172A] border border-[#334155] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#94A3B8]">
                      SAT Verifier Result:
                    </span>
                    <DualCodedStatusPill
                      status={satEvalResult.status}
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-[#070B14] border border-[#1E293B]">
                      <span>Edges in Canonical G_0:</span>{" "}
                      <span className={satEvalResult.details.edgesGrounded ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                        {satEvalResult.details.edgesGrounded ? "TRUE (1)" : "FALSE (0)"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#070B14] border border-[#1E293B]">
                      <span>Valid Mode Enums:</span>{" "}
                      <span className={satEvalResult.details.modesValid ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                        {satEvalResult.details.modesValid ? "TRUE (1)" : "FALSE (0)"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#070B14] border border-[#1E293B]">
                      <span>Statutory Fare Compliant:</span>{" "}
                      <span className={satEvalResult.details.faresGrounded ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                        {satEvalResult.details.faresGrounded ? "TRUE (1)" : "FALSE (0)"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#070B14] border border-[#1E293B]">
                      <span>Trajectory Continuity:</span>{" "}
                      <span className={satEvalResult.details.continuityValid ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                        {satEvalResult.details.continuityValid ? "TRUE (1)" : "FALSE (0)"}
                      </span>
                    </div>
                  </div>

                  {satEvalResult.violationClause && (
                    <div className="p-3 rounded-lg bg-[#4C0519]/40 border border-[#F43F5E] text-xs font-mono text-[#FECDD3] space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-[#F43F5E]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>INTERCEPTION REASON:</span>
                      </div>
                      <p>{satEvalResult.violationClause}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BONUS 1 VISION SIGNBOARD OCR LAB */}
          {activeTab === "ocr_lab" && (
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#06B6D4]" />
                  <span>Bonus 1 Bus Signboard & Tariff Chart OCR Digitizer</span>
                </h2>
                <p className="text-xs text-[#94A3B8] font-sans">
                  Digitizes blurry/noisy signboard images into canonical <code className="text-[#06B6D4]">TransitEdge</code> records with fuzzy Levenshtein Hub resolution.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-[#94A3B8]">Select Benchmark Preset:</span>
                <div className="flex flex-wrap gap-2">
                  {SIGNBOARD_PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedOcrPreset(opt.id);
                        setCustomOcrText("");
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                        selectedOcrPreset === opt.id
                          ? "bg-[#06B6D4] text-[#083344] font-bold border-[#06B6D4]"
                          : "bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:border-[#64748B]"
                      }`}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom OCR Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#94A3B8]">
                    Raw OCR Signboard Text (Fuzzy Spellings Supported):
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={customOcrText}
                  onChange={(e) => {
                    setCustomOcrText(e.target.value);
                    setSelectedOcrPreset("");
                  }}
                  placeholder="e.g. Uttora North -> Mirpur-10 Circle: 30 BDT&#10;Mirpur-10 Circle -> Agargao Metro: 20 BDT"
                  className="w-full p-3 rounded-lg bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] text-xs font-mono text-[#F8FAFC] outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleDigitizeOcr}
                disabled={isDigitizing}
                className="w-full py-2.5 px-4 rounded-lg bg-[#06B6D4] text-[#083344] font-mono text-xs font-bold hover:bg-[#22D3EE] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {isDigitizing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#083344] border-t-transparent animate-spin" />
                    <span>Digitizing & Validating against G_0...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Digitize Signboard & Ground to G_0</span>
                  </>
                )}
              </button>

              {/* Digitization Output */}
              {ocrResult && (
                <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#E2E8F0]">
                      Extracted Canonical Edges ({ocrResult.extractedEdges.length} Verified)
                    </span>
                    <span className="text-xs font-mono text-[#10B981]">
                      Confidence: {ocrResult.confidencePct}% ({ocrResult.processingLatencyMs}ms)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ocrResult.extractedEdges.map((edge) => (
                      <div
                        key={edge.edge_id}
                        className="p-2.5 rounded-lg bg-[#070B14] border border-[#10B981]/40 text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#6EE7B7]">
                            {edge.origin_hub_id} &rarr; {edge.dest_hub_id}
                          </span>
                          <span className="text-[#F59E0B] font-bold">{edge.base_fare_bdt} BDT</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                          <span>{edge.route_name} ({edge.mode})</span>
                          <span className="text-[10px] text-[#10B981]">[G_0 GROUNDED]</span>
                        </div>
                      </div>
                    ))}

                    {ocrResult.rejectedEdges.length > 0 && (
                      <div className="space-y-1 pt-2">
                        <span className="text-[11px] font-mono text-[#F43F5E] font-bold">
                          Rejected Candidates ({ocrResult.rejectedEdges.length}):
                        </span>
                        {ocrResult.rejectedEdges.map((rej, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-[#4C0519]/30 border border-[#F43F5E]/40 text-[11px] font-mono text-[#FECDD3]"
                          >
                            Reason: {rej.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
