'use strict';

const fp = require('fastify-plugin');
const fastifySchedule = require('@fastify/schedule');
const { AsyncTask, SimpleIntervalJob, CronJob } = require('toad-scheduler');

async function schedulerPlugin(fastify, options) {
  // Register the fastify/schedule plugin
  fastify.register(fastifySchedule);
  
  // Add helper for creating and scheduling cron jobs
  fastify.decorate('createCronJob', (name, cronExpression, taskFn) => {
    const task = new AsyncTask(
      name,
      async () => {
        fastify.log.info(`Running scheduled task: ${name}`);
        try {
          await taskFn();
          fastify.log.info(`Task "${name}" completed successfully`);
        } catch (error) {
          fastify.log.error(`Error in scheduled task ${name}: ${error.message}`);
        }
      },
      (err) => {
        fastify.log.error(`Task "${name}" failed with error: ${err.message}`);
      }
    );
    
    const job = new CronJob(
      { cronExpression, timezone: process.env.TIMEZONE || 'UTC' },
      task
    );
    
    // Add job to scheduler
    fastify.scheduler.addJob(job);
    fastify.log.info(`Task "${name}" scheduled with cron expression: ${cronExpression}`);
    
    return job;
  });
  
  // Add helper for creating and scheduling interval jobs
  fastify.decorate('createIntervalJob', (name, intervalMs, taskFn) => {
    const task = new AsyncTask(
      name,
      async () => {
        fastify.log.info(`Running interval task: ${name}`);
        try {
          await taskFn();
          fastify.log.info(`Task "${name}" completed successfully`);
        } catch (error) {
          fastify.log.error(`Error in interval task ${name}: ${error.message}`);
        }
      },
      (err) => {
        fastify.log.error(`Task "${name}" failed with error: ${err.message}`);
      }
    );
    
    const job = new SimpleIntervalJob(
      { milliseconds: intervalMs, runImmediately: false },
      task
    );
    
    // Add job to scheduler
    fastify.scheduler.addJob(job);
    fastify.log.info(`Task "${name}" scheduled to run every ${intervalMs}ms`);
    
    return job;
  });
  
  // Add helper for stopping a job
  fastify.decorate('stopJob', (job) => {
    if (job) {
      fastify.scheduler.removeById(job.id);
      fastify.log.info(`Job stopped and removed: ${job.id}`);
      return true;
    }
    return false;
  });
}

module.exports = fp(schedulerPlugin, {
  name: 'scheduler-plugin',
  dependencies: ['@fastify/schedule']
});