/**
 * Tool Dispatch Handler
 *
 * Extracted from server.ts (M1: responsibility separation)
 * Contains the dispatch logic for all Proxy MCP tools.
 * Wrapped in try/catch for resilience (M5).
 */

import { systemHealth } from '../tools/system';
import { skillSearch, skillRun } from '../tools/skill';
import { memoryAdd, memorySearch } from '../tools/memory';
import { verifyOutput } from '../validation/verification-layer';
import { runCoVe } from '../validation/cove';
import { analyzeReflexionRounds, evaluateRound } from '../validation/reflexion';
import { runValidationPipeline } from '../validation/pipeline';
import { evaluateProspectively } from '../validation/prospective-reflection';
import { getValidationConfig } from '../validation/config';
import { checkConstitutional } from '../validation/constitutional';
import { groundPrompt } from '../../rag/grounding';
import { ToolResult } from '../types';

/**
 * Dispatch a tool call to the appropriate handler
 */
export async function dispatch(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError: boolean }> {
  try {
    const result = await dispatchTool(name, args);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.success,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Route tool name to handler implementation
 */
async function dispatchTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResult> {
  switch (name) {
    case 'system_health':
      return systemHealth();

    case 'skill_search':
      return skillSearch((args?.query as string) || '');

    case 'skill_run':
      return skillRun(
        args?.name as string,
        args?.params as Record<string, unknown> | undefined
      );

    case 'memory_add': {
      const autoConfig = getValidationConfig();
      if (autoConfig.mode !== 'off' && args?.content) {
        const constitutionalCheck = checkConstitutional(args.content as string, { threshold: 0.7 });
        if (!constitutionalCheck.passed && autoConfig.mode === 'strict') {
          return {
            success: false,
            error: `Constitutional AI check failed: ${constitutionalCheck.violations.map(v => v.principle).join(', ')}`,
          };
        }
      }
      return memoryAdd(
        args?.content as string | undefined,
        (args?.type as 'short-term' | 'long-term') || 'short-term',
        {
          ...args?.metadata as Record<string, unknown> | undefined,
          contentPath: args?.content_path as string | undefined,
        }
      );
    }

    case 'memory_search':
      return memorySearch(args?.query as string);

    case 'output_verify': {
      const verifyResult = await verifyOutput(args?.text as string, {
        verifyThreshold: (args?.threshold as number) ?? 0.3,
        contextId: (args?.context_id as string) ?? 'default',
      });
      return {
        success: true,
        data: {
          passed: verifyResult.passed,
          uncertaintyScore: verifyResult.primaryValidation.uncertaintyScore,
          severity: verifyResult.primaryValidation.severity,
          flags: verifyResult.primaryValidation.uncertaintyFlags,
          consistencyViolations: verifyResult.primaryValidation.consistencyViolations,
          verificationRounds: verifyResult.verificationRounds,
          correctionPrompt: verifyResult.verificationNote,
        },
      };
    }

    case 'rag_ground': {
      const groundResult = await groundPrompt(args?.prompt as string, {
        topK: (args?.top_k as number) ?? 3,
      });
      return {
        success: true,
        data: {
          groundedPrompt: groundResult.groundedPrompt,
          snippetsUsed: groundResult.snippetsUsed,
          contextLength: groundResult.contextLength,
        },
      };
    }

    case 'cove_verify': {
      const coveResult = runCoVe(args?.text as string, {
        maxQuestions: (args?.max_questions as number) ?? 5,
      });
      return {
        success: true,
        data: {
          passed: coveResult.passed,
          claimsExtracted: coveResult.claims.length,
          questionsGenerated: coveResult.questions.length,
          contradictions: coveResult.contradictions.map(c => ({
            claim: c.claim.substring(0, 120),
            question: c.question,
            evidence: c.contradictionEvidence,
          })),
          contradictionRate: parseFloat(coveResult.contradictionRate.toFixed(3)),
          correctionPrompt: coveResult.correctionPrompt,
        },
      };
    }

    case 'validation_pipeline': {
      const pipelineResult = await runValidationPipeline(args?.text as string, {
        mode: args?.mode as 'off' | 'advisory' | 'strict' | 'full' | undefined,
        sourceTexts: args?.source_texts as string[] | undefined,
        contextId: args?.context_id as string | undefined,
      });
      return {
        success: true,
        data: {
          overallPassed: pipelineResult.overallPassed,
          mode: pipelineResult.mode,
          overallScore: parseFloat(pipelineResult.overallScore.toFixed(3)),
          summary: pipelineResult.summary,
          correctionPrompt: pipelineResult.correctionPrompt,
          layers: {
            constitutional: {
              passed: pipelineResult.layers.constitutional.passed,
              violationScore: parseFloat(pipelineResult.layers.constitutional.violationScore.toFixed(3)),
              violationCount: pipelineResult.layers.constitutional.violations.length,
            },
            selfContrast: {
              passed: pipelineResult.layers.selfContrast.passed,
              contrastScore: parseFloat(pipelineResult.layers.selfContrast.contrastScore.toFixed(3)),
              contradictionCount: pipelineResult.layers.selfContrast.contradictions.length,
            },
            cove: {
              passed: pipelineResult.layers.cove.passed,
              contradictionRate: parseFloat(pipelineResult.layers.cove.contradictionRate.toFixed(3)),
              contradictionCount: pipelineResult.layers.cove.contradictions.length,
            },
            faithfulness: {
              passed: pipelineResult.layers.faithfulness.passed,
              faithfulnessScore: parseFloat(pipelineResult.layers.faithfulness.faithfulnessScore.toFixed(3)),
            },
            deepEval: {
              passed: pipelineResult.layers.deepEval.passed,
              skipped: pipelineResult.layers.deepEval.skipped,
              hallucinationScore: parseFloat(pipelineResult.layers.deepEval.hallucinationScore.toFixed(3)),
            },
          },
        },
      };
    }

    case 'prospective_check': {
      const prospectiveResult = evaluateProspectively(args?.prompt as string, {
        threshold: args?.threshold as number | undefined,
      });
      return {
        success: true,
        data: {
          shouldProceed: prospectiveResult.shouldProceed,
          riskScore: parseFloat(prospectiveResult.riskScore.toFixed(3)),
          recommendation: prospectiveResult.recommendation,
          riskCount: prospectiveResult.risks.length,
          risks: prospectiveResult.risks,
          refinedPrompt: prospectiveResult.refinedPrompt,
        },
      };
    }

    case 'constitutional_check': {
      const constitutionalResult = checkConstitutional(args?.text as string, {
        threshold: args?.threshold as number | undefined,
      });
      return {
        success: true,
        data: {
          passed: constitutionalResult.passed,
          violationScore: parseFloat(constitutionalResult.violationScore.toFixed(3)),
          violationCount: constitutionalResult.violations.length,
          violations: constitutionalResult.violations,
          correctionPrompt: constitutionalResult.correctionPrompt,
        },
      };
    }

    case 'reflexion_analyze': {
      const reflexionResult = analyzeReflexionRounds(
        args?.outputs as string[],
        {
          convergenceThreshold: (args?.convergence_threshold as number) ?? 0.7,
          maxRounds: (args?.max_rounds as number) ?? 3,
        }
      );
      return {
        success: true,
        data: {
          converged: reflexionResult.converged,
          totalRounds: reflexionResult.totalRounds,
          bestRound: reflexionResult.bestRoundIndex + 1,
          bestScore: parseFloat(reflexionResult.bestRound.compositeScore.toFixed(3)),
          roundScores: reflexionResult.rounds.map(r => ({
            round: r.round,
            score: parseFloat(r.compositeScore.toFixed(3)),
            improvement: parseFloat(r.improvement.toFixed(3)),
            uncertaintyScore: parseFloat(r.validation.uncertaintyScore.toFixed(3)),
            contradictionRate: parseFloat(r.cove.contradictionRate.toFixed(3)),
          })),
          nextCorrectionPrompt: reflexionResult.nextCorrectionPrompt,
        },
      };
    }

    case 'reflexion_round': {
      const roundResult = evaluateRound(
        args?.output as string,
        args?.round_number as number,
        (args?.previous_outputs as string[]) ?? [],
        {
          convergenceThreshold: (args?.convergence_threshold as number) ?? 0.7,
          maxRounds: (args?.max_rounds as number) ?? 3,
        }
      );
      return {
        success: true,
        data: {
          round: roundResult.record.round,
          score: parseFloat(roundResult.record.compositeScore.toFixed(3)),
          improvement: parseFloat(roundResult.record.improvement.toFixed(3)),
          shouldContinue: roundResult.shouldContinue,
          reason: roundResult.reason,
          correctionPrompt: roundResult.record.correctionPrompt,
          details: {
            uncertaintyScore: parseFloat(roundResult.record.validation.uncertaintyScore.toFixed(3)),
            contradictionRate: parseFloat(roundResult.record.cove.contradictionRate.toFixed(3)),
            consistencyViolations: roundResult.record.validation.consistencyViolations.length,
          },
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
  }
}
