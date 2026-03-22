import { Link } from "react-router-dom";
import SeoHead from "./SeoHead";

export default function NursingHomesGoldCoast() {
  const siteUrl = "https://www.nursinghomesnearme.com.au";
  const pagePath = "/nursing-homes-gold-coast";
  const pageUrl = `${siteUrl}${pagePath}`;
  const title = "Gold Coast Nursing Homes (2026 Guide) | ACAT, Costs and Availability";
  const description =
    "Gold Coast nursing homes explained in plain language: ACAT approval, means testing, RAD vs DAP costs, and how families can compare facilities.";

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
            name: "How many nursing homes are on the Gold Coast?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The broader Gold Coast region is commonly listed with around 65 residential aged care facilities. Exact totals vary by directory and boundary definitions.",
            },
          },
          {
            "@type": "Question",
            name: "Do you need ACAT before entering a nursing home?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most people need ACAT approval before entering permanent residential aged care. The assessment determines eligibility and care needs.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between RAD and DAP?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "RAD is a refundable lump sum, while DAP is a non-refundable daily accommodation payment. Families can also use a combination of both.",
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
            item: siteUrl + "/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Gold Coast Nursing Homes",
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
        imageUrl={`${siteUrl}/social-preview.png`}
        robots="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
        schemaId="seo-schema-gold-coast"
        schema={schema}
      />
      <h1 className="text-3xl font-bold">
        What's Really Happening With Nursing Homes on the Gold Coast?
      </h1>

      <p className="mt-4 text-lg text-slate-700">
        If you are starting to look at aged care on the Gold Coast, you are not
        alone. Many families begin this search suddenly - often after a hospital
        stay, a fall at home, or when daily tasks start becoming unsafe.
      </p>

      <p className="mt-4 text-slate-700">
        The system can feel complicated at first. But once you understand how it
        works, it becomes much more manageable. This page explains what families
        need to know - clearly and in plain language.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Availability on the Gold Coast</h2>
        <p className="mt-3 text-slate-700">
          Residential aged care often operates with limited availability, which
          means the right room in the right suburb may not always be available
          immediately. On the Gold Coast, suitable vacancies can appear and fill
          quickly - especially in preferred locations and private rooms.
        </p>
        <p className="mt-3 text-slate-700">
          The best outcomes usually happen when families are prepared and know
          the steps before a decision becomes urgent.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">
          How many nursing homes are on the Gold Coast?
        </h2>
        <p className="mt-3 text-slate-700">
          Across the broader Gold Coast region (including areas like Southport,
          Robina, Burleigh, Labrador, Helensvale, Coomera and surrounding
          suburbs), directories and listings commonly show around{" "}
          <strong>~65 residential aged care facilities</strong>. Exact totals can
          vary depending on how "Gold Coast" boundaries are defined.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Step 1: ACAT assessment (eligibility)
        </h2>
        <p className="mt-3 text-slate-700">
          Before someone can enter permanent residential aged care, they
          generally require approval through ACAT (Aged Care Assessment Team).
          ACAT determines whether a person is eligible for residential aged care
          and what level of care is required.
        </p>
        <p className="mt-3 text-slate-700">
          If someone is in hospital, the hospital social worker often helps
          coordinate this. If they are at home, the assessment must be requested
          and scheduled.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Step 2: Means testing (what you will pay)
        </h2>
        <p className="mt-3 text-slate-700">
          Separate from ACAT is the means assessment. This looks at income and
          assets to determine what fees apply - including whether a
          means-tested care fee applies and whether accommodation contributions
          apply.
        </p>
        <p className="mt-3 text-slate-700">
          Many families feel overwhelmed here, so the key is to slow down,
          understand the paperwork clearly, and avoid signing agreements until
          costs are properly understood.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Step 3: Accommodation costs (RAD vs DAP)
        </h2>
        <p className="mt-3 text-slate-700">
          Accommodation is usually paid as either:
        </p>
        <ul className="mt-3 list-disc pl-5 text-slate-700">
          <li>
            <strong>RAD</strong> (Refundable Accommodation Deposit): a lump sum
            that is generally refundable when the resident leaves care
          </li>
          <li>
            <strong>DAP</strong> (Daily Accommodation Payment): a daily payment
            that is not refundable
          </li>
          <li>Or a combination of both</li>
        </ul>
        <p className="mt-3 text-slate-700">
          Prices can vary widely by suburb, room type, and demand.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">How to compare facilities</h2>
        <p className="mt-3 text-slate-700">
          When comparing homes, look beyond appearance. Focus on care, staffing,
          and how the facility communicates with families day-to-day.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Gold Coast suburbs we cover</h2>
        <p className="mt-3 text-slate-700">
          Southport, Labrador, Biggera Waters, Helensvale, Coomera, Hope Island,
          Ashmore, Nerang, Robina, Varsity Lakes, Broadbeach, Mermaid Waters,
          Burleigh, Palm Beach, Currumbin, Tugun and surrounding suburbs.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "Southport", to: "/nursing-homes-southport" },
            { label: "Robina", to: "/nursing-homes-robina" },
            { label: "Burleigh", to: "/nursing-homes-burleigh" },
            { label: "Nerang", to: "/nursing-homes-nerang" },
            { label: "Labrador", to: "/nursing-homes-labrador" },
            { label: "Ashmore", to: "/nursing-homes-ashmore" },
            { label: "Helensvale", to: "/nursing-homes-helensvale" },
            { label: "Coomera", to: "/nursing-homes-coomera" },
            { label: "Palm Beach", to: "/nursing-homes-palm-beach" },
            { label: "Broadbeach", to: "/nursing-homes-broadbeach" },
          ].map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="inline-block rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-white"
            >
              {s.label} guide
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>

        <h3 className="mt-4 text-lg font-semibold">How quickly can placement happen?</h3>
        <p className="mt-2 text-slate-700">
          Timelines vary. Urgent hospital discharges can move quickly, while preferred
          suburbs and private rooms can take longer.
        </p>

        <h3 className="mt-4 text-lg font-semibold">Can families visit before accepting a room?</h3>
        <p className="mt-2 text-slate-700">
          Usually yes, and it is strongly recommended. Visiting helps families compare
          care culture, staffing communication, and room suitability.
        </p>

        <h3 className="mt-4 text-lg font-semibold">What should families prepare first?</h3>
        <p className="mt-2 text-slate-700">
          Start with ACAT status, financial documents for means testing, and a shortlist
          of preferred suburbs so options can be reviewed faster.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Future aged care developments on the Gold Coast
        </h2>
        <p className="mt-3 text-slate-700">
          There are ongoing planning and redevelopment activities aimed at
          expanding aged care capacity on the Gold Coast. Publicly reported items
          include new facility proposals in Southport and larger mixed-use
          precincts that incorporate retirement living and residential aged care.
        </p>
        <p className="mt-3 text-slate-700">
          Development timelines vary - planning announcements do not always mean
          immediate construction - but these projects indicate continued
          investment in aged care infrastructure across the region.
        </p>
      </div>

      <div className="mt-10 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-semibold">Ready to get started?</h2>
        <p className="mt-2 text-slate-700">
          Use the placement form to share your situation. We'll follow up and
          help you understand the next steps.
        </p>

        <p className="mt-3 text-slate-700">
          You can also use our{" "}
          <Link to="/" className="font-semibold text-teal-700 underline hover:text-teal-800">
            nursing home placement form
          </Link>{" "}
          or send a{" "}
          <Link to="/referral" className="font-semibold text-teal-700 underline hover:text-teal-800">
            social worker referral
          </Link>
          .
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            Get started
          </Link>

          <Link
            to="/"
            className="inline-block rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-white"
          >
            Back to main page
          </Link>
        </div>
      </div>
    </div>
  );
}
