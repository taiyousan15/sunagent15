import { additiveMerge, freshMerge, smartMerge, SettingsLike } from './settings-merge';

describe('additiveMerge', () => {
  test('preserves existing user value (template ignored)', () => {
    const existing: SettingsLike = {
      mcpServers: { foo: { command: 'user-value', disabled: true } },
    };
    const template: SettingsLike = {
      mcpServers: { foo: { command: 'template-value', disabled: false } },
    };
    const result = additiveMerge(existing, template);
    expect(result.merged.mcpServers!.foo).toEqual({
      command: 'user-value',
      disabled: true,
    });
    expect(result.preserved).toEqual(['foo']);
    expect(result.added).toEqual([]);
  });

  test('adds new MCP from template with disabled:true (safe default)', () => {
    const existing: SettingsLike = { mcpServers: {} };
    const template: SettingsLike = {
      mcpServers: { bar: { command: 'z', disabled: false } },
    };
    const result = additiveMerge(existing, template);
    expect(result.merged.mcpServers!.bar.disabled).toBe(true);
    expect(result.merged.mcpServers!.bar.command).toBe('z');
    expect(result.added).toEqual(['bar']);
    expect(result.preserved).toEqual([]);
  });

  test('does not mutate input existing or template', () => {
    const existing: SettingsLike = {
      mcpServers: { a: { disabled: true, command: 'orig' } },
    };
    const template: SettingsLike = {
      mcpServers: { b: { command: 'new', disabled: false } },
    };
    const existingSnapshot = JSON.parse(JSON.stringify(existing));
    const templateSnapshot = JSON.parse(JSON.stringify(template));
    additiveMerge(existing, template);
    expect(existing).toEqual(existingSnapshot);
    expect(template).toEqual(templateSnapshot);
  });

  test('handles null/undefined inputs gracefully', () => {
    expect(additiveMerge(null, null).merged).toEqual({ mcpServers: {} });
    expect(additiveMerge(undefined, undefined).merged).toEqual({ mcpServers: {} });
    expect(additiveMerge({ mcpServers: {} }, null).merged).toEqual({
      mcpServers: {},
    });
    expect(additiveMerge(null, { mcpServers: { a: {} } }).added).toEqual(['a']);
  });

  test('ignores _comment keys in template', () => {
    const existing: SettingsLike = { mcpServers: {} };
    const template: SettingsLike = {
      mcpServers: {
        _comment: 'this is a comment' as unknown as never,
        _comment2: {} as never,
        real: { command: 'x' },
      },
    };
    const result = additiveMerge(existing, template);
    expect(result.merged.mcpServers!._comment).toBeUndefined();
    expect(result.merged.mcpServers!._comment2).toBeUndefined();
    expect(result.merged.mcpServers!.real).toBeDefined();
    expect(result.added).toEqual(['real']);
  });

  test('preserves non-mcpServers keys from existing (e.g. hooks)', () => {
    const existing: SettingsLike = {
      mcpServers: {},
      hooks: { SessionStart: [] },
    } as SettingsLike;
    const template: SettingsLike = { mcpServers: { a: {} } };
    const result = additiveMerge(existing, template);
    expect((result.merged as SettingsLike).hooks).toEqual({ SessionStart: [] });
  });

  test('reports correct counts for mixed scenario', () => {
    const existing: SettingsLike = {
      mcpServers: {
        kept1: { disabled: true },
        kept2: { disabled: false, command: 'user' },
      },
    };
    const template: SettingsLike = {
      mcpServers: {
        kept1: { disabled: false },
        kept2: { command: 'template' },
        new1: { command: 'a' },
        new2: { command: 'b' },
      },
    };
    const result = additiveMerge(existing, template);
    expect(result.added.sort()).toEqual(['new1', 'new2']);
    expect(result.preserved.sort()).toEqual(['kept1', 'kept2']);
    expect(result.merged.mcpServers!.kept1.disabled).toBe(true);
    expect(result.merged.mcpServers!.kept2.command).toBe('user');
    expect(result.merged.mcpServers!.new1.disabled).toBe(true);
  });
});

describe('freshMerge', () => {
  test('overwrites existing values (destructive reset)', () => {
    const existing: SettingsLike = {
      mcpServers: { foo: { command: 'user', disabled: true } },
    };
    const template: SettingsLike = {
      mcpServers: { foo: { command: 'template', disabled: false } },
    };
    const result = freshMerge(existing, template);
    expect(result.merged.mcpServers!.foo).toEqual({
      command: 'template',
      disabled: false,
    });
  });

  test('adds new MCPs without disabled:true modifier (template-as-is)', () => {
    const existing: SettingsLike = { mcpServers: {} };
    const template: SettingsLike = {
      mcpServers: { bar: { command: 'z', disabled: false } },
    };
    const result = freshMerge(existing, template);
    expect(result.merged.mcpServers!.bar.disabled).toBe(false);
  });

  test('preserves non-mcpServers keys', () => {
    const existing: SettingsLike = {
      mcpServers: {},
      hooks: { SessionStart: [{ matcher: '' }] },
    } as SettingsLike;
    const template: SettingsLike = { mcpServers: { a: {} } };
    const result = freshMerge(existing, template);
    expect((result.merged as SettingsLike).hooks).toBeDefined();
  });
});

describe('smartMerge', () => {
  test('fresh install (no existing mcpServers): uses freshMerge — template values respected', () => {
    const existing: SettingsLike = {};
    const template: SettingsLike = {
      mcpServers: {
        enabled_one: { command: 'a', disabled: false },
        disabled_one: { command: 'b', disabled: true },
      },
    };
    const result = smartMerge(existing, template);
    expect(result.mode).toBe('fresh');
    expect(result.merged.mcpServers!.enabled_one.disabled).toBe(false);
    expect(result.merged.mcpServers!.disabled_one.disabled).toBe(true);
    expect(result.added.sort()).toEqual(['disabled_one', 'enabled_one']);
  });

  test('fresh install (empty mcpServers object): same as no mcpServers', () => {
    const existing: SettingsLike = { mcpServers: {} };
    const template: SettingsLike = {
      mcpServers: { foo: { command: 'x', disabled: false } },
    };
    const result = smartMerge(existing, template);
    expect(result.mode).toBe('fresh');
    expect(result.merged.mcpServers!.foo.disabled).toBe(false);
  });

  test('existing install (has mcpServers): uses additiveMerge — preserves user, new are disabled:true', () => {
    const existing: SettingsLike = {
      mcpServers: { user_kept: { command: 'user', disabled: true } },
    };
    const template: SettingsLike = {
      mcpServers: {
        user_kept: { command: 'template', disabled: false },
        new_one: { command: 'new', disabled: false },
      },
    };
    const result = smartMerge(existing, template);
    expect(result.mode).toBe('additive');
    expect(result.merged.mcpServers!.user_kept.command).toBe('user');
    expect(result.merged.mcpServers!.user_kept.disabled).toBe(true);
    expect(result.merged.mcpServers!.new_one.disabled).toBe(true);
    expect(result.preserved).toEqual(['user_kept']);
    expect(result.added).toEqual(['new_one']);
  });

  test('forceFresh:true overrides auto-detection (existing settings get reset)', () => {
    const existing: SettingsLike = {
      mcpServers: { user_kept: { disabled: true, command: 'user' } },
    };
    const template: SettingsLike = {
      mcpServers: { user_kept: { disabled: false, command: 'template' } },
    };
    const result = smartMerge(existing, template, { forceFresh: true });
    expect(result.mode).toBe('fresh');
    expect(result.merged.mcpServers!.user_kept.command).toBe('template');
    expect(result.merged.mcpServers!.user_kept.disabled).toBe(false);
  });

  test('null/undefined existing → fresh mode', () => {
    const template: SettingsLike = {
      mcpServers: { x: { disabled: false } },
    };
    expect(smartMerge(null, template).mode).toBe('fresh');
    expect(smartMerge(undefined, template).mode).toBe('fresh');
  });
});
