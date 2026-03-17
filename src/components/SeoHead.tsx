import { useEffect } from "react";

type SchemaValue = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoHeadProps = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: "website" | "article";
  imageUrl?: string;
  robots?: string;
  schemaId?: string;
  schema?: SchemaValue;
};

function setMetaName(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setMetaProperty(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function SeoHead({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  imageUrl,
  robots = "index,follow",
  schemaId,
  schema,
}: SeoHeadProps) {
  useEffect(() => {
    document.title = title;

    setMetaName("description", description);
    setMetaName("robots", robots);
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
    if (imageUrl) {
      setMetaName("twitter:image", imageUrl);
    }

    setMetaProperty("og:locale", "en_AU");
    setMetaProperty("og:site_name", "Nursing Homes Near Me");
    setMetaProperty("og:type", ogType);
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);
    if (imageUrl) {
      setMetaProperty("og:image", imageUrl);
    }

    setCanonical(canonicalUrl);

    if (schemaId && schema) {
      let scriptTag = document.getElementById(schemaId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        scriptTag.id = schemaId;
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    }
  }, [canonicalUrl, description, imageUrl, ogType, robots, schema, schemaId, title]);

  return null;
}
