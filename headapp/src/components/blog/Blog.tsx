'use client';

import React from 'react';
import {
  NextImage as ContentSdkImage,
  Text as ContentSdkText,
  RichText as ContentSdkRichText,
  Field,
  ImageField,
  LinkField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import { CompatibleLink } from '@/components/content-sdk/CompatibleLink';
import styles from '../../assets/components/Blog/Blog.module.css';

interface BlogPostItem {
  title?: {
    jsonValue?: Field<string>;
  };
  description?: {
    jsonValue?: Field<string>;
  };
  author?: {
    jsonValue?: Field<string>;
  };
  image?: {
    jsonValue?: ImageField;
  };
  link?: {
    jsonValue?: LinkField;
  };
  category?: {
    jsonValue?: Field<string>;
  };
  date?: {
    jsonValue?: Field<string>;
  };
}

interface BlogFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
      description?: {
        jsonValue?: Field<string>;
      };
      posts?: {
        results?: BlogPostItem[];
      };
    };
  };
}

type BlogProps = ComponentProps & {
  fields?: BlogFields;
};

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-500 rounded-lg my-4 bg-gray-50">
    Missing datasource for component: <strong>{componentName}</strong>. Please associate a datasource item in Sitecore.
  </div>
);

export const Default = (props: BlogProps): React.JSX.Element => {
  const { fields, params } = props;
  const { RenderingIdentifier: id, styles: paramsStyles } = params || {};

  const datasource = fields?.data?.datasource;

  // State for search and pagination
  const [searchInput, setSearchInput] = React.useState('');
  const [activeSearchQuery, setActiveSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const postsPerPage = 3;

  if (!datasource || !datasource.posts?.results?.length) {
    return <NoDataFallback componentName="Blog" />;
  }

  const posts = datasource.posts.results;
  const containerClass = `${styles.blogContainer} ${paramsStyles || ''}`.trim();

  // 1. Dynamic Categories computed directly from Sitecore posts
  const categoryCounts = posts.reduce((acc: { [key: string]: number }, post) => {
    const cat = post.category?.jsonValue?.value;
    if (cat) {
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});

  const categoriesList = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // 2. Dynamic Recent Posts list from Sitecore
  const recentPosts = posts.slice(0, 5).map((post) => ({
    title: post.title?.jsonValue?.value || '',
    date: post.date?.jsonValue?.value || '03 Aug 2022',
    image: post.image?.jsonValue,
  }));

  // 3. Interactive Search & Category Filter Logic
  const filteredPosts = posts.filter((post) => {
    const titleText = post.title?.jsonValue?.value?.toLowerCase() || '';
    const descText = post.description?.jsonValue?.value?.toLowerCase() || '';
    const matchesSearch =
      !activeSearchQuery ||
      titleText.includes(activeSearchQuery.toLowerCase()) ||
      descText.includes(activeSearchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || post.category?.jsonValue?.value === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // 4. Interactive Pagination Logic
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
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // clear filter
    } else {
      setSelectedCategory(categoryName);
    }
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (validatedCurrentPage < totalPages) {
      setCurrentPage(validatedCurrentPage + 1);
    }
  };

  return (
    <section className={containerClass} id={id} data-testid="blog-component">
      <div className={styles.mainLayout}>
        {/* Left Column: Blog Posts and Pagination */}
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
                  <article key={index} className={styles.postCard}>
                    {/* Image Container */}
                    {imageField && !!(imageField.value?.src || imageField.value?.mediaid) && (
                      <div className={styles.imageWrapper}>
                        <ContentSdkImage
                          field={imageField}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className={styles.metaRow}>
                      {/* Author */}
                      {authorField?.value && (
                        <div className={styles.metaItem}>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                          <ContentSdkText field={authorField} />
                        </div>
                      )}

                      {/* Date */}
                      {dateField?.value && (
                        <div className={styles.metaItem}>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                          <ContentSdkText field={dateField} />
                        </div>
                      )}

                      {/* Category */}
                      {categoryField?.value && (
                        <div className={styles.metaItem}>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.72 1.72 0 002.432 0l4.318-4.318a1.72 1.72 0 000-2.432L11.16 3.659A2.25 2.25 0 009.568 3z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                          </svg>
                          <ContentSdkText field={categoryField} />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    {titleField?.value && (
                      <ContentSdkText
                        tag="h2"
                        field={titleField}
                        className={styles.title}
                      />
                    )}

                    {/* Description */}
                    {descriptionField?.value && (
                      <div className={styles.description}>
                        <ContentSdkRichText field={descriptionField} />
                      </div>
                    )}

                    {/* CTA Link */}
                    {linkField && (
                      <div className={styles.linkContainer}>
                        <CompatibleLink field={linkField} className={styles.readMoreLink} />
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

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`${styles.pageButton} ${
                    validatedCurrentPage === pageNum ? styles.activePage : ''
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                  aria-label={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>
              ))}
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

        {/* Right Column: Sidebar */}
        <aside className={styles.sidebar}>
          {/* Search Box Widget */}
          <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={styles.searchInput}
              placeholder="Search posts..."
              aria-label="Search posts"
            />
            <button type="submit" className={styles.searchButton} aria-label="Search">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Categories Widget */}
          {categoriesList.length > 0 && (
            <div className={styles.widget}>
              <h3 className={styles.widgetTitle}>Categories</h3>
              <ul className={styles.categoriesList}>
                {categoriesList.map((cat, idx) => (
                  <li
                    key={idx}
                    className={`${styles.categoryItem} ${
                      selectedCategory === cat.name ? styles.activeCategory : ''
                    }`}
                    onClick={() => handleCategoryClick(cat.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={styles.categoryName}>{cat.name}</span>
                    <span className={styles.categoryCount}>{cat.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Posts Widget */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Recent Posts</h3>
            <div className={styles.recentPostsList}>
              {recentPosts.map((post, idx) => (
                <div key={idx} className={styles.recentPostCard}>
                  {post.image && !!(post.image.value?.src || post.image.value?.mediaid) && (
                    <div className={styles.recentPostImageWrapper}>
                      <ContentSdkImage
                        field={post.image}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={styles.recentPostContent}>
                    <h4 className={styles.recentPostTitle}>
                      <a href="/" className={styles.recentPostLink}>
                        {post.title}
                      </a>
                    </h4>
                    <span className={styles.recentPostDate}>{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
