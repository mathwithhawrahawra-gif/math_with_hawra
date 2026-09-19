import * as React from "react"
import { CheckCircle2, CircleAlert, Eye, ListChecks, Trash2 } from "lucide-react"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { cn } from "../lib/utils"

export type ResultsListId = string | number

export type StudentResultItem = {
  id: ResultsListId
  studentName: string
  score: number | null
  earnedPoints: number
  totalPoints: number
  status: "complete" | "pending"
}

export interface ResultsListProps {
  items: StudentResultItem[]
  selectedIds?: ReadonlySet<ResultsListId>
  onToggle?: (id: ResultsListId) => void
  onToggleAll?: (checked: boolean) => void
  onOpen?: (item: StudentResultItem) => void
  onDeleteSelected?: () => void
  deleteLabel?: string
  ariaLabel?: string
  className?: string
}

function scoreClass(score: number) {
  if (score >= 70) return "bg-green-100 text-green-700"
  if (score >= 50) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-700"
}

function ResultsStatus({ status }: { status: StudentResultItem["status"] }) {
  if (status === "pending") {
    return (
      <Badge className="border-transparent bg-orange-50 text-orange-600">
        <CircleAlert className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        مقالي
      </Badge>
    )
  }

  return (
    <Badge className="border-transparent bg-green-50 text-green-600">
      <CheckCircle2 className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
      مكتمل
    </Badge>
  )
}

export function ResultsList({
  items,
  selectedIds = new Set<ResultsListId>(),
  onToggle,
  onToggleAll,
  onOpen,
  onDeleteSelected,
  deleteLabel = "حذف المحدد",
  ariaLabel = "نتائج الطالبات",
  className,
}: ResultsListProps) {
  const selectedCount = items.filter((item) => selectedIds.has(item.id)).length
  const allSelected = items.length > 0 && selectedCount === items.length
  const someSelected = selectedCount > 0 && !allSelected

  return (
    <section
      dir="rtl"
      aria-label={ariaLabel}
      className={cn("border-t border-border", className)}
    >
      <div className="flex flex-col gap-3 border-b bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => onToggleAll?.(checked === true)}
            aria-label="تحديد كل النتائج"
          />
          <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>تحديد الكل</span>
          {selectedCount > 0 ? (
            <span className="font-normal text-muted-foreground">
              ({selectedCount} محددة)
            </span>
          ) : null}
        </div>

        {selectedCount > 0 && onDeleteSelected ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {deleteLabel}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 p-2 sm:gap-3 sm:p-3">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id)

          return (
            <article
              key={item.id}
              className={cn(
                "grid gap-3 rounded-2xl border bg-card/70 p-3 transition-colors sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] sm:items-center sm:gap-4 sm:p-4",
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:bg-muted/40",
              )}
              data-state={isSelected ? "selected" : "unselected"}
            >
              <div className="flex min-w-0 items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle?.(item.id)}
                  aria-label={`تحديد نتيجة ${item.studentName}`}
                  className="mt-1"
                />
                <div className="min-w-0">
                  {onOpen ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => onOpen(item)}
                      className="h-auto max-w-full justify-start whitespace-normal p-0 text-right text-base leading-snug text-primary"
                    >
                      <Eye className="ml-1.5 h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                      <span className="break-words">{item.studentName}</span>
                    </Button>
                  ) : (
                    <p className="break-words text-base font-bold text-foreground">
                      {item.studentName}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">الطالبة</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="rounded-xl bg-muted/60 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <p className="text-xs text-muted-foreground">الدرجة</p>
                  {item.score != null ? (
                    <Badge className={cn("mt-1", scoreClass(item.score))} dir="ltr">
                      {item.score}%
                    </Badge>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-orange-500">
                      بانتظار التصحيح
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-muted/60 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <p className="text-xs text-muted-foreground">النقاط</p>
                  <p className="mt-1 text-sm font-bold text-foreground" dir="ltr">
                    {item.earnedPoints}/{item.totalPoints}
                  </p>
                </div>

                <div className="rounded-xl bg-muted/60 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <div className="mt-1">
                    <ResultsStatus status={item.status} />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}