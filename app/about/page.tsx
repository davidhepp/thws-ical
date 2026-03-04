import { Calendar, Github, Filter, Link } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About – THWS iCal Filter",
  description: "Learn what the THWS iCal Filter does and how it works.",
};

/**
 * not really needed to have this seperate, but if something ever changes, it's easier to edit here
 */
const steps = [
  {
    icon: Link,
    title: "Paste your iCal URL",
    description:
      "Copy one or more iCal links from your university's timetable and paste it into the tool.",
  },
  {
    icon: Filter,
    title: "Select your courses",
    description:
      "Choose only the events you actually care about from the full list.",
  },
  {
    icon: Calendar,
    title: "Subscribe",
    description:
      "Copy the generated URL and subscribe to it in Apple Calendar, Google Calendar, or Outlook. Your calendar stays up to date automatically.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <main className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-12 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3 justify-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-600 to-orange-600">
            About
          </h1>
        </div>

        {/* What is this? */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            What is this?
          </h2>
          <p className="text-slate-500 leading-relaxed">
            The original THWS iCal feed contains <em>every</em> course for your
            entire semester — including ones you never attend. This tool lets
            you pick only the events that actually matter to you and subscribe
            to a clean, personalised calendar URL that stays up to date
            automatically.
          </p>
          <p className="text-slate-500 leading-relaxed text-sm">
            <i>
              Note: This tool also works with iCal links from other
              universities, as long as they use a similar format.
            </i>
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-slate-800">How it works</h2>
          <ol className="space-y-4">
            {steps.map(({ icon: Icon, title, description }, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Disclaimer */}
        <section className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Disclaimer
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            This project is an independent, open-source tool and is{" "}
            <strong className="text-slate-700">
              not affiliated with or endorsed by THWS
            </strong>
            . Timetable data is sourced directly from the official iCal feeds.
          </p>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-medium transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 text-center cursor-default"
          >
            Get started
          </a>
          <a
            href="https://github.com/davidhepp/thws-ical"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-default"
          >
            <Github className="w-4 h-4" />
            View Source
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          made with ❤️ by{" "}
          <a
            href="https://github.com/davidhepp"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-700 hover:text-orange-600 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-orange-600"
          >
            davidhepp
          </a>
        </div>
      </main>
    </div>
  );
}
