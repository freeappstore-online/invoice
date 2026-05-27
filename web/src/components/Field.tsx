import type { ChangeEvent, ReactNode } from "react";

interface BaseProps {
  label: string;
  children?: ReactNode;
}

export function Field({ label, children }: BaseProps) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "date";
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
  rows,
}: TextProps) {
  const handle = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange(e.target.value);
  return (
    <Field label={label}>
      {multiline ? (
        <textarea
          value={value}
          onChange={handle}
          placeholder={placeholder}
          rows={rows ?? 3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={handle}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}

interface NumberProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: NumberProps) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : v);
        }}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
    </Field>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: SelectProps<T>) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
