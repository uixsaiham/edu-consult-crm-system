"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CourseForm } from "@/components/courses/course-form";
import { getCourse } from "@/lib/mock/courses";

export default function AddCoursePage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading…</p>}>
      <AddCourse />
    </Suspense>
  );
}

function AddCourse() {
  const copy = useSearchParams().get("copy");
  const source = copy ? getCourse(copy) : undefined;
  return <CourseForm key={copy ?? "new"} copyOf={source} />;
}
