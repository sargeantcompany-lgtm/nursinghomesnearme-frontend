import { useEffect } from "react";

const SITE_URL = "https://www.nursinghomesnearme.com.au";

export default function SiteStructuredData() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Nursing Homes Near Me",
          url: SITE_URL,
          email: "info@nursinghomesnearme.com.au",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon-512.png`,
          },
          areaServed: {
            "@type": "AdministrativeArea",
            name: "Gold Coast, Queensland, Australia",
          },
        },
        {
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#localbusiness`,
          name: "Nursing Homes Near Me",
          url: SITE_URL,
          email: "info@nursinghomesnearme.com.au",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Gold Coast",
            addressRegion: "QLD",
            addressCountry: "AU",
          },
          areaServed: {
            "@type": "AdministrativeArea",
            name: "Gold Coast, Queensland, Australia",
          },
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: SITE_URL,
          name: "Nursing Homes Near Me",
          publisher: { "@id": `${SITE_URL}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
      ],
    };

    const scriptId = "seo-sitewide-schema";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.type = "application/ld+json";
      scriptTag.id = scriptId;
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);
  }, []);

  return null;
}
