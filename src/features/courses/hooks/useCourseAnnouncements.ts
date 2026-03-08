import { useEffect, useState } from "react";
import type { Section } from "../../../shared/types/lms";

export type CourseAnnouncement = {
  id: string;
  text: string;
  sectionId?: number | null;
  sectionName?: string | null;
  createdAt: string;
};

export function useCourseAnnouncements({
  api,
  headers,
  setMessage,
  selectedCourseId,
  selectedCourseTitle,
  sections,
  enabled = true,
}: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  selectedCourseId: number;
  selectedCourseTitle: string;
  sections: Section[];
  enabled?: boolean;
}) {
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false);

  useEffect(() => {
    if (!enabled || !selectedCourseId) {
      setAnnouncements([]);
      return;
    }
    let active = true;
    const loadAnnouncements = async () => {
      try {
        const rows = await api(`/courses/${selectedCourseId}/announcements`, { headers });
        if (!active) return;
        setAnnouncements(
          (rows || []).map((row: any) => ({
            id: String(row.id),
            text: String(row.message || ""),
            sectionId: row.sectionId ?? null,
            sectionName: row.sectionName ?? null,
            createdAt: String(row.createdAt || new Date().toISOString()),
          })),
        );
      } catch {
        if (!active) return;
      }
    };
    loadAnnouncements();
    return () => {
      active = false;
    };
  }, [enabled, selectedCourseId]);

  async function createAnnouncement() {
    if (!enabled || !selectedCourseId) return;
    const text = prompt("Enter announcement for students:");
    if (!text || !text.trim()) return;
    let targetSectionId: number | undefined;
    if (sections.length > 1) {
      const options = sections
        .map((section, idx) => `${idx + 1}. ${section.name}`)
        .join("\n");
      const choice = prompt(
        `Select target block:\n0. All blocks\n${options}\n\nEnter number:`,
        "0",
      );
      if (choice === null) return;
      const index = Number(choice);
      if (!Number.isFinite(index) || index < 0 || index > sections.length) {
        setMessage("Invalid block selection.");
        return;
      }
      if (index > 0) targetSectionId = sections[index - 1].id;
    }
    try {
      const created = await api(`/courses/${selectedCourseId}/announcements`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text.trim(),
          sectionId: targetSectionId,
        }),
      });
      setAnnouncements((prev) => [
        {
          id: String(created?.id ?? Date.now()),
          text: String(created?.message ?? text.trim()),
          sectionId: created?.sectionId ?? targetSectionId ?? null,
          sectionName:
            created?.sectionName ??
            (targetSectionId
              ? sections.find((s) => s.id === targetSectionId)?.name || null
              : null),
          createdAt: String(created?.createdAt ?? new Date().toISOString()),
        },
        ...prev,
      ]);
      setMessage(`Announcement posted in ${selectedCourseTitle}.`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return {
    announcements,
    showAnnouncementHistory,
    setShowAnnouncementHistory,
    createAnnouncement,
  };
}
