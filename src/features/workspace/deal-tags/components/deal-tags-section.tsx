"use client"

import { Controller } from "react-hook-form"

import { Switch } from "@/components/ui/switch"

import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { fieldId } from "../../fields"
import { DEAL_TAGS } from "../tags"

/** Yes/no labels that describe the deal at a glance. They don't affect the score. */
export function DealTagsSection() {
  const { form, values } = useWorkspace()
  const on = DEAL_TAGS.filter((t) => values.tags[t.key]).length

  return (
    <PartCard
      part="tags"
      description={`Label the deal at a glance. Tags don't affect your score. ${on} of ${DEAL_TAGS.length} on.`}
    >
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {DEAL_TAGS.map(({ key, label }) => {
          const id = fieldId(`tags.${key}`)
          return (
            <li key={key}>
              <Controller
                control={form.control}
                name={`tags.${key}`}
                render={({ field }) => (
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                  >
                    {label}
                    <Switch
                      id={id}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </label>
                )}
              />
            </li>
          )
        })}
      </ul>
    </PartCard>
  )
}
