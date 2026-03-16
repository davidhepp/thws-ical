import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – THWS iCal Filter",
  description:
    "Privacy policy for THWS iCal Filter and its use of Vercel Analytics.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <main className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-12 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-5">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to About
          </Link>

          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-600 to-orange-600 text-center">
              Privacy Policy
            </h1>
          </div>
        </div>

        {/* Analytics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Analytics & Tracking
          </h2>
          <div className="text-slate-500 leading-relaxed space-y-4">
            <p>
              This website uses <strong>Vercel Analytics</strong> to collect
              privacy-focused, aggregated usage statistics about page visits and
              interactions. This helps us understand how the service is used and
              improve its functionality.
            </p>

            <p>
              According to Vercel, Web Analytics does not use third-party
              cookies. Vercel also states that visitors are identified using a
              hash created from the incoming request and that the visitor
              session lifespan is automatically discarded after 24 hours.
            </p>

            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-700">
                  No third-party cookies:
                </strong>{" "}
                The analytics used on this website does not rely on third-party
                cookies.
              </li>
              <li>
                <strong className="text-slate-700">
                  No personal profiling:
                </strong>{" "}
                We do not use analytics data to identify individual visitors,
                create personal profiles, or serve advertising.
              </li>
              <li>
                <strong className="text-slate-700">Limited purpose:</strong>{" "}
                Analytics data is used only to understand website usage and
                improve the service.
              </li>
            </ul>

            <p>
              More information is available in the{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-300 hover:decoration-orange-600 transition-colors"
              >
                Vercel Privacy Policy
              </a>
              .
            </p>
          </div>
        </section>

        {/* Legal Basis */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Purpose and Legal Basis
          </h2>
          <div className="text-slate-500 leading-relaxed space-y-4">
            <p>
              The processing is carried out to measure the use of this website
              and improve its content, functionality, and reliability.
            </p>
            <p>
              The legal basis for this processing is Article 6(1)(f) GDPR
              (legitimate interests), namely the privacy-conscious analysis and
              improvement of this website.
            </p>
          </div>
        </section>

        {/* Rights */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Your Rights</h2>
          <div className="text-slate-500 leading-relaxed space-y-4">
            <p>
              Under the GDPR, you have the right to request access to your
              personal data, as well as the right to rectification, erasure,
              restriction of processing, and objection, where the legal
              requirements are met.
            </p>
            <p>
              Please note that the analytics used on this website is designed to
              provide aggregated usage information and is not used by us to
              identify individual visitors. Therefore, in some cases, we may not
              be able to assign analytics data to a specific person.
            </p>
            <p>
              You also have the right to lodge a complaint with a data
              protection supervisory authority.
            </p>
          </div>
        </section>

        {/* Controller */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Controller</h2>
          <div className="text-slate-500 leading-relaxed space-y-4">
            <p>
              The controller responsible for data processing on this website
              within the meaning of the General Data Protection Regulation
              (GDPR) is:
            </p>
            <p className="text-slate-600">
              David Heppenheimer
              <br />
              <a
                href="mailto:david@heppify.de"
                className=" hover:text-slate-700 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-slate-400"
              >
                david@heppify.de
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
