import { Link, Navigate, useParams } from "react-router-dom";
import { blogPosts } from "./blogPosts";
import SeoHead from "./SeoHead";

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const paragraphs = post.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const description = paragraphs[0]?.slice(0, 155) || "Nursing home placement insights for Australian families.";
  const canonicalUrl = `https://www.nursinghomesnearme.com.au/blog/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: `https://www.nursinghomesnearme.com.au${post.image}`,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        datePublished: post.datePublished,
        dateModified: post.datePublished,
        author: {
          "@type": "Organization",
          name: "Nursing Homes Near Me",
        },
        publisher: {
          "@type": "Organization",
          name: "Nursing Homes Near Me",
          logo: {
            "@type": "ImageObject",
            url: "https://www.nursinghomesnearme.com.au/favicon-512.png",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.nursinghomesnearme.com.au/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: "https://www.nursinghomesnearme.com.au/blog",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", padding: "24px 16px" }}>
      <SeoHead
        title={`${post.title} | Nursing Homes Near Me`}
        description={description}
        canonicalUrl={canonicalUrl}
        ogType="article"
        schemaId={`blog-posting-${post.slug}`}
        schema={schema}
      />
      <main style={{ maxWidth: 860, margin: "0 auto" }}>
        <p style={{ marginTop: 0 }}>
          <Link to="/blog" style={{ color: "#0f766e" }}>
            Back to all blog posts
          </Link>
        </p>
        <p style={{ marginBottom: 6, color: "#0f766e", fontWeight: 700 }}>Day {post.day}</p>
        <h1 style={{ marginTop: 0, color: "#0b3b5b", lineHeight: 1.2 }}>{post.title}</h1>
        <img
          src={post.image}
          alt={post.title}
          style={{
            width: "100%",
            borderRadius: 12,
            display: "block",
            marginBottom: 20,
          }}
        />

        <article>
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} style={{ lineHeight: 1.8, color: "#1f2937", fontSize: 17 }}>
              {paragraph}
            </p>
          ))}
        </article>
      </main>
    </div>
  );
}
