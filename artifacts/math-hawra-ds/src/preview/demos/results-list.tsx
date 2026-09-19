import { useState } from "react"

import {
  ResultsList,
  type ResultsListId,
  type StudentResultItem,
} from "../../components/results-list"

const SAMPLE_RESULTS: StudentResultItem[] = [
  {
    id: 1,
    studentName: "سارة أحمد",
    score: 92,
    earnedPoints: 23,
    totalPoints: 25,
    status: "complete",
  },
  {
    id: 2,
    studentName: "نور الهدى محمد",
    score: null,
    earnedPoints: 16,
    totalPoints: 25,
    status: "pending",
  },
  {
    id: 3,
    studentName: "جنى خالد",
    score: 48,
    earnedPoints: 12,
    totalPoints: 25,
    status: "complete",
  },
]

export function ResultsListDemo() {
  const [selectedIds, setSelectedIds] = useState<Set<ResultsListId>>(new Set())
  const [openedStudent, setOpenedStudent] = useState<string | null>(null)

  const toggle = (id: ResultsListId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card/80 p-3 shadow-lg sm:p-5">
      <div>
        <h2 className="font-bold">نتائج الطالبات</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          بطاقات متجاوبة تحافظ على وضوح الاسم والدرجة دون تمرير أفقي.
        </p>
      </div>
      <ResultsList
        items={SAMPLE_RESULTS}
        selectedIds={selectedIds}
        onToggle={toggle}
        onToggleAll={(checked) =>
          setSelectedIds(checked ? new Set(SAMPLE_RESULTS.map((item) => item.id)) : new Set())
        }
        onOpen={(item) => setOpenedStudent(item.studentName)}
        onDeleteSelected={() => setSelectedIds(new Set())}
      />
      {openedStudent ? (
        <p className="rounded-xl bg-primary/10 p-3 text-sm font-bold text-primary">
          تم فتح حل {openedStudent}
        </p>
      ) : null}
    </div>
  )
}