"use client"

import { TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { useController, type FieldPath } from "react-hook-form"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatMoneyInput } from "@/lib/format"
import { cn } from "@/lib/utils"

import { fieldId, type FieldKind } from "../fields"
import type { WorkspaceValues } from "../schema"
import { useWorkspace } from "./workspace-provider"

const ADORNMENT: Record<FieldKind, { prefix?: string; suffix?: string }> = {
  money: { prefix: "$" },
  percent: { suffix: "%" },
  years: { suffix: "years" },
}

/**
 * A number input bound to the workspace form. Shows the unit, keeps what was
 * typed (even if it isn't a number yet), groups money on blur ("650,000"),
 * and puts the error or warning right under the field.
 */
export function NumberField({
  name,
  label,
  kind,
  hint,
  optional = false,
  hideLabel = false,
  warning,
  className,
}: {
  name: FieldPath<WorkspaceValues>
  label: ReactNode
  kind: FieldKind
  hint?: ReactNode
  optional?: boolean
  hideLabel?: boolean
  /** Non-blocking advice, shown when there's no error. */
  warning?: string | null
  className?: string
}) {
  const { form } = useWorkspace()
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control: form.control, name })
  const id = fieldId(name)
  const hintId = `${id}-hint`
  const messageId = `${id}-message`
  const error = fieldState.error?.message
  const { prefix, suffix } = ADORNMENT[kind]
  const describedBy =
    [hint ? hintId : null, error || warning ? messageId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <Field data-invalid={!!error} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </FieldLabel>
      <div className="relative">
        {prefix && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground"
          >
            {prefix}
          </span>
        )}
        <Input
          id={id}
          name={name}
          ref={ref}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.target.value)
            // A revealed error clears as soon as the value is fixed, not on blur
            // (a message vanishing on blur shifts the page under the pointer).
            if (error) void form.trigger(name)
          }}
          onBlur={() => {
            if (kind === "money" && typeof value === "string")
              onChange(formatMoneyInput(value))
            onBlur()
          }}
          inputMode={kind === "years" ? "numeric" : "decimal"}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "tabular-nums",
            prefix && "pl-6",
            suffix === "%" && "pr-7",
            suffix === "years" && "pr-14",
          )}
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground"
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <FieldDescription id={hintId} className="text-xs">
          {hint}
        </FieldDescription>
      )}
      {error ? (
        <FieldError id={messageId}>{error}</FieldError>
      ) : warning ? (
        <p
          id={messageId}
          className="flex items-start gap-1.5 text-sm text-score-medium"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {warning}
        </p>
      ) : null}
    </Field>
  )
}
