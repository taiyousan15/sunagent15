/**
 * Unit tests for scripts/generate-agents-baseline.js
 *
 * Covers Codex re-review findings (doc/CODEXレビュー/2026-05-14_120000_step1.5-rereview-no-go.md):
 *   - F1: deep-type validation, null treated as missing
 *   - F2: catalog comparison (surplus / missing)
 *   - F3: slug regex + Windows reserved denylist + hyphen rules
 *   - new MED: dedicated unit tests for the generator
 */

const {
  AGENT_NAME_REGEX,
  WINDOWS_RESERVED,
  REQUIRED_NESTED_TYPES,
  REQUIRED_NESTED_CHILDREN,
  getPath,
  validateSlug,
  deepValidate,
  extractAgentNameFromCatalog,
  compareCatalog,
} = require('../generate-agents-baseline');

describe('AGENT_NAME_REGEX (F3)', () => {
  test('accepts simple lowercase slugs', () => {
    expect(AGENT_NAME_REGEX.test('api-designer')).toBe(true);
    expect(AGENT_NAME_REGEX.test('a')).toBe(true);
    expect(AGENT_NAME_REGEX.test('agent42')).toBe(true);
  });

  test('rejects uppercase, underscores, special chars', () => {
    expect(AGENT_NAME_REGEX.test('APIDesigner')).toBe(false);
    expect(AGENT_NAME_REGEX.test('api_designer')).toBe(false);
    expect(AGENT_NAME_REGEX.test('api.designer')).toBe(false);
    expect(AGENT_NAME_REGEX.test('api designer')).toBe(false);
  });

  test('rejects starting with digit', () => {
    expect(AGENT_NAME_REGEX.test('1api')).toBe(false);
    expect(AGENT_NAME_REGEX.test('42-agent')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(AGENT_NAME_REGEX.test('')).toBe(false);
  });
});

describe('WINDOWS_RESERVED (F3)', () => {
  test('contains classic device names', () => {
    expect(WINDOWS_RESERVED.has('CON')).toBe(true);
    expect(WINDOWS_RESERVED.has('NUL')).toBe(true);
    expect(WINDOWS_RESERVED.has('AUX')).toBe(true);
    expect(WINDOWS_RESERVED.has('PRN')).toBe(true);
  });

  test('contains numbered COM/LPT 1-9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(WINDOWS_RESERVED.has(`COM${i}`)).toBe(true);
      expect(WINDOWS_RESERVED.has(`LPT${i}`)).toBe(true);
    }
  });

  test('does not contain plausible agent names', () => {
    expect(WINDOWS_RESERVED.has('API-DESIGNER')).toBe(false);
    expect(WINDOWS_RESERVED.has('COORDINATOR')).toBe(false);
  });
});

describe('validateSlug (F3)', () => {
  test('accepts valid slug with matching filename', () => {
    expect(() => validateSlug('api-designer', 'api-designer-stats.yaml')).not.toThrow();
  });

  test('accepts valid slug when sourceFile is null (manifest context)', () => {
    expect(() => validateSlug('api-designer', null)).not.toThrow();
  });

  test('rejects regex violations', () => {
    expect(() => validateSlug('APIDesigner', 'APIDesigner-stats.yaml')).toThrow(/violates slug regex/);
    expect(() => validateSlug('api_designer', 'api_designer-stats.yaml')).toThrow(/violates slug regex/);
    expect(() => validateSlug('1api', '1api-stats.yaml')).toThrow(/violates slug regex/);
  });

  test('rejects trailing hyphen', () => {
    expect(() => validateSlug('api-', 'api--stats.yaml')).toThrow(/ends with a hyphen/);
    expect(() => validateSlug('agent-name-', 'agent-name--stats.yaml')).toThrow(/ends with a hyphen/);
  });

  test('rejects consecutive hyphens', () => {
    expect(() => validateSlug('api--designer', 'api--designer-stats.yaml')).toThrow(/consecutive hyphens/);
    expect(() => validateSlug('a--b', 'a--b-stats.yaml')).toThrow(/consecutive hyphens/);
  });

  test('rejects Windows reserved names (case insensitive)', () => {
    expect(() => validateSlug('con', 'con-stats.yaml')).toThrow(/Windows reserved/);
    expect(() => validateSlug('nul', 'nul-stats.yaml')).toThrow(/Windows reserved/);
    expect(() => validateSlug('com1', 'com1-stats.yaml')).toThrow(/Windows reserved/);
    expect(() => validateSlug('lpt9', 'lpt9-stats.yaml')).toThrow(/Windows reserved/);
  });

  test('rejects when filename does not match agent_name', () => {
    expect(() => validateSlug('api-designer', 'wrong-file.yaml')).toThrow(/does not match filename/);
  });
});

describe('getPath', () => {
  const obj = {
    a: {
      b: {
        c: 42,
      },
      nullField: null,
    },
  };

  test('resolves valid nested path', () => {
    expect(getPath(obj, 'a.b.c')).toBe(42);
  });

  test('returns undefined for missing path', () => {
    expect(getPath(obj, 'a.b.missing')).toBeUndefined();
    expect(getPath(obj, 'missing.deep.path')).toBeUndefined();
  });

  test('returns null for null intermediate', () => {
    expect(getPath(obj, 'a.nullField')).toBeNull();
  });

  test('returns undefined when descending into null', () => {
    expect(getPath(obj, 'a.nullField.child')).toBeUndefined();
  });
});

describe('deepValidate (F1)', () => {
  function fullValidStats() {
    return {
      agent_name: 'test-agent',
      omega_metrics: {
        performance_bounds: {
          min_quality_score: 100,
          min_success_rate: 0.8,
          max_latency_ms: 5000,
          worst_case: {
            quality_score: 100,
            success_rate: 0,
            latency_ms: 0,
          },
        },
        dependencies: {
          omega: 6,
          little_omega: 6,
          coupling_ratio: 1,
          dependencies_list: {
            tools: ['Read'],
            agents: [],
            external: [],
          },
          coupling_health: {
            status: 'good',
            recommendation: '',
          },
        },
        completion_probability: {
          base_omega: 0,
          by_complexity: { low: 0.99, medium: 0.95, high: 0.85 },
          by_category: { implementation: 0 },
          confidence_interval: 0.05,
          sample_size: 0,
          prediction_accuracy: {
            total_predictions: 0,
            accurate_predictions: 0,
            accuracy_rate: 0,
          },
        },
      },
      learning_metrics: {
        learning_rate: 0.1,
        quality_trend: { direction: 'stable', rate: 0 },
        success_trend: { direction: 'stable', rate: 0 },
        specialization: {
          primary_category: 'implementation',
          specialization_score: 0,
          categories: { implementation: 0 },
        },
      },
      metadata: {
        schema_version: '1.0.0',
        omega_integration_date: '2025-11-06',
      },
    };
  }

  test('passes for fully valid stats', () => {
    expect(() => deepValidate(fullValidStats(), 'test-agent-stats.yaml')).not.toThrow();
  });

  test('fails on missing parent (omega_metrics)', () => {
    const stats = fullValidStats();
    delete stats.omega_metrics;
    expect(() => deepValidate(stats, 'test.yaml')).toThrow(/omega_metrics missing/);
  });

  test('fails on missing nested child', () => {
    const stats = fullValidStats();
    delete stats.omega_metrics.performance_bounds.worst_case;
    expect(() => deepValidate(stats, 'test.yaml')).toThrow(/worst_case/);
  });

  test('fails on null leaf field (F1 HIGH fix — null treated as missing)', () => {
    const stats = fullValidStats();
    stats.omega_metrics.performance_bounds.min_quality_score = null;
    expect(() => deepValidate(stats, 'test.yaml')).toThrow(/min_quality_score missing or null/);
  });

  test('fails on wrong type (number expected, string given)', () => {
    const stats = fullValidStats();
    stats.omega_metrics.performance_bounds.min_quality_score = 'high';
    expect(() => deepValidate(stats, 'test.yaml')).toThrow(/min_quality_score should be number/);
  });

  test('fails on wrong type (array expected, string given)', () => {
    const stats = fullValidStats();
    stats.omega_metrics.dependencies.dependencies_list.tools = 'Read';
    expect(() => deepValidate(stats, 'test.yaml')).toThrow(/tools should be array/);
  });

  test('fails on multiple errors with all errors reported', () => {
    const stats = fullValidStats();
    delete stats.omega_metrics.performance_bounds.min_quality_score;
    delete stats.learning_metrics.learning_rate;
    let caught;
    try {
      deepValidate(stats, 'test.yaml');
    } catch (err) {
      caught = err.message;
    }
    expect(caught).toMatch(/min_quality_score/);
    expect(caught).toMatch(/learning_rate/);
  });
});

describe('REQUIRED_NESTED_TYPES coverage (F1)', () => {
  test('covers performance_bounds deep fields', () => {
    expect(REQUIRED_NESTED_TYPES['omega_metrics.performance_bounds.min_quality_score']).toBe('number');
    expect(REQUIRED_NESTED_TYPES['omega_metrics.performance_bounds.worst_case.quality_score']).toBe('number');
  });

  test('covers dependencies aggregates (Codex F1 explicit findings)', () => {
    expect(REQUIRED_NESTED_TYPES['omega_metrics.dependencies.omega']).toBe('number');
    expect(REQUIRED_NESTED_TYPES['omega_metrics.dependencies.coupling_ratio']).toBe('number');
    expect(REQUIRED_NESTED_TYPES['omega_metrics.dependencies.coupling_health.status']).toBe('string');
  });

  test('covers completion_probability.prediction_accuracy interior', () => {
    expect(REQUIRED_NESTED_TYPES['omega_metrics.completion_probability.prediction_accuracy.accuracy_rate']).toBe('number');
  });

  test('covers learning_metrics trends', () => {
    expect(REQUIRED_NESTED_TYPES['learning_metrics.quality_trend.direction']).toBe('string');
    expect(REQUIRED_NESTED_TYPES['learning_metrics.success_trend.rate']).toBe('number');
  });

  test('covers specialization', () => {
    expect(REQUIRED_NESTED_TYPES['learning_metrics.specialization.primary_category']).toBe('string');
    expect(REQUIRED_NESTED_TYPES['learning_metrics.specialization.specialization_score']).toBe('number');
  });

  test('covers metadata', () => {
    expect(REQUIRED_NESTED_TYPES['metadata.schema_version']).toBe('string');
    expect(REQUIRED_NESTED_TYPES['metadata.omega_integration_date']).toBe('string');
  });

  test('total leaf type count is at least 30 (Codex demanded 15+)', () => {
    expect(Object.keys(REQUIRED_NESTED_TYPES).length).toBeGreaterThanOrEqual(30);
  });
});

describe('extractAgentNameFromCatalog (F2)', () => {
  test('strips .md extension', () => {
    expect(extractAgentNameFromCatalog('architect.md')).toBe('architect');
  });

  test('strips single ait42- prefix', () => {
    expect(extractAgentNameFromCatalog('ait42-api-designer.md')).toBe('api-designer');
    expect(extractAgentNameFromCatalog('ait42-backend-developer.md')).toBe('backend-developer');
  });

  test('strips numeric prefix and ait42 (handles 00-ait42-coordinator.md)', () => {
    expect(extractAgentNameFromCatalog('00-ait42-coordinator.md')).toBe('coordinator');
  });

  test('handles nested ait42 prefix (ait42-01-ait42-coordinator-fast.md)', () => {
    expect(extractAgentNameFromCatalog('ait42-01-ait42-coordinator-fast.md')).toBe('coordinator-fast');
  });

  test('leaves bare filename intact when no prefix', () => {
    expect(extractAgentNameFromCatalog('researcher.md')).toBe('researcher');
    expect(extractAgentNameFromCatalog('sub-code-reviewer.md')).toBe('sub-code-reviewer');
  });
});

describe('compareCatalog (F2)', () => {
  test('identical lists report empty surplus + empty missing', () => {
    const result = compareCatalog(['a', 'b', 'c'], ['a', 'b', 'c']);
    expect(result.surplus).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  test('detects surplus only', () => {
    const result = compareCatalog(['a', 'b', 'extra'], ['a', 'b']);
    expect(result.surplus).toEqual(['extra']);
    expect(result.missing).toEqual([]);
  });

  test('detects missing only (catalog superset of manifest)', () => {
    const result = compareCatalog(['a'], ['a', 'b', 'c']);
    expect(result.surplus).toEqual([]);
    expect(result.missing).toEqual(['b', 'c']);
  });

  test('detects both surplus and missing', () => {
    const result = compareCatalog(['a', 'extra'], ['a', 'missing']);
    expect(result.surplus).toEqual(['extra']);
    expect(result.missing).toEqual(['missing']);
  });

  test('preserves order of input arrays', () => {
    const result = compareCatalog(['z', 'a'], ['x', 'y']);
    expect(result.surplus).toEqual(['z', 'a']);
    expect(result.missing).toEqual(['x', 'y']);
  });
});

describe('REQUIRED_NESTED_CHILDREN structure (F1)', () => {
  test('omega_metrics has all expected children', () => {
    expect(REQUIRED_NESTED_CHILDREN['omega_metrics']).toEqual(
      expect.arrayContaining(['performance_bounds', 'dependencies', 'completion_probability'])
    );
  });

  test('worst_case nested structure is registered', () => {
    expect(REQUIRED_NESTED_CHILDREN['omega_metrics.performance_bounds.worst_case']).toEqual(
      expect.arrayContaining(['quality_score', 'success_rate', 'latency_ms'])
    );
  });

  test('prediction_accuracy is registered', () => {
    expect(REQUIRED_NESTED_CHILDREN['omega_metrics.completion_probability.prediction_accuracy']).toEqual(
      expect.arrayContaining(['total_predictions', 'accurate_predictions', 'accuracy_rate'])
    );
  });
});
