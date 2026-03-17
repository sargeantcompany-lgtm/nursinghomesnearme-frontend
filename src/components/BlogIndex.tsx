import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { blogPosts } from "./blogPosts";
import SeoHead from "./SeoHead";

export default function BlogIndex() {
  const [search, setSearch] = useState("");
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blogPosts;
    return blogPosts.filter((post) => {
      const title = post.title.toLowerCase();
      const excerpt = post.excerpt.toLowerCase();
      const content = post.content.toLowerCase();
      return title.includes(q) || excerpt.includes(q) || content.includes(q);
    });
  }, [search]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Nursing Home Placement Blog",
    url: "https://www.nursinghomesnearme.com.au/blog",
    publisher: {
      "@type": "Organization",
      name: "Nursing Homes Near Me",
    },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `https://www.nursinghomesnearme.com.au/blog/${post.slug}`,
      image: `https://www.nursinghomesnearme.com.au${post.image}`,
      datePublished: post.datePublished,
    })),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 16px" }}>
      <SeoHead
        title="Nursing Home Placement Blog Australia | Nursing Homes Near Me"
        description="Daily nursing home placement blogs for Australian families. Costs, waitlists, RAD/DAP, and choosing the right aged care home."
        canonicalUrl="https://www.nursinghomesnearme.com.au/blog"
        schemaId="blog-index-schema"
        schema={schema}
      />
      <main style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <Link
            to="/"
            style={{
              display: "inline-block",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#0b3b5b",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Return Home
          </Link>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blog posts..."
            style={{
              minWidth: 260,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              flex: "1 1 320px",
            }}
          />
        </div>
        <h1 style={{ marginTop: 0, color: "#0b3b5b" }}>Nursing Home Placement Blog</h1>
        <p style={{ color: "#334155", marginTop: 0 }}>
          Practical aged care placement guides for families in Australia.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={{ padding: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#0f766e", fontWeight: 700 }}>
                  Blog #{post.day}
                </p>
                <h2 style={{ margin: "8px 0 10px", fontSize: 18, color: "#0b3b5b" }}>{post.title}</h2>
                <p style={{ margin: "0 0 12px", color: "#334155", lineHeight: 1.6 }}>{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} style={{ color: "#0f766e", fontWeight: 700 }}>
                  Read post
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!filteredPosts.length ? (
          <p style={{ color: "#475569", marginTop: 14 }}>No blogs found for that search.</p>
        ) : null}
      </main>
    </div>
  );
}
