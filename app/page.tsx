"use client";

import { useState } from "react";
import {
  Copy,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Check,
  Search,
} from "lucide-react";

/**
 * note:
 * single page app because I cba to use modules for this
 */
export default function Home() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [courses, setCourses] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [courseGroups, setCourseGroups] = useState<Record<string, string[]>>({});
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string[]>>({});
  const [feedUrl, setFeedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/parse-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urls.filter((u) => u.trim() !== "") }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch courses");
      }

      setCourses(data.courses || []);
      setGroups(data.groups || []);
      setCourseGroups(data.courseGroups || {});
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course],
    );
  };

  const toggleGroup = (course: string, group: string) => {
    setSelectedGroups((prev) => {
      const current = prev[course] || [];
      const updated = current.includes(group)
        ? current.filter((g) => g !== group)
        : [...current, group];
      return { ...prev, [course]: updated };
    });
  };

  const generateFeed = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/create-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urls.filter((u) => u.trim() !== ""),
          selectedCourses,
          selectedGroups,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create feed");
      }

      const newFeedUrl = `${window.location.origin}/api/feed/${data.id}`;
      setFeedUrl(newFeedUrl);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create feed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(feedUrl)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => console.error("Clipboard API failed", err));
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = feedUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Fallback copy failed", error);
      } finally {
        textArea.remove();
      }
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <main className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-12 relative z-10">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-600 to-orange-600">
            THWS iCal Filter
          </h1>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {/* STEP 1: Input URL */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-slate-800">
                Connect your schedule
              </h2>
              <p className="text-slate-500">
                Paste one or more iCal links to get started.
              </p>
            </div>

            <form onSubmit={fetchCourses} className="space-y-4">
              {urls.map((url, idx) => (
                <div key={idx} className="relative">
                  <input
                    type="url"
                    placeholder="https://fiw.thws.de/.../BaInf6_2026ss.ics"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...urls];
                      newUrls[idx] = e.target.value;
                      setUrls(newUrls);
                    }}
                    required={idx === 0}
                    className="w-full pl-5 pr-12 py-4 rounded-2xl border border-slate-200 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all bg-white text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = [...urls];
                        newUrls.splice(idx, 1);
                        setUrls(newUrls);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setUrls([...urls, ""])}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-xl font-medium transition-all text-orange-600/80 hover:bg-orange-50 hover:text-orange-600"
              >
                <Plus className="w-4 h-4" /> Add another
              </button>

              <button
                type="submit"
                disabled={loading || !urls[0]}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
        {/* STEP 2: Select Courses */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-slate-800">
                Select your courses
              </h2>
              <p className="text-slate-500">
                Choose the events you actually want to see in your calendar.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-2 max-h-[400px] overflow-y-auto space-y-2">
              {courses
                .filter((course) =>
                  course.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((course) => {
                  const isSelected = selectedCourses.includes(course);
                  return (
                    <button
                      key={course}
                      onClick={() => toggleCourse(course)}
                      className={`w-full flex items-center gap-4 text-left p-4 rounded-xl transition-all ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-sm border ring-1 ring-blue-500"
                          : "bg-white border-transparent hover:border-slate-200 border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all pointer-events-none"
                      />
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "text-slate-900 font-medium"
                            : "text-slate-600"
                        }`}
                      >
                        {course}
                      </span>
                    </button>
                  );
                })}
            </div>

            {selectedCourses.length > 0 && selectedCourses.some(course => (courseGroups[course] || []).length > 0) && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Select groups for your courses
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Choose which groups you want to see for each selected course
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedCourses
                    .filter(course => (courseGroups[course] || []).length > 0)
                    .map((course) => {
                    const availableGroups = courseGroups[course] || [];
                    const selectedGroupsForCourse = selectedGroups[course] || [];

                    return (
                      <div
                        key={course}
                        className="bg-slate-50 rounded-xl border border-slate-100 p-4"
                      >
                        <h4 className="font-medium text-slate-800 mb-3">
                          {course}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {availableGroups.map((group) => {
                            const isSelected = selectedGroupsForCourse.includes(group);
                            return (
                              <button
                                key={group}
                                onClick={() => toggleGroup(course, group)}
                                className={`text-sm px-3 py-1 rounded-full border transition-all ${
                                  isSelected
                                    ? "bg-orange-600 text-white border-orange-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                  {group.startsWith('Gruppe') ? group : `Gruppe ${group}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
              >
                Back
              </button>
              <button
                onClick={generateFeed}
                disabled={loading || selectedCourses.length === 0}
                className="flex-2 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/30"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Generate Feed <Plus className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="space-y-8 animate-in zoom-in duration-500 py-4">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">
                You&apos;re all set!
              </h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                Subscribe to this URL in Apple Calendar, Google Calendar, or
                Outlook.
              </p>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-2 relative group overflow-hidden">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="w-full bg-transparent border-none text-slate-600 text-sm pl-4 pr-16 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 bottom-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-500 rounded-xl px-4 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {isCopied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setUrls([""]);
                setCourses([]);
                setSelectedCourses([]);
                setSelectedGroups({});
                setFeedUrl("");
                setSearchQuery("");
              }}
              className="w-full py-4 rounded-2xl font-medium text-slate-600 hover:bg-slate-100 transition-all hover:text-slate-900 border border-transparent"
            >
              Filter another schedule
            </button>
          </div>
        )}
        <div className="mt-8 text-center text-sm text-slate-500">
          <a
            href="/about"
            className="font-medium text-slate-700 hover:text-orange-600 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-orange-600"
          >
            learn more
          </a>
        </div>
      </main>
    </div>
  );
}
