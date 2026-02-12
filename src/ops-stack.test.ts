/**
 * Tests for the Ops Stack
 */

import { describe, it, expect } from "vitest";
import { createOpsStack, createDefaultOpsStackConfig } from "./ops-stack.js";

describe("OpsStack", () => {
  describe("createDefaultOpsStackConfig", () => {
    it("should create a valid default configuration", () => {
      const config = createDefaultOpsStackConfig();

      expect(config.marketIntelligence.enabled).toBe(true);
      expect(config.notifications.enabled).toBe(true);
      expect(config.automation.enabled).toBe(true);
      expect(config.monetization.enabled).toBe(true);
      expect(config.aiEngine.enabled).toBe(true);
    });
  });

  describe("createOpsStack", () => {
    it("should create and initialize an ops stack instance", async () => {
      const opsStack = await createOpsStack();

      expect(opsStack).toBeDefined();
      expect(opsStack.getMarketIntelligence()).toBeDefined();
      expect(opsStack.getNotifications()).toBeDefined();
      expect(opsStack.getAutomation()).toBeDefined();
      expect(opsStack.getMonetization()).toBeDefined();
      expect(opsStack.getAIEngine()).toBeDefined();

      await opsStack.shutdown();
    });

    it("should accept partial configuration overrides", async () => {
      const opsStack = await createOpsStack({
        notifications: {
          enabled: false,
        },
      });

      expect(opsStack).toBeDefined();
      await opsStack.shutdown();
    });

    it("should return metrics", async () => {
      const opsStack = await createOpsStack();
      const metrics = await opsStack.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.modules).toBeDefined();
      expect(metrics.health).toBe("healthy");

      await opsStack.shutdown();
    });
  });

  describe("MarketIntelligence", () => {
    it("should fetch market data", async () => {
      const opsStack = await createOpsStack();
      const marketIntelligence = opsStack.getMarketIntelligence();

      const data = await marketIntelligence.getMarketData();

      expect(data).toBeDefined();
      expect(data.timestamp).toBeInstanceOf(Date);
      expect(data.metrics).toBeDefined();
      expect(data.trends).toBeInstanceOf(Array);

      await opsStack.shutdown();
    });

    it("should analyze trends", async () => {
      const opsStack = await createOpsStack();
      const marketIntelligence = opsStack.getMarketIntelligence();

      const trends = await marketIntelligence.analyzeTrends();

      expect(trends).toBeInstanceOf(Array);

      await opsStack.shutdown();
    });
  });

  describe("Notifications", () => {
    it("should send notifications", async () => {
      const opsStack = await createOpsStack();
      const notifications = opsStack.getNotifications();

      const notificationId = await notifications.send({
        type: "test",
        message: "Test notification",
        recipient: "test@example.com",
        channel: "email",
      });

      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe("string");

      await opsStack.shutdown();
    });

    it("should retrieve notifications", async () => {
      const opsStack = await createOpsStack();
      const notifications = opsStack.getNotifications();

      await notifications.send({
        type: "test",
        message: "Test 1",
        recipient: "test@example.com",
        channel: "email",
      });

      await notifications.send({
        type: "test",
        message: "Test 2",
        recipient: "test@example.com",
        channel: "email",
      });

      const allNotifications = await notifications.getNotifications();
      expect(allNotifications.length).toBe(2);

      const limitedNotifications = await notifications.getNotifications(1);
      expect(limitedNotifications.length).toBe(1);

      await opsStack.shutdown();
    });
  });

  describe("Automation", () => {
    it("should create and execute tasks", async () => {
      const opsStack = await createOpsStack();
      const automation = opsStack.getAutomation();

      let executed = false;
      const taskId = await automation.createTask("test-task", async () => {
        executed = true;
        return { result: "success" };
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe("string");

      // Wait a bit for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(executed).toBe(true);

      const task = await automation.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.status).toBe("completed");

      await opsStack.shutdown();
    });

    it("should list all tasks", async () => {
      const opsStack = await createOpsStack();
      const automation = opsStack.getAutomation();

      await automation.createTask("task1", async () => ({ result: "1" }));
      await automation.createTask("task2", async () => ({ result: "2" }));

      const tasks = await automation.listTasks();
      expect(tasks.length).toBe(2);

      await opsStack.shutdown();
    });

    it("should handle task failures", async () => {
      const opsStack = await createOpsStack();
      const automation = opsStack.getAutomation();

      const taskId = await automation.createTask("failing-task", async () => {
        throw new Error("Task failed");
      });

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      const task = await automation.getTask(taskId);
      expect(task?.status).toBe("failed");
      expect(task?.error).toBeDefined();

      await opsStack.shutdown();
    });
  });

  describe("Monetization", () => {
    it("should create subscriptions", async () => {
      const opsStack = await createOpsStack();
      const monetization = opsStack.getMonetization();

      const subscriptionId = await monetization.createSubscription("user-123", "pro", 99.99);

      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe("string");

      const subscription = await monetization.getSubscription(subscriptionId);
      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe("user-123");
      expect(subscription?.amount).toBe(99.99);

      await opsStack.shutdown();
    });

    it("should calculate revenue metrics", async () => {
      const opsStack = await createOpsStack();
      const monetization = opsStack.getMonetization();

      await monetization.createSubscription("user-1", "basic", 9.99);
      await monetization.createSubscription("user-2", "pro", 19.99);

      const metrics = await monetization.getRevenueMetrics();

      expect(metrics.totalRevenue).toBeCloseTo(29.98);
      expect(metrics.activeSubscriptions).toBe(2);
      expect(metrics.averageRevenuePerUser).toBeCloseTo(14.99);

      await opsStack.shutdown();
    });
  });

  describe("AIEngine", () => {
    it("should process AI requests", async () => {
      const opsStack = await createOpsStack();
      const aiEngine = opsStack.getAIEngine();

      const response = await aiEngine.processRequest("test prompt");

      expect(response).toBeDefined();
      expect(response.requestId).toBeDefined();
      expect(response.content).toContain("test prompt");
      expect(response.tokensUsed).toBeGreaterThan(0);

      await opsStack.shutdown();
    });

    it("should track request metrics", async () => {
      const opsStack = await createOpsStack();
      const aiEngine = opsStack.getAIEngine();

      await aiEngine.processRequest("prompt 1");
      await aiEngine.processRequest("prompt 2");

      const metrics = await aiEngine.getMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.completedRequests).toBe(2);
      expect(metrics.failedRequests).toBe(0);

      await opsStack.shutdown();
    });

    it("should retrieve request by id", async () => {
      const opsStack = await createOpsStack();
      const aiEngine = opsStack.getAIEngine();

      const response = await aiEngine.processRequest("test");
      const request = await aiEngine.getRequest(response.requestId);

      expect(request).toBeDefined();
      expect(request?.status).toBe("completed");

      await opsStack.shutdown();
    });
  });
});
