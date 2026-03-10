import { Link } from "react-router-dom";
import SeoHead from "./SeoHead";

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
