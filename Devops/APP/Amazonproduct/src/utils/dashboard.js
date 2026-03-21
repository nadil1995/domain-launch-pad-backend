const pool = require('../db/pool');
const logger = require('./logger');

async function getDashboardStats() {
  try {
    // Product statistics
    const productStats = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM products
      GROUP BY status
    `);

    // Article statistics
    const articleStats = await pool.query(`
      SELECT
        publish_status,
        COUNT(*) as count,
        AVG(word_count) as avg_words,
        SUM(cost_usd) as total_cost
      FROM articles
      GROUP BY publish_status
    `);

    // Recent pipeline runs
    const recentRuns = await pool.query(`
      SELECT
        id,
        phase,
        status,
        products_fetched,
        products_failed,
        articles_generated,
        articles_failed,
        articles_published,
        articles_failed_publish,
        total_cost_usd,
        started_at,
        completed_at
      FROM pipeline_runs
      ORDER BY started_at DESC
      LIMIT 5
    `);

    // Price sync health
    const priceSyncHealth = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN last_price_sync_at > NOW() - INTERVAL '24 hours' THEN 1 END) as synced_24h,
        MAX(last_price_sync_at) as last_sync
      FROM products
      WHERE status = 'fetched'
    `);

    // Total costs
    const totalCosts = await pool.query(`
      SELECT
        SUM(cost_usd) as total_usd,
        COUNT(*) as total_articles
      FROM articles
    `);

    return {
      products: productStats.rows,
      articles: articleStats.rows,
      recentRuns: recentRuns.rows,
      priceSync: priceSyncHealth.rows[0],
      costs: totalCosts.rows[0]
    };

  } catch (error) {
    logger.error('Failed to get dashboard stats', { message: error.message });
    throw error;
  }
}

async function displayDashboard() {
  try {
    const stats = await getDashboardStats();

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║         Affiliate Pipeline Dashboard             ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Product Status
    console.log('📦 PRODUCT STATUS:');
    for (const row of stats.products) {
      const count = String(row.count).padStart(4);
      console.log(`   ${row.status.padEnd(12)} ${count} products`);
    }
    console.log();

    // Article Status
    console.log('📄 ARTICLE STATUS:');
    for (const row of stats.articles) {
      const count = String(row.count).padStart(4);
      const words = row.avg_words ? ` (avg ${Math.round(row.avg_words)} words)` : '';
      const cost = row.total_cost ? ` - Cost: $${parseFloat(row.total_cost).toFixed(2)}` : '';
      console.log(`   ${row.publish_status.padEnd(12)} ${count} articles${words}${cost}`);
    }
    console.log();

    // Cost Summary
    if (stats.costs.total_articles > 0) {
      const totalUsd = parseFloat(stats.costs.total_usd) || 0;
      const avgCost = (totalUsd / stats.costs.total_articles).toFixed(4);
      console.log('💰 COST SUMMARY:');
      console.log(`   Total articles: ${stats.costs.total_articles}`);
      console.log(`   Total cost: $${totalUsd.toFixed(2)} USD`);
      console.log(`   Avg cost/article: $${avgCost} USD`);
      console.log();
    }

    // Price Sync Health
    if (stats.priceSync && stats.priceSync.total > 0) {
      const syncedPercent = Math.round((stats.priceSync.synced_24h / stats.priceSync.total) * 100);
      console.log('🔄 PRICE SYNC HEALTH:');
      console.log(`   Total products: ${stats.priceSync.total}`);
      console.log(`   Synced in 24h: ${stats.priceSync.synced_24h} (${syncedPercent}%)`);
      const lastSync = stats.priceSync.last_sync ? new Date(stats.priceSync.last_sync).toLocaleString() : 'Never';
      console.log(`   Last sync: ${lastSync}`);
      console.log();
    }

    // Recent Pipeline Runs
    if (stats.recentRuns.length > 0) {
      console.log('📊 RECENT PIPELINE RUNS:');
      for (const run of stats.recentRuns) {
        const status = run.status === 'completed' ? '✓' : '✗';
        const startTime = new Date(run.started_at).toLocaleString();
        console.log(`   ${status} [${run.phase}] ${startTime}`);
        if (run.products_fetched > 0 || run.products_failed > 0) {
          console.log(`      Fetch: ${run.products_fetched} OK, ${run.products_failed} failed`);
        }
        if (run.articles_generated > 0 || run.articles_failed > 0) {
          console.log(`      Gen: ${run.articles_generated} OK, ${run.articles_failed} failed`);
        }
        if (run.articles_published > 0 || run.articles_failed_publish > 0) {
          console.log(`      Pub: ${run.articles_published} OK, ${run.articles_failed_publish} failed`);
        }
      }
      console.log();
    }

    // Next Actions
    console.log('📋 NEXT ACTIONS:');
    const pendingProducts = stats.products.find(p => p.status === 'pending');
    if (pendingProducts && pendingProducts.count > 0) {
      console.log(`   • ${pendingProducts.count} products waiting to be fetched`);
    }

    const fetchedProducts = stats.products.find(p => p.status === 'fetched');
    if (fetchedProducts && fetchedProducts.count > 0) {
      console.log(`   • ${fetchedProducts.count} products ready for article generation`);
    }

    const draftArticles = stats.articles.find(a => a.publish_status === 'draft');
    if (draftArticles && draftArticles.count > 0) {
      console.log(`   • ${draftArticles.count} draft articles ready to publish`);
    }

    console.log('\n╚══════════════════════════════════════════════════╝\n');

  } catch (error) {
    logger.error('Failed to display dashboard', { message: error.message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

module.exports = {
  getDashboardStats,
  displayDashboard
};

// Display if run directly
if (require.main === module) {
  displayDashboard();
}
