"use client";

import React from "react";
import {
  NextImage as ContentSdkImage,
  Text as ContentSdkText,
  RichText as ContentSdkRichText,
  Field,
  ImageField,
  LinkField,
} from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "@/lib/component-props";
import { CompatibleLink } from "@/components/content-sdk/CompatibleLink";
import styles from "../../assets/components/BlogDetail/BlogDetail.module.css";
import { useRecentlyViewedCdp } from "@/lib/useRecentlyViewed";

interface BlogPostItem {
  id?: string;
  title?: { jsonValue?: Field<string> };
  description?: { jsonValue?: Field<string> };
  author?: { jsonValue?: Field<string> };
  image?: { jsonValue?: ImageField };
  link?: { jsonValue?: LinkField };
  category?: { jsonValue?: Field<string> };
  date?: { jsonValue?: Field<string> };
}

interface BlogDetailFields {
  data?: {
    currentPage?: {
      id: string;
      name: string;
      title?: { jsonValue?: Field<string> };
      content?: { jsonValue?: Field<string> };
      description?: { jsonValue?: Field<string> };
      author?: { jsonValue?: Field<string> };
      image?: { jsonValue?: ImageField };
      category?: { jsonValue?: Field<string> };
      date?: { jsonValue?: Field<string> };
    };
    blogFolder?: {
      posts?: { results?: BlogPostItem[] };
    };
  };
}

type BlogDetailProps = ComponentProps & { fields?: BlogDetailFields };

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-500 rounded-lg my-4 bg-gray-50">
    Component: <strong>{componentName}</strong>. Item could not be resolved. Please make sure this page is under Blog and has a corresponding template.
  </div>
);

export const Default = (props: BlogDetailProps): React.JSX.Element => {
  const { fields, params } = props;
  const { RenderingIdentifier: id, styles: paramsStyles } = params || {};

  const { currentPage, blogFolder } = fields?.data || {};
  const { trackPostClick } = useRecentlyViewedCdp();

  const titleField = currentPage?.title?.jsonValue || (fields as any)?.Title || (fields as any)?.PromoText2;
  const descriptionField = currentPage?.description?.jsonValue || (fields as any)?.PromoText;
  const authorField = currentPage?.author?.jsonValue || (fields as any)?.PromoText3;
  const imageField = currentPage?.image?.jsonValue || (fields as any)?.PromoIcon;
  const categoryField = currentPage?.category?.jsonValue || (fields as any)?.Category;
  const dateField = currentPage?.date?.jsonValue || (fields as any)?.Date;
  const pageContentField = currentPage?.content?.jsonValue || (fields as any)?.Content;

  // Client-side fetch of all blog posts for Related Articles + Prev/Next navigation.
  // blogFolder is no longer in the ComponentQuery (it caused GraphQL depth > 15),
  // so we load the same data client-side using sitecore-client, mirroring Blog.tsx.
  const [allPosts, setAllPosts] = React.useState<BlogPostItem[]>(
    blogFolder?.posts?.results || []
  );

  React.useEffect(() => {
    if (blogFolder?.posts?.results?.length) {
      setAllPosts(blogFolder.posts.results);
      return;
    }
    import("@/lib/sitecore-client").then((mod) => {
      const client = mod.default;
      const query = `
        query BlogPostsQuery($datasource: String!, $language: String!) {
          datasource: item(path: $datasource, language: $language) {
            posts: children(includeTemplateIDs: ["{1DB35138-F1D2-4EAA-A7E2-4B13FB9924DA}"]) {
              results {
                id
                name
                title: field(name: "PromoText2") { jsonValue }
                description: field(name: "PromoText") { jsonValue }
                author: field(name: "PromoText3") { jsonValue }
                image: field(name: "PromoIcon") { jsonValue }
                link: field(name: "PromoLink") { jsonValue }
                category: field(name: "Category") { jsonValue }
                date: field(name: "Date") { jsonValue }
              }
            }
          }
        }
      `;
      client
        .getData(query, {
          datasource: "/sitecore/content/akshay/akshayxmc/Home/Blog",
          language: "en",
        })
        .then((res: any) => {
          const results = res?.datasource?.posts?.results || [];
          setAllPosts(results);
        })
        .catch((err: unknown) => {
          console.error("BlogDetail: Failed to fetch blog posts client-side:", err);
        });
    });
  }, [blogFolder]);

  const posts = allPosts;

  if (!titleField && !imageField) {
    return <NoDataFallback componentName="BlogDetail" />;
  }

  // Track the page view on mount
  React.useEffect(() => {
    if (titleField?.value) {
      trackPostClick({
        id: currentPage?.id || "",
        title: titleField?.value || "",
        date: dateField?.value || "",
        imageSrc: imageField?.value?.src || "",
        href: currentPage?.name ? `/Blog/${currentPage.name}` : "",
      });
    }
  }, [currentPage, titleField, dateField, imageField, trackPostClick]);

  // Calculate reading time based on rich text article body
  const rawHtml = pageContentField?.value || descriptionField?.value || "";
  const wordCount = rawHtml.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Related posts: same category first, fill up with latest if less than 3
  const categoryFiltered = posts.filter(
    p => p.id !== currentPage?.id &&
         p.category?.jsonValue?.value?.toLowerCase() === categoryField?.value?.toLowerCase()
  );
  let displayRelated = [...categoryFiltered];
  if (displayRelated.length < 3) {
    const fallbacks = posts.filter(
      p => p.id !== currentPage?.id && !displayRelated.some(r => r.id === p.id)
    );
    displayRelated = [...displayRelated, ...fallbacks].slice(0, 3);
  }

  // Prev / Next Navigation
  const currentPageId = currentPage?.id || "";
  const currentIndex = currentPageId ? posts.findIndex(
    p => p.id && p.id.replace(/[{}-]/g, '').toLowerCase() === currentPageId.replace(/[{}-]/g, '').toLowerCase()
  ) : -1;
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  const containerClass = `${styles.detailContainer} ${paramsStyles || ""}`.trim();

  // Social Share handlers
  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <article className={containerClass} id={id} data-testid="blog-detail">
      {/* Breadcrumbs Navigation */}
      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumbContent}>
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbArrow}>&gt;</span>
          <a href="/Blog" className={styles.breadcrumbLink}>Blog</a>
          <span className={styles.breadcrumbArrow}>&gt;</span>
          <span className={styles.breadcrumbDivider}>|</span>
          <span className={styles.breadcrumbActive}>
            {titleField?.value || currentPage?.title?.jsonValue?.value}
          </span>
        </div>
      </div>

      {/* Large Hero Banner */}
      <header className={styles.heroSection}>
        {imageField && !!(imageField.value?.src || imageField.value?.mediaid) ? (
          <div className={styles.heroImageWrapper}>
            <ContentSdkImage
              field={imageField}
              priority
              className="w-full h-full object-cover"
              alt={titleField?.value || "Blog Hero Image"}
            />
            <div className={styles.heroOverlay} />
          </div>
        ) : (
          <div className={styles.heroPlaceholder} />
        )}

        <div className={styles.heroContent}>
          {categoryField?.value && (
            <span className={styles.heroCategory}>{categoryField.value}</span>
          )}
          <h1 className={styles.heroTitle}>
            {titleField?.value || currentPage?.title?.jsonValue?.value}
          </h1>
          <div className={styles.heroMetaRow}>
            {authorField?.value && (
              <span className={styles.heroMetaItem}>
                By <strong>{authorField.value}</strong>
              </span>
            )}
            {dateField?.value && (
              <span className={styles.heroMetaItem}>{dateField.value}</span>
            )}
            <span className={styles.heroMetaItem}>
              {readingTime} min read
            </span>
          </div>
        </div>
      </header>

      {/* Main content grid (Article content + Share Bar) */}
      <div className={styles.articleLayout}>
        {/* Sticky Social Share Bar (Left Side) */}
        <aside className={styles.shareSidebar}>
          <div className={styles.stickyShare}>
            <span className={styles.shareLabel}>Share</span>
            <a
              href={`https://twitter.com/intent/tweet?url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareIcon}
              aria-label="Share on X"
            >
              𝕏
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareIcon}
              aria-label="Share on Facebook"
            >
              FB
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareIcon}
              aria-label="Share on LinkedIn"
            >
              LN
            </a>
            <button
              onClick={handleCopyLink}
              className={styles.shareIcon}
              aria-label="Copy page link"
            >
              🔗
            </button>
          </div>
        </aside>

        {/* Rich Text Article Body */}
        <main className={styles.articleBody}>
          {pageContentField?.value ? (
            <ContentSdkRichText field={pageContentField} />
          ) : descriptionField?.value ? (
            <ContentSdkRichText field={descriptionField} />
          ) : (
            <p className="text-gray-400 italic">No content available for this post.</p>
          )}
        </main>
      </div>

      {/* Prev / Next Article Navigation */}
      <nav className={styles.articleNavigation} aria-label="Article navigation">
        <div className={styles.navWrapper}>
          {prevPost && prevPost.link?.jsonValue && (
            <div className={styles.navPrev}>
              <span className={styles.navLabel}>Previous Article</span>
              <CompatibleLink
                field={prevPost.link.jsonValue}
                className={styles.navTitleLink}
              >
                &larr; {prevPost.title?.jsonValue?.value}
              </CompatibleLink>
            </div>
          )}
          {nextPost && nextPost.link?.jsonValue && (
            <div className={styles.navNext}>
              <span className={styles.navLabel}>Next Article</span>
              <CompatibleLink
                field={nextPost.link.jsonValue}
                className={styles.navTitleLink}
              >
                {nextPost.title?.jsonValue?.value} &rarr;
              </CompatibleLink>
            </div>
          )}
        </div>
      </nav>

      {/* Related Posts Section */}
      {displayRelated.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedSectionTitle}>Related Articles</h2>
          <div className={styles.relatedGrid}>
            {displayRelated.map((post, idx) => (
              <article key={post.id || idx} className={styles.relatedCard}>
                {post.image?.jsonValue && (
                  <div className={styles.relatedImageWrapper}>
                    <ContentSdkImage
                      field={post.image.jsonValue}
                      className="w-full h-full object-cover"
                      alt={post.title?.jsonValue?.value || "Related Post Image"}
                    />
                  </div>
                )}
                <div className={styles.relatedContent}>
                  {post.date?.jsonValue?.value && (
                    <span className={styles.relatedDate}>{post.date.jsonValue.value}</span>
                  )}
                  <h3 className={styles.relatedTitle}>
                    {post.link?.jsonValue ? (
                      <CompatibleLink field={post.link.jsonValue}>
                        {post.title?.jsonValue?.value}
                      </CompatibleLink>
                    ) : (
                      post.title?.jsonValue?.value
                    )}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
