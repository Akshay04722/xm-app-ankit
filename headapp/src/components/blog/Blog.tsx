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
import styles from "../../assets/components/Blog/Blog.module.css";
import { useRecentlyViewedCdp } from "@/lib/useRecentlyViewed";

interface BlogPostItem {
  id?: string; // Sitecore item ID/GUID — add this to your GraphQL query if not present
  title?: { jsonValue?: Field<string> };
  description?: { jsonValue?: Field<string> };
  author?: { jsonValue?: Field<string> };
  image?: { jsonValue?: ImageField };
  link?: { jsonValue?: LinkField };
  category?: { jsonValue?: Field<string> };
  date?: { jsonValue?: Field<string> };
}

interface BlogFields {
  data?: {
    datasource?: {
      title?: { jsonValue?: Field<string> };
      description?: { jsonValue?: Field<string> };
      posts?: { results?: BlogPostItem[] };
    };
  };
}

type BlogProps = ComponentProps & { fields?: BlogFields };

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-500 rounded-lg my-4 bg-gray-50">
    Missing datasource for component: <strong>{componentName}</strong>. Please
    associate a datasource item in Sitecore.
  </div>
);

export const Default = (props: BlogProps): React.JSX.Element => {
  const { fields, params } = props;
  const { RenderingIdentifier: id, styles: paramsStyles } = params || {};

  const datasource = fields?.data?.datasource;

  const [posts, setPosts] = React.useState<BlogPostItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (datasource?.posts?.results?.length) {
      setPosts(datasource.posts.results);
      setLoading(false);
    } else {
      import("@/lib/sitecore-client").then((mod) => {
        const client = mod.default;
        const query = `
          query BlogQuery($datasource: String!, $language: String!) {
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
        client.getData(query, {
          datasource: "/sitecore/content/akshay/akshayxmc/Home/Blog",
          language: "en"
        })
        .then((res: any) => {
          const results = res?.datasource?.posts?.results || [];
          setPosts(results);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch blog posts client-side:", err);
          setLoading(false);
        });
      });
    }
  }, [datasource]);

  const [searchInput, setSearchInput] = React.useState("");
  const [activeSearchQuery, setActiveSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const postsPerPage = 3;

  // CDP tracking + live "recently viewed" list
  const { recentlyViewed, trackPostClick } = useRecentlyViewedCdp();

  if (loading) {
    return (
      <div className="p-20 text-center text-gray-500 font-medium my-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        Loading blog posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return <NoDataFallback componentName="Blog" />;
  }

  const containerClass = `${styles.blogContainer} ${paramsStyles || ""}`.trim();

  const categoryCounts = posts.reduce(
    (acc: { [key: string]: number }, post) => {
      const cat = post.category?.jsonValue?.value;
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {},
  );

  const categoriesList = Object.entries(categoryCounts).map(
    ([name, count]) => ({ name, count }),
  );

  const sidebarPosts = recentlyViewed.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    imageSrc: p.imageSrc,
    href: p.href,
  }));

  const filteredPosts = posts.filter((post) => {
    const titleText = post.title?.jsonValue?.value?.toLowerCase() || "";
    const descText = post.description?.jsonValue?.value?.toLowerCase() || "";
    const matchesSearch =
      !activeSearchQuery ||
      titleText.includes(activeSearchQuery.toLowerCase()) ||
      descText.includes(activeSearchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || post.category?.jsonValue?.value === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const validatedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastPost = validatedCurrentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(
      selectedCategory === categoryName ? null : categoryName,
    );
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (validatedCurrentPage < totalPages)
      setCurrentPage(validatedCurrentPage + 1);
  };

  // Called whenever a post card/title/CTA is clicked
  const handlePostClick = (post: BlogPostItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    console.log("inside handlePostClick", post);
    // Register the clicked post to recently viewed list

    trackPostClick({
      id: post.id || "",
      title: post.title?.jsonValue?.value || "",
      date: post.date?.jsonValue?.value || "",
      imageSrc: post.image?.jsonValue?.value?.src || "",
      href: post.link?.jsonValue?.value?.href || "",
    });
  };

  return (
    <section className={containerClass} id={id} data-testid="blog-component">
      <div className={styles.mainLayout}>
        <div className={styles.leftColumn}>
          <div className={styles.postsList}>
            {currentPosts.length > 0 ? (
              currentPosts.map((post, index) => {
                const titleField = post.title?.jsonValue;
                const descriptionField = post.description?.jsonValue;
                const authorField = post.author?.jsonValue;
                const imageField = post.image?.jsonValue;
                const linkField = post.link?.jsonValue;
                const categoryField = post.category?.jsonValue;
                const dateField = post.date?.jsonValue;

                return (
                  <article
                    key={index}
                    className={styles.postCard}
                    onClick={(e) => handlePostClick(post, e)}
                  >
                    {imageField &&
                      !!(
                        imageField.value?.src || imageField.value?.mediaid
                      ) && (
                        <div className={styles.imageWrapper}>
                          <ContentSdkImage
                            field={imageField}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                    <div className={styles.metaRow}>
                      {authorField?.value && (
                        <div className={styles.metaItem}>
                          <ContentSdkText field={authorField} />
                        </div>
                      )}
                      {dateField?.value && (
                        <div className={styles.metaItem}>
                          <ContentSdkText field={dateField} />
                        </div>
                      )}
                      {categoryField?.value && (
                        <div className={styles.metaItem}>
                          <ContentSdkText field={categoryField} />
                        </div>
                      )}
                    </div>

                    {titleField?.value && (
                      <ContentSdkText
                        tag="h2"
                        field={titleField}
                        className={styles.title}
                      />
                    )}

                    {descriptionField?.value && (
                      <div className={styles.description}>
                        <ContentSdkRichText field={descriptionField} />
                      </div>
                    )}

                    {linkField && (
                      <div className={styles.linkContainer}>
                        <CompatibleLink
                          field={linkField}
                          className={styles.readMoreLink}
                          onClick={(e) => handlePostClick(post, e)}
                        />
                        <span className={styles.underline} />
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-500">
                No posts found matching your search.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${validatedCurrentPage === pageNum ? styles.activePage : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={
                      validatedCurrentPage === pageNum ? "page" : undefined
                    }
                  >
                    {pageNum}
                  </button>
                ),
              )}
              {validatedCurrentPage < totalPages && (
                <button
                  className={`${styles.pageButton} ${styles.nextButton}`}
                  onClick={handleNextPage}
                  aria-label="Next Page"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarWidgetCombined}>
            <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={styles.searchInput}
                placeholder="Search posts..."
                aria-label="Search posts"
              />
              <button
                type="submit"
                className={styles.searchButton}
                aria-label="Search"
              >
                Search
              </button>
            </form>

            {categoriesList.length > 0 && (
              <div className={styles.categoriesWidget}>
                <h3 className={styles.widgetTitle}>Categories</h3>
                <ul className={styles.categoriesList}>
                  {categoriesList.map((cat, idx) => (
                    <li
                      key={idx}
                      className={`${styles.categoryItem} ${selectedCategory === cat.name ? styles.activeCategory : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(cat.name)}
                        aria-pressed={selectedCategory === cat.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: 0,
                          font: "inherit",
                          color: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span className={styles.categoryName}>{cat.name}</span>
                        <span className={styles.categoryCount}>
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent Posts Widget — driven by actual clicks once the visitor has any,
              falls back to the latest posts from Sitecore until then */}
          <div className={styles.recentPostsWidget}>
            <h3 className={styles.widgetTitle}>Recent Posts</h3>
            <div className={styles.recentPostsList}>
              {sidebarPosts.length > 0 ? (
                sidebarPosts.map((post) => (
                  <div key={post.id} className={styles.recentPostCard}>
                    {post.imageSrc && (
                      <div className={styles.recentPostImageWrapper}>
                        {/* plain <img> since this is a plain URL string, not an ImageField */}
                        <img
                          src={post.imageSrc}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={styles.recentPostContent}>
                      <h4 className={styles.recentPostTitle}>
                        <a
                          href={post.href || "#"}
                          className={styles.recentPostLink}
                        >
                          {post.title}
                        </a>
                      </h4>
                      {post.date && (
                        <span className={styles.recentPostDate}>
                          {post.date}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-gray-500">
                  No recently viewed posts found.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
