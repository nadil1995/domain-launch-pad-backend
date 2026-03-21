const logger = require('../utils/logger');
const cron = require('node-cron');
const pool = require('../db/pool');

const paApi = require('../fetcher/pa-api');
const reviewGenerator = require('../generator/review-generator');
const wpPublisher = require('../publisher/wp-publisher');

// Parse CLI arguments (supports both --key value and --key=value formats)
const args = process.argv.slice(2);
const runNow = args.includes('--now');
const publishLive = args.includes('--publish-live');

let fetchLimit = 10;
let generateLimit = 5;
let publishLimit = 5;

for (let i = 0; i < args.length; i++) {
  // Support --key=value format
  if (args[i].includes('=')) {
    const [key, value] = args[i].split('=');
    if (key === '--fetch') fetchLimit = parseInt(value);
    if (key === '--generate') generateLimit = parseInt(value);
    if (key === '--publish') publishLimit = parseInt(value);
  }
  // Support --key value format
  if (args[i] === '--fetch' && args[i + 1]) fetchLimit = parseInt(args[i + 1]);
  if (args[i] === '--generate' && args[i + 1]) generateLimit = parseInt(args[i + 1]);
  if (args[i] === '--publish' && args[i + 1]) publishLimit = parseInt(args[i + 1]);
}

async function runPipeline() {
  const pipelineRunId = null;

  try {
    // Create pipeline run record
    const runResult = await pool.query(
      `INSERT INTO pipeline_runs (phase, status, started_at)
       VALUES ('full', 'running', NOW())
       RETURNING id`
    );
    const pipelineRunId = runResult.rows[0].id;

    logger.info(`Starting pipeline run: ${pipelineRunId}`);

    // PHASE 1: Fetch from PA API
    logger.info(`=== PHASE 1: Fetching products (limit: ${fetchLimit})`);
    let fetchStats = { fetched: 0, failed: 0 };

    if (fetchLimit > 0) {
      try {
        paApi.buildClient();
        fetchStats = await paApi.fetchPendingProducts(fetchLimit);
        logger.info(`Fetch complete: ${fetchStats.fetched} succeeded, ${fetchStats.failed} failed`);
      } catch (error) {
        logger.error('Fetch phase failed', { message: error.message });
        fetchStats.failed = fetchLimit;
      }
    }

    // PHASE 2: Generate articles using Claude
    logger.info(`=== PHASE 2: Generating articles (limit: ${generateLimit})`);
    let generateStats = { generated: 0, failed: 0 };

    if (generateLimit > 0) {
      try {
        generateStats = await reviewGenerator.generatePendingArticles(generateLimit);
        logger.info(`Generation complete: ${generateStats.generated} succeeded, ${generateStats.failed} failed`);
      } catch (error) {
        logger.error('Generation phase failed', { message: error.message });
        generateStats.failed = generateLimit;
      }
    }

    // PHASE 3: Publish to WordPress
    logger.info(`=== PHASE 3: Publishing articles (limit: ${publishLimit})`);
    let publishStats = { published: 0, failed: 0 };

    if (publishLimit > 0) {
      try {
        publishStats = await wpPublisher.publishPendingArticles(publishLimit, publishLive);
        logger.info(`Publish complete: ${publishStats.published} succeeded, ${publishStats.failed} failed`);
      } catch (error) {
        logger.error('Publish phase failed', { message: error.message });
        publishStats.failed = publishLimit;
      }
    }

    // Update pipeline run record
    await pool.query(
      `UPDATE pipeline_runs
       SET status = 'completed',
           products_fetched = $1,
           products_failed = $2,
           articles_generated = $3,
           articles_failed = $4,
           articles_published = $5,
           articles_failed_publish = $6,
           completed_at = NOW()
       WHERE id = $7`,
      [
        fetchStats.fetched,
        fetchStats.failed,
        generateStats.generated,
        generateStats.failed,
        publishStats.published,
        publishStats.failed,
        pipelineRunId
      ]
    );

    logger.info(`Pipeline complete! Stats: Fetched ${fetchStats.fetched}, Generated ${generateStats.generated}, Published ${publishStats.published}`);

  } catch (error) {
    logger.error('Pipeline failed', { message: error.message });

    if (pipelineRunId) {
      await pool.query(
        `UPDATE pipeline_runs
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [error.message, pipelineRunId]
      );
    }

    process.exit(1);
  }
}

function startScheduler() {
  logger.info('Starting pipeline scheduler');

  const cronFetch = process.env.CRON_FETCH || '0 2 * * *';
  const cronGenerate = process.env.CRON_GENERATE || '15 2 * * *';
  const cronPublish = process.env.CRON_PUBLISH || '30 2 * * *';
  const cronPriceSync = process.env.CRON_PRICE_SYNC || '0 6 * * *';

  // Schedule product fetching
  cron.schedule(cronFetch, async () => {
    logger.info('=== CRON: Starting fetch job');
    try {
      const paApi_inst = require('../fetcher/pa-api');
      const stats = await paApi_inst.fetchPendingProducts(10);
      logger.info(`Fetch job complete: ${stats.fetched} fetched, ${stats.failed} failed`);
    } catch (error) {
      logger.error('Fetch job failed', { message: error.message });
    }
  });
  logger.info(`Scheduled fetch job: ${cronFetch}`);

  // Schedule article generation
  cron.schedule(cronGenerate, async () => {
    logger.info('=== CRON: Starting generation job');
    try {
      const reviewGen = require('../generator/review-generator');
      const stats = await reviewGen.generatePendingArticles(5);
      logger.info(`Generation job complete: ${stats.generated} generated, ${stats.failed} failed`);
    } catch (error) {
      logger.error('Generation job failed', { message: error.message });
    }
  });
  logger.info(`Scheduled generation job: ${cronGenerate}`);

  // Schedule publishing
  cron.schedule(cronPublish, async () => {
    logger.info('=== CRON: Starting publish job');
    try {
      const wpPub = require('../publisher/wp-publisher');
      const stats = await wpPub.publishPendingArticles(5, false);
      logger.info(`Publish job complete: ${stats.published} published, ${stats.failed} failed`);
    } catch (error) {
      logger.error('Publish job failed', { message: error.message });
    }
  });
  logger.info(`Scheduled publish job: ${cronPublish}`);

  // Schedule price sync
  cron.schedule(cronPriceSync, async () => {
    logger.info('=== CRON: Starting price sync job');
    try {
      const priceSync = require('../fetcher/price-sync');
      const stats = await priceSync.syncPrices();
      logger.info(`Price sync job complete: ${stats.synced} synced, ${stats.failed} failed`);
    } catch (error) {
      logger.error('Price sync job failed', { message: error.message });
    }
  });
  logger.info(`Scheduled price sync job: ${cronPriceSync}`);

  logger.info('All cron jobs scheduled. Scheduler running.');

  // Keep process alive
  process.stdin.resume();
}

// Main entry point
if (runNow) {
  logger.info('Running pipeline immediately (--now flag detected)');
  runPipeline().finally(() => {
    process.exit(0);
  });
} else {
  startScheduler();
}

module.exports = {
  runPipeline,
  startScheduler
};
