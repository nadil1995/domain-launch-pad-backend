import type { TracingOptions as TracingOpts, PresetName } from '../types';
import { PRESET_NAMES } from '../lib/tracer';
import { Settings } from 'lucide-react';

interface Props {
  preset: PresetName;
  options: TracingOpts;
  onPresetChange: (preset: PresetName) => void;
  onOptionChange: <K extends keyof TracingOpts>(key: K, value: TracingOpts[K]) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}: <span className="font-mono text-indigo-600">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full"
      />
    </label>
  );
}

export function TracingOptions({ preset, options, onPresetChange, onOptionChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Tracing Options</h2>
      </div>

      <label className="mb-4 block">
        <span className="text-sm font-medium text-gray-700">Preset</span>
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as PresetName)}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {PRESET_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3">
        <Slider
          label="Number of colors"
          value={options.numberofcolors}
          min={2}
          max={64}
          step={1}
          onChange={(v) => onOptionChange('numberofcolors', v)}
        />
        <Slider
          label="Line threshold"
          value={options.ltres}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => onOptionChange('ltres', v)}
        />
        <Slider
          label="Quad threshold"
          value={options.qtres}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => onOptionChange('qtres', v)}
        />
        <Slider
          label="Path omit (px)"
          value={options.pathomit}
          min={0}
          max={100}
          step={1}
          onChange={(v) => onOptionChange('pathomit', v)}
        />
        <Slider
          label="Blur radius"
          value={options.blurradius}
          min={0}
          max={10}
          step={1}
          onChange={(v) => onOptionChange('blurradius', v)}
        />
        <Slider
          label="Stroke width"
          value={options.strokewidth}
          min={0}
          max={5}
          step={0.5}
          onChange={(v) => onOptionChange('strokewidth', v)}
        />
        <Slider
          label="Scale"
          value={options.scale}
          min={0.5}
          max={5}
          step={0.5}
          onChange={(v) => onOptionChange('scale', v)}
        />
      </div>
    </div>
  );
}
