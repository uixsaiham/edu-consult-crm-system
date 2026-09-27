"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { CourseForm } from "@/components/courses/course-form";
import { buttonSecondary } from "@/components/ui/button-styles";
import { getCourse } from "@/lib/mock/courses";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const course = getCourse(id);

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <SearchX className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Course not found</h2>
        <p className="text-sm text-muted-foreground">It may have been deleted, or the link is incorrect.</p>
        <Link href="/courses" className={buttonSecondary}>
          Back to courses
        </Link>
      </div>
    );
  }

  return <CourseForm key={course.id} course={course} />;
}
