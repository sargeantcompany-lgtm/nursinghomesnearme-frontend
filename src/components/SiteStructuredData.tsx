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
