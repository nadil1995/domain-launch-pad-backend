const logger = require('../utils/logger');
const { withRetry, sleep } = require('../utils/rate-limiter');
const pool = require('../db/pool');
const axios = require('axios');

const wpUrl = process.env.WP_URL || 'https://yourdomain.co.uk';
const wpUsername = process.env.WP_USERNAME || '';
const wpPassword = process.env.WP_APP_PASSWORD || '';

logger.info(`WordPress config: URL=${wpUrl}, User=${wpUsername}, Pass=${wpPassword ? '***' + wpPassword.slice(-4) : 'empty'}`);

if (!wpUrl || !wpUsername || !wpPassword) {
  logger.warn('WordPress credentials not fully configured');
}

const wpClient = axios.create({
  baseURL: `${wpUrl}/wp-json/wp/v2`,
  auth: {
    username: wpUsername,
    password: wpPassword
  }
});

const categoryCache = {};

async function getOrCreateCategory(categoryName) {
  if (categoryCache[categoryName]) {
    return categoryCache[categoryName];
  }

  try {
    // Try to find existing category
    const response = await wpClient.get('/categories', {
      params: { search: categoryName, per_page: 100 }
    });

    if (response.data && response.data.length > 0) {
      const category = response.data.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (category) {
        categoryCache[categoryName] = category.id;
        return category.id;
      }
    }

    // Create new category if not found
    const createResponse = await wpClient.post('/categories', {
      name: categoryName,
      description: `Reviews and guides for ${categoryName}`
    });

    categoryCache[categoryName] = createResponse.data.id;
    logger.info(`Created WP category: ${categoryName} (ID: ${createResponse.data.id})`);
    return createResponse.data.id;

  } catch (error) {
    logger.error(`Failed to get/create category ${categoryName}`, { message: error.message });
    throw error;
  }
}

async function uploadImage(imageUrl) {
  try {
    if (!imageUrl) return null;

    // Download image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const filename = imageUrl.split('/').pop() || 'product-image.jpg';

    // Upload to WordPress
    const uploadResponse = await wpClient.post('/media', imageResponse.data, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

    logger.debug(`Uploaded image: ${filename} (ID: ${uploadResponse.data.id})`);
    return uploadResponse.data.id;

  } catch (error) {
    logger.warn(`Failed to upload image from ${imageUrl}`, { message: error.message });
    return null;
  }
}

function buildPostContent(article, product, affiliateLink) {
  const disclaimerHTML = `
<div class="affiliate-disclosure">
  <p><strong>Affiliate Disclosure:</strong> This article contains Amazon affiliate links. When you purchase through these links, we may earn a small commission at no extra cost to you. This helps support our research and testing. We only recommend products we genuinely believe in.</p>
</div>
`;

  const schemaScript = `
<script type="application/ld+json">
${JSON.stringify(article.schema || {}, null, 2)}
</script>
`;

  // Replace placeholder with actual affiliate link
  const content = article.content.replace(
    'AMAZON_LINK_PLACEHOLDER',
    affiliateLink
  );

  return `${disclaimerHTML}${schemaScript}${content}`;
}

async function publishArticle(article, product, publishStatus = 'draft') {
  try {
    logger.info(`Publishing article for ${product.asin} (status: ${publishStatus})`);

    // Get or create category
    const categoryId = await getOrCreateCategory(product.category);

    // Upload image
    let featuredMediaId = null;
    if (product.pa_api_data?.image) {
      featuredMediaId = await uploadImage(product.pa_api_data.image);
    }

    // Build affiliate link
    const affiliateLink = `https://amazon.co.uk/gp/search?keywords=${encodeURIComponent(product.asin)}&tag=${process.env.AMAZON_PARTNER_TAG}&linkCode=sr&index=aps`;

    // Build full post content
    const postContent = buildPostContent(article, product, affiliateLink);

    // Create WP post
    const postData = {
      title: article.title,
      content: postContent,
      excerpt: article.metaDescription,
      status: publishStatus,
      categories: [categoryId],
      yoast_head_json: {
        title: article.title,
        description: article.metaDescription,
        og_locale: 'en_GB',
        og_type: 'article',
        og_title: article.title,
        og_description: article.metaDescription,
        og_url: `${wpUrl}/?p=`,
        twitter_card: 'summary_large_image'
      }
    };

    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }

    const createResponse = await withRetry(() =>
      wpClient.post('/posts', postData),
      3,
      2000
    );

    const postId = createResponse.data.id;
    const postUrl = createResponse.data.link;

    logger.info(`Published article: ${product.asin} (WP ID: ${postId}, URL: ${postUrl})`);

    // Update article in database
    await pool.query(
      `UPDATE articles
       SET wp_post_id = $1, wp_url = $2, publish_status = $3
       WHERE id = $4`,
      [postId, postUrl, publishStatus, article.id]
    );

    // Update product status
    await pool.query(
      `UPDATE products SET status = 'published' WHERE id = $1`,
      [product.id]
    );

    return { postId, postUrl };

  } catch (error) {
    logger.error(`Failed to publish article for ${product.asin}`, { message: error.message });

    // Mark article as failed
    await pool.query(
      `UPDATE articles SET publish_status = 'failed' WHERE id = $1`,
      [article.id]
    );

    throw error;
  }
}

async function updatePostPrice(postId, newPrice) {
  try {
    logger.info(`Updating price for post ${postId} to £${newPrice}`);

    await wpClient.post(`/posts/${postId}`, {
      meta: {
        product_price: newPrice,
        price_updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.warn(`Failed to update price for post ${postId}`, { message: error.message });
  }
}

async function publishPendingArticles(limit = 5, publishLive = false) {
  try {
    const publishStatus = publishLive ? 'publish' : 'draft';

    // Get articles ready to publish
    const result = await pool.query(
      `SELECT a.id, a.title, a.content, a.meta_description, p.id as product_id, p.asin, p.category, p.pa_api_data
       FROM articles a
       JOIN products p ON a.product_id = p.id
       WHERE a.publish_status = 'draft'
       AND p.status = 'generated'
       LIMIT $1`,
      [limit]
    );

    const articles = result.rows;
    if (articles.length === 0) {
      logger.info('No articles ready to publish');
      return { published: 0, failed: 0 };
    }

    logger.info(`Publishing ${articles.length} articles (status: ${publishStatus})`);

    let published = 0;
    let failed = 0;

    for (const row of articles) {
      try {
        row.pa_api_data = JSON.parse(row.pa_api_data || '{}');

        const article = {
          id: row.id,
          title: row.title,
          content: row.content,
          metaDescription: row.meta_description
        };

        const product = {
          id: row.product_id,
          asin: row.asin,
          category: row.category,
          pa_api_data: row.pa_api_data
        };

        await publishArticle(article, product, publishStatus);
        published++;

      } catch (error) {
        logger.error(`Failed to publish article ${row.id}`, { message: error.message });
        failed++;
      }

      // Stagger requests to WordPress
      if (published + failed < articles.length) {
        const delay = parseInt(process.env.WP_PUBLISH_STAGGER_MS || 2000);
        await sleep(delay);
      }
    }

    logger.info(`Publish complete: ${published} succeeded, ${failed} failed`);
    return { published, failed };

  } catch (error) {
    logger.error('Failed to publish pending articles', { message: error.message });
    throw error;
  }
}

module.exports = {
  getOrCreateCategory,
  uploadImage,
  buildPostContent,
  publishArticle,
  updatePostPrice,
  publishPendingArticles,
  wpClient
};
