import { Link } from "react-router-dom";
import SeoHead from "./SeoHead";
import SuburbFacilityList from "./SuburbFacilityList";

type NursingHomesSuburbGuideProps = {
  suburb: string;
  slug: string;
  nearby: string[];
  intro: string;
};

const SITE_URL = "https://www.nursinghomesnearme.com.au";

export default function NursingHomesSuburbGuide({
  suburb,
  slug,
  nearby,
  intro,
}: NursingHomesSuburbGuideProps) {
  const pageUrl = `${SITE_URL}/${slug}`;
  const title = `${suburb} Nursing Homes (2026 Guide) | Availability, Costs and ACAT`;
  const description = `A practical guide for families looking at nursing homes in ${suburb}: availability, ACAT, means testing, and accommodation costs.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        url: pageUrl,
        description,
        inLanguage: "en-AU",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How do I compare nursing homes in ${suburb}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "Compare staffing communication, room type, location, and total costs including RAD, DAP, and means-tested care fees.",
            },
          },
          {
            "@type": "Question",
            name: "Can placement happen quickly?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Urgent cases can move quickly, but preferred suburbs and private rooms may have wait times.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL + "/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Gold Coast Nursing Homes",
            item: SITE_URL + "/nursing-homes-gold-coast",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${suburb} Nursing Homes`,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SeoHead
        title={title}
        description={description}
        canonicalUrl={pageUrl}
        ogType="article"
        imageUrl={`${SITE_URL}/social-preview.png`}
        robots="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
        schemaId={`seo-schema-${slug}`}
        schema={schema}
      />

      <h1 className="text-3xl font-bold">{suburb} Nursing Homes: What Families Need to Know</h1>
      <p className="mt-4 text-slate-700">{intro}</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">How to plan your next steps</h2>
        <ul className="mt-3 list-disc pl-5 text-slate-700">
          <li>Confirm ACAT approval status</li>
          <li>Prepare means testing paperwork early</li>
          <li>Compare room options and fee structures</li>
          <li>Inspect more than one facility where possible</li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Nearby suburbs families also consider</h2>
        <p className="mt-3 text-slate-700">{nearby.join(", ")}.</p>
      </div>

      {/* 2026 Fee Benchmarks */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Current 2026 aged care fee benchmarks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Australian Government rates effective 1 January 2026 — applies to all {suburb} facilities.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Basic Daily Fee", value: "$65.55 / day" },
            { label: "Means Tested Fee (annual cap)", value: "$35,238" },
            { label: "Means Tested Fee (lifetime cap)", value: "$84,572" },
            { label: "Max RAD (no approval needed)", value: "$758,627" },
            { label: "DAP Interest Rate (MPIR)", value: "7.65% p.a." },
            { label: "Asset Free Area", value: "$63,000" },
            { label: "Home Exemption Cap", value: "$210,555" },
            { label: "Income Free Area (single)", value: "$34,762 / yr" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-base font-bold text-teal-700">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-slate-400">
            Source: Australian Government Department of Health, Disability and Ageing — Schedule of Fees and Charges, 1 January 2026.
            The MPIR of 7.65% applies 1 January – 31 March 2026 and is subject to quarterly review.
          </p>
          <a
            href="/Schedule of Fees - Jan 26.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            ↓ Download full fee schedule (PDF)
          </a>
        </div>
      </div>

      <SuburbFacilityList suburb={suburb} />

      <div className="mt-10 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-semibold">Need help with placement?</h2>
        <p className="mt-2 text-slate-700">
          Use our placement form to get support with comparing currently available options.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            Start placement form
          </Link>
          <Link
            to="/nursing-homes-gold-coast"
            className="inline-block rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-white"
          >
            Back to Gold Coast guide
          </Link>
        </div>
      </div>
    </div>
  );
}
