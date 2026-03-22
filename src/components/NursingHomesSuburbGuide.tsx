import { Link } from "react-router-dom";
import SeoHead from "./SeoHead";
import SuburbFacilityList from "./SuburbFacilityList";

type NursingHomesSuburbGuideProps = {
  suburb: string;
  slug: string;
  nearby: string[];
  intro: string;
  suburbLinks?: Array<{ label: string; to: string }>;
};

const SITE_URL = "https://www.nursinghomesnearme.com.au";

const ALL_SUBURB_LINKS = [
  { label: "Gold Coast", to: "/nursing-homes-gold-coast" },
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
];

export default function NursingHomesSuburbGuide({
  suburb,
  slug,
  nearby,
  intro,
}: NursingHomesSuburbGuideProps) {
  const pageUrl = `${SITE_URL}/${slug}`;
  const title = `${suburb} Nursing Homes (2026 Guide) | Availability, Costs and ACAT`;
  const description = `A practical guide for families looking at nursing homes in ${suburb}: availability, ACAT, means testing, RAD vs DAP costs, and how to get support.`;

  const otherSuburbs = ALL_SUBURB_LINKS.filter((s) => s.to !== `/${slug}`);

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
            name: `How many nursing homes are in ${suburb}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${suburb} and its surrounding area has a number of residential aged care facilities. Availability changes frequently — contact our team for current vacancy information.`,
            },
          },
          {
            "@type": "Question",
            name: "Do I need an ACAT assessment before entering a nursing home?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. An ACAT (Aged Care Assessment Team) assessment is required before accessing government-funded residential aged care. It is free and can be requested by your GP or a hospital social worker.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between RAD and DAP?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A RAD (Refundable Accommodation Deposit) is a lump sum that is refunded when you leave. A DAP (Daily Accommodation Payment) is a non-refundable daily fee calculated using the government MPIR rate of 7.65% per annum (Jan–Mar 2026). You can pay either or a combination of both.",
            },
          },
          {
            "@type": "Question",
            name: "What does residential aged care cost in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Everyone pays the Basic Daily Fee of $65.55/day. Accommodation costs (RAD or DAP) are set by the facility. Means-tested care contributions apply based on your income and assets — up to $22.15/day hotelling and $105.30/day non-clinical care for new residents from 1 November 2025.",
            },
          },
          {
            "@type": "Question",
            name: "Can placement happen quickly?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Urgent cases — especially hospital discharges — can move within days. Preferred suburbs and private rooms may have a wait. Starting the process early gives families the most options.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
          { "@type": "ListItem", position: 2, name: "Gold Coast Nursing Homes", item: SITE_URL + "/nursing-homes-gold-coast" },
          { "@type": "ListItem", position: 3, name: `${suburb} Nursing Homes`, item: pageUrl },
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

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/nursing-homes-gold-coast" className="hover:underline">Gold Coast</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-800 font-medium">{suburb}</span>
      </nav>

      <h1 className="text-3xl font-bold">{suburb} Nursing Homes: What Families Need to Know (2026)</h1>
      <p className="mt-4 text-lg text-slate-700">{intro}</p>

      {/* Steps */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">The 3 steps to aged care placement</h2>
        <div className="mt-4 grid gap-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">1</div>
            <div>
              <p className="font-semibold text-slate-800">ACAT Assessment</p>
              <p className="mt-1 text-sm text-slate-600">An Aged Care Assessment Team assessment is required before entering government-funded residential care. It is free and determines eligibility. Your GP or hospital social worker can refer you.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">2</div>
            <div>
              <p className="font-semibold text-slate-800">Means Assessment</p>
              <p className="mt-1 text-sm text-slate-600">Services Australia assesses your income and assets to determine what fees apply. This is separate from ACAT. Apply early — it can take several weeks and some facilities won't accept a resident without it.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">3</div>
            <div>
              <p className="font-semibold text-slate-800">Choose a Facility</p>
              <p className="mt-1 text-sm text-slate-600">Compare facilities on care model, location, room type, and total cost. Visit in person where possible. Our team can help you understand what each facility is offering and what the real costs will be.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee benchmarks */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Current 2026 aged care fee benchmarks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Australian Government rates — applies to all {suburb} facilities.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Basic Daily Fee", value: "$65.55 / day" },
            { label: "Hotelling Contribution (max)", value: "$22.15 / day" },
            { label: "Non-Clinical Care (max)", value: "$105.30 / day" },
            { label: "Lifetime Care Cap", value: "$135,319" },
            { label: "DAP Rate (MPIR)", value: "7.65% p.a." },
            { label: "Max RAD (no approval)", value: "$758,627" },
            { label: "Asset Free Area", value: "$63,000" },
            { label: "Income Free Area (single)", value: "$34,762 / yr" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-base font-bold text-teal-700">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Effective 1 November 2025 / 1 January 2026. MPIR reviewed quarterly.{" "}
          <Link to="/aged-care-fees-and-charges" className="underline hover:text-slate-600">Full fees guide →</Link>
        </p>
      </div>

      {/* New 2025 rules */}
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-semibold text-amber-900">Important: Changes from 1 November 2025</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-amber-800 space-y-2">
          <li><strong>RAD retention:</strong> Facilities can now keep up to 2% of your RAD per year (max 10% over 5 years) — so not 100% is refunded after a long stay.</li>
          <li><strong>New care contributions:</strong> The old means-tested care fee is replaced by two separate fees — a Hotelling Contribution (up to $22.15/day) and a Non-Clinical Care Contribution (up to $105.30/day).</li>
          <li><strong>New lifetime cap:</strong> $135,318.69 for residents entering from 1 November 2025 (was $84,571.66 under the old framework).</li>
          <li><strong>DAP indexation:</strong> Daily Accommodation Payments are now indexed twice yearly in line with CPI.</li>
        </ul>
      </div>

      {/* What to look for */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">What to look for when comparing {suburb} facilities</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { icon: "👩‍⚕️", title: "Staffing levels", desc: "Ask about registered nurse (RN) hours, total care minutes per resident per day, and after-hours coverage." },
            { icon: "🏠", title: "Room type", desc: "Single rooms with ensuite are standard in newer facilities. Shared rooms are less common but cheaper." },
            { icon: "💬", title: "Family communication", desc: "How does the facility update families? Can you call the floor directly? Do they have a family portal?" },
            { icon: "🌿", title: "Lifestyle program", desc: "Activities, outings, dementia-specific programs and social connection are critical to quality of life." },
            { icon: "📋", title: "Star rating", desc: "Check the facility's star rating on My Aged Care. Look at all dimensions — not just the overall score." },
            { icon: "💰", title: "Total cost", desc: "Add up Basic Daily Fee + accommodation cost + means-tested contributions. Get a written quote before committing." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm text-slate-800">{title}</p>
                <p className="mt-1 text-xs text-slate-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAD vs DAP explainer */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">RAD vs DAP — which should you pay?</h2>
        <p className="mt-3 text-slate-600 text-sm">This is one of the most common questions families face. Here is a plain-language comparison.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
            <p className="font-bold text-teal-800">RAD (Lump sum)</p>
            <ul className="mt-2 text-sm text-teal-700 space-y-1 list-disc pl-4">
              <li>Paid upfront — e.g. $500,000</li>
              <li>Refunded when you leave (minus up to 10% retention under new rules)</li>
              <li>No ongoing daily accommodation fee</li>
              <li>Better if you have assets and a shorter expected stay</li>
            </ul>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="font-bold text-slate-800">DAP (Daily fee)</p>
            <ul className="mt-2 text-sm text-slate-700 space-y-1 list-disc pl-4">
              <li>No lump sum — pay daily instead</li>
              <li>Example: $500,000 × 7.65% ÷ 365 = $104.79/day</li>
              <li>Not refundable — ongoing cost</li>
              <li>Better if you want to preserve capital or have limited assets</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          You can also pay a combination — e.g. pay part RAD upfront to reduce the daily DAP.{" "}
          <Link to="/aged-care-fees-and-charges" className="underline">Full fees guide →</Link>
        </p>
      </div>

      {/* Facility list */}
      <SuburbFacilityList suburb={suburb} />

      {/* Nearby suburbs */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Nearby suburbs families also consider</h2>
        <p className="mt-2 text-sm text-slate-600">Availability varies — sometimes a facility in a neighbouring suburb is the best fit.</p>
        <p className="mt-3 text-slate-700">{nearby.join(", ")}.</p>
      </div>

      {/* FAQ */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>

        <h3 className="mt-4 text-base font-semibold">How quickly can placement happen?</h3>
        <p className="mt-2 text-sm text-slate-600">Urgent hospital discharges can move within days with the right support. For non-urgent placements, preferred suburbs and private rooms can have wait times of weeks to months. Starting ACAT and means testing early gives you the most options.</p>

        <h3 className="mt-4 text-base font-semibold">Does my home count in the means test?</h3>
        <p className="mt-2 text-sm text-slate-600">Your home is excluded from the asset assessment for the first two years if a spouse, dependent child, or carer still lives there. After that it may be included up to the home exemption cap of $210,555 per person.</p>

        <h3 className="mt-4 text-base font-semibold">Can families visit before accepting a room?</h3>
        <p className="mt-2 text-sm text-slate-600">Yes, and it is strongly recommended. Visiting lets you assess the care culture, staff communication, cleanliness, and whether the room suits the person's needs. Visit at different times of day if possible.</p>

        <h3 className="mt-4 text-base font-semibold">What is the ACAT assessment and how long does it take?</h3>
        <p className="mt-2 text-sm text-slate-600">An ACAT assessment is conducted by a team of health professionals who visit the person at home or in hospital. It is free. Wait times vary — in Queensland they can be 1–4 weeks for non-urgent cases, or faster if a hospital social worker flags urgency.</p>

        <h3 className="mt-4 text-base font-semibold">Is your service free to families?</h3>
        <p className="mt-2 text-sm text-slate-600">Yes. Our placement support service is completely free to families. We are independent and not tied to any particular facility.</p>
      </div>

      {/* All suburb links */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">All Gold Coast suburb guides</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherSuburbs.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="inline-block rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 rounded-2xl bg-slate-800 p-6 text-white">
        <h2 className="text-xl font-semibold">Need help finding the right home in {suburb}?</h2>
        <p className="mt-2 text-slate-300 text-sm">
          Our team helps Gold Coast families understand costs, navigate ACAT, and compare facilities. Free, independent, no obligation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/" className="inline-block rounded-xl bg-teal-500 px-5 py-3 font-semibold text-white hover:bg-teal-400">
            Get free help →
          </Link>
          <Link to="/acat-pathway-finder" className="inline-block rounded-xl border border-slate-500 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-700">
            ACAT guide
          </Link>
          <Link to="/aged-care-fees-and-charges" className="inline-block rounded-xl border border-slate-500 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-700">
            Fees explained
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Fee figures sourced from the Australian Government Department of Health and Aged Care. Effective 1 November 2025 / 1 January 2026. For personal financial advice contact a registered aged care financial adviser.
      </p>
    </div>
  );
}
