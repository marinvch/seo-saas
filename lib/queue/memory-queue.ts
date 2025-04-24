import EventEmitter from 'events';

// Define job types
export const JOB_TYPES = {
  RUN_AUDIT: 'run-audit',
  SCHEDULE_AUDIT: 'schedule-audit',
  GENERATE_REPORT: 'generate-report',
};

interface Job {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

type JobHandler = (job: Job) => Promise<any>;

/**
 * A simple in-memory queue system for background jobs
 * This is a lightweight alternative to BullMQ + Redis for development
 */
class MemoryQueue {
  private static instance: MemoryQueue;
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private emitter: EventEmitter = new EventEmitter();
  private processingCount: number = 0;
  private concurrency: number = 2; // Max concurrent jobs
  private isProcessing: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MemoryQueue {
    if (!MemoryQueue.instance) {
      MemoryQueue.instance = new MemoryQueue();
    }
    return MemoryQueue.instance;
  }

  /**
   * Add a job to the queue
   */
  public async add(type: string, data: any): Promise<Job> {
    const id = this.generateId();
    const job: Job = {
      id,
      type,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    console.log(`Job ${id} (${type}) added to queue`);
    
    // Emit event to trigger processing if not already running
    this.emitter.emit('job_added');
    
    // Start processing if not already
    if (!this.isProcessing) {
      this.processNext();
    }

    return job;
  }

  /**
   * Register a handler for a job type
   */
  public registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
    console.log(`Handler registered for job type: ${type}`);
  }

  /**
   * Get a job by ID
   */
  public getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Update job progress
   */
  public updateProgress(id: string, progress: number): void {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = progress;
      this.emitter.emit('job_progress', job);
    }
  }

  /**
   * Process the next job in the queue
   */
  private async processNext(): Promise<void> {
    if (this.processingCount >= this.concurrency) {
      this.isProcessing = true;
      return;
    }
    
    // Find a pending job
    let pendingJob: Job | undefined;
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        pendingJob = job;
        break;
      }
    }

    if (!pendingJob) {
      // No pending jobs
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.processingCount++;

    // Get the handler for this job type
    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      console.error(`No handler registered for job type: ${pendingJob.type}`);
      pendingJob.status = 'failed';
      pendingJob.error = new Error(`No handler registered for job type: ${pendingJob.type}`);
      this.processingCount--;
      
      // Process next job
      this.processNext();
      return;
    }

    // Update job status
    pendingJob.status = 'processing';
    pendingJob.startedAt = new Date();
    this.emitter.emit('job_started', pendingJob);

    try {
      // Run the handler
      const result = await handler(pendingJob);
      
      // Update job status
      pendingJob.status = 'completed';
      pendingJob.result = result;
      pendingJob.completedAt = new Date();
      pendingJob.progress = 100;
      
      this.emitter.emit('job_completed', pendingJob);
      console.log(`Job ${pendingJob.id} (${pendingJob.type}) completed`);
    } catch (error) {
      // Update job status
      pendingJob.status = 'failed';
      pendingJob.error = error as Error;
      pendingJob.completedAt = new Date();
      
      this.emitter.emit('job_failed', pendingJob);
      console.error(`Job ${pendingJob.id} (${pendingJob.type}) failed:`, error);
    } finally {
      this.processingCount--;
      
      // Process next job
      this.processNext();
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Subscribe to job events
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * Get all jobs
   */
  public getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  public getJobsByStatus(status: Job['status']): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  /**
   * Clear completed and failed jobs to prevent memory leaks
   */
  public cleanupOldJobs(maxAge: number = 3600000): void {  // Default: 1 hour
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        if (job.completedAt && now - job.completedAt.getTime() > maxAge) {
          this.jobs.delete(id);
        }
      }
    }
  }
}

export const memoryQueue = MemoryQueue.getInstance();

/**
 * Setup automatic cleanup of old jobs
 */
if (typeof window === 'undefined') {  // Only run on server
  setInterval(() => {
    memoryQueue.cleanupOldJobs();
  }, 600000);  // Run every 10 minutes
}

/**
 * Helper to create a job handler
 */
export function createJobHandler(type: string, handler: JobHandler): void {
  memoryQueue.registerHandler(type, handler);
}