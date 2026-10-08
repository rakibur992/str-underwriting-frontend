"use client"

import { Plus, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useController, useFieldArray } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { NumberField } from "../../components/number-field"
import { useWorkspace } from "../../components/workspace-provider"
import { fieldId } from "../../fields"

/** The two editable lists. Each row is a name and an amount; saving replaces the whole list. */
type ListName = "optimizationItems" | "operatingExpenses"
type RowTextPath =
  `optimizationItems.${number}.category` | `operatingExpenses.${number}.name`
type RowAmountPath =
  | `optimizationItems.${number}.amount`
  | `operatingExpenses.${number}.monthlyAmount`

function rowPaths(
  name: ListName,
  index: number,
): { text: RowTextPath; amount: RowAmountPath } {
  return name === "optimizationItems"
    ? {
        text: `optimizationItems.${index}.category`,
        amount: `optimizationItems.${index}.amount`,
      }
    : {
        text: `operatingExpenses.${index}.name`,
        amount: `operatingExpenses.${index}.monthlyAmount`,
      }
}

export interface LineItemsCopy {
  /** Singular noun for accessible labels ("Item 3 category"). */
  noun: string
  textLabel: string
  amountLabel: string
  addLabel: string
  empty: ReactNode
  suggestions: readonly string[]
}

export function LineItems({
  name,
  copy,
}: {
  name: ListName
  copy: LineItemsCopy
}) {
  const { form, partErrors } = useWorkspace()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  })
  const listId = `${name}-suggestions`
  const listError = partErrors[name]

  const add = () => {
    const blank =
      name === "optimizationItems"
        ? { category: "", amount: "" }
        : { name: "", monthlyAmount: "" }
    append(blank as never, { focusName: rowPaths(name, fields.length).text })
  }

  return (
    <div className="flex flex-col gap-3">
      <datalist id={listId}>
        {copy.suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={copy.noun + " list"}>
          <li
            aria-hidden
            className="hidden grid-cols-[minmax(0,1fr)_10rem_2rem] gap-2 text-xs font-medium text-muted-foreground sm:grid"
          >
            <span>{copy.textLabel}</span>
            <span>{copy.amountLabel}</span>
          </li>
          {fields.map((field, index) => {
            const label = `${copy.noun} ${index + 1}`
            const paths = rowPaths(name, index)
            return (
              <li
                key={field.id}
                className="grid grid-cols-[minmax(0,1fr)_2rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_2rem]"
              >
                <RowText
                  name={paths.text}
                  label={`${label} ${copy.textLabel.toLowerCase()}`}
                  listId={listId}
                />
                <NumberField
                  name={paths.amount}
                  label={`${label} ${copy.amountLabel.toLowerCase()}`}
                  hideLabel
                  kind="money"
                  className="col-start-1 sm:col-start-auto"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-start-2 row-start-1 text-muted-foreground hover:text-destructive sm:col-start-auto sm:row-start-auto"
                  aria-label={`Remove ${label.toLowerCase()}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {listError && <FieldError>{listError}</FieldError>}

      <div>
        <Button
          id={fieldId(name)}
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
        >
          <Plus aria-hidden data-icon="inline-start" />
          {copy.addLabel}
        </Button>
      </div>
    </div>
  )
}

function RowText({
  name,
  label,
  listId,
}: {
  name: RowTextPath
  label: string
  listId: string
}) {
  const { form } = useWorkspace()
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control: form.control, name })
  const id = fieldId(name)
  const error = fieldState.error?.message
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (error) void form.trigger(name)
        }}
        onBlur={onBlur}
        list={listId}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-message` : undefined}
      />
      {error && <FieldError id={`${id}-message`}>{error}</FieldError>}
    </div>
  )
}
