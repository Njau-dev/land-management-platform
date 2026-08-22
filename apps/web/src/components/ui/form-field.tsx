import type { InputHTMLAttributes } from "react";

export function FormField({
  id,
  label,
  hint,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className="mt-2 h-11 w-full rounded-md border border-stone-300 bg-white px-3.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-stone-100"
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="mt-2 text-xs leading-5 text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
