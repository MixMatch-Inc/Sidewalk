'use client';
import { useState, useEffect } from 'react';
import {
  fetchConfig, saveConfig, fetchAuditLog,
  SidewalkConfig, AuditEntry, CONFIG_DEFAULTS,
} from '@/lib/api/config';

export default function AdminConfigPage() {
  const [config, setConfig]   = useState<SidewalkConfig>(CONFIG_DEFAULTS);
  const [audit, setAudit]     = useState<AuditEntry[]>([]);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(c => setConfig(c))
      .catch(() => setConfig(CONFIG_DEFAULTS));   // safe defaults on missing config
    fetchAuditLog().then(setAudit);
  }, []);

  function mark<T>(updater: (prev: SidewalkConfig) => SidewalkConfig) {
    setConfig(updater);
    setDirty(true);
  }

  function toggleCategory(id: string, enabled: boolean) {
    mark(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, enabled } : c),
    }));
  }

  function setModeration<K extends keyof SidewalkConfig['moderation']>(
    key: K, value: SidewalkConfig['moderation'][K]
  ) {
    mark(prev => ({
      ...prev,
      moderation: { ...prev.moderation, [key]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveConfig(config);
      setDirty(false);
      showToast('success', 'Settings saved. Changes will propagate on next page refresh.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig(CONFIG_DEFAULTS);
    setDirty(true);
    showToast('success', 'Reset to defaults. Save to confirm.');
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const mod = config.moderation;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Taxonomy and moderation settings. Updated settings propagate to relevant UIs after refresh.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category enablement */}
        <div className="card space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Category enablement
          </p>
          {config.categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cat.enabled}
                onChange={e => toggleCategory(cat.id, e.target.checked)}
                className="accent-primary"
              />
              <span className="text-sm flex-1">{cat.label}</span>
              {!cat.enabled && (
                <span className="badge badge-secondary text-[11px]">disabled</span>
              )}
            </label>
          ))}
        </div>

        {/* Moderation thresholds */}
        <div className="card space-y-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Moderation thresholds
          </p>

          <SliderField
            label="Auto-flag score"
            desc="Reports above this confidence score are flagged for review."
            min={0} max={1} step={0.01}
            value={mod.autoFlagScore}
            format={v => v.toFixed(2)}
            onChange={v => setModeration('autoFlagScore', v)}
          />

          <SliderField
            label="Auto-reject score"
            desc="Reports above this score are rejected without human review."
            min={0} max={1} step={0.01}
            value={mod.autoRejectScore}
            format={v => v.toFixed(2)}
            onChange={v => setModeration('autoRejectScore', v)}
          />

          <SliderField
            label="SLA warning (hours)"
            desc="Reports older than this without resolution trigger a warning."
            min={12} max={168} step={1}
            value={mod.slaWarningHours}
            format={v => String(Math.round(v))}
            onChange={v => setModeration('slaWarningHours', Math.round(v))}
          />
        </div>
      </div>

      {/* Audit log */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Audit log
          </p>
          <span className="badge badge-secondary">Last {audit.length} changes</span>
        </div>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        ) : (
          <div className="divide-y">
            {audit.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p>{a.change}</p>
                  <p className="text-xs text-muted-foreground">{a.actor}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{a.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button className="btn" onClick={handleReset}>Reset to defaults</button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-md p-3 text-sm ${
          toast.type === 'success'
            ? 'bg-success/10 border border-success/30 text-success-foreground'
            : 'bg-destructive/10 border border-destructive/30 text-destructive'
        }`}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}

function SliderField({
  label, desc, min, max, step, value, format, onChange,
}: {
  label: string; desc: string;
  min: number; max: number; step: number; value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">{label}</label>
        <span className="text-xs font-medium tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}