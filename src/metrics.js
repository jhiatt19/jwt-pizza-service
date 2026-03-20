const config = require("./config");
const os = require("os");

let totalRequests = 0;
let totalGetRequests = 0;
let totalPutRequests = 0;
let totalPostRequests = 0;
let totalDeleteRequests = 0;
let pizzaSales = 0;
let authAttemptsSuccessful = 0;
let authAttemptsFailure = 0;
let failedPizzaCreations = 0;
let activeUsers = new Set();
let endpointLatency = 0;
let pizzaLatency = 0;
let totalRevenue = 0;

function recordUserActivity(userId) {
  activeUsers.add(userId);
}

function incrementFailedPizzas() {
  failedPizzaCreations++;
}

function incrementAuthAttemptsSuccessful() {
  authAttemptsSuccessful++;
}

function incrementAuthAttemptsFailure() {
  authAttemptsFailure++;
}

function incrementRequests(type, ms = 0) {
  if (type == "all") {
    totalRequests++;
    endpointLatency += ms;
  } else if (type == "GET") {
    totalGetRequests++;
  } else if (type == "POST") {
    totalPostRequests++;
  } else if (type == "DELETE") {
    totalDeleteRequests++;
  } else if (type == "PUT") {
    totalPutRequests++;
  }
}
function recordPizzaSale(ms, price) {
  pizzaSales++;
  pizzaLatency += ms;
  totalRevenue += price;
}

// function sendMetricsPeriodically(period) {
//   const timer = setInterval(() => {
//     try {
//       const metrics = new OtelMetricBuilder();
//       metrics.add(httpMetrics);
//       metrics.add(systemMetrics);
//       metrics.add(userMetrics);
//       metrics.add(purchaseMetrics);
//       metrics.add(authMetrics);

//       metrics.sendToGrafana();
//     } catch (error) {
//       console.log("Error sending metrics", error);
//     }
//   }, period);
// }

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function getActiveUserCount() {
  const count = activeUsers.size;
  activeUsers.clear();
  return count;
}

function sendMetricsToGrafana() {
  const now = Date.now() * 1000000;
  const metrics = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: "http_requests_total",
                unit: "1",
                sum: {
                  dataPoints: [
                    {
                      asInt: totalRequests,
                      timeUnixNano: now,
                      attributes: [
                        { key: "method", value: { stringValue: "all" } },
                      ],
                    },
                    {
                      asInt: totalGetRequests,
                      timeUnixNano: now,
                      attributes: [
                        { key: "method", value: { stringValue: "GET" } },
                      ],
                    },
                    {
                      asInt: totalPostRequests,
                      timeUnixNano: now,
                      attributes: [
                        { key: "method", value: { stringValue: "POST" } },
                      ],
                    },
                    {
                      asInt: totalDeleteRequests,
                      timeUnixNano: now,
                      attributes: [
                        { key: "method", value: { stringValue: "DELETE" } },
                      ],
                    },
                    {
                      asInt: totalPutRequests,
                      timeUnixNano: now,
                      attributes: [
                        { key: "method", value: { stringValue: "PUT" } },
                      ],
                    },
                  ],
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                  isMonotonic: true,
                },
              },
              {
                name: "pizzas_sold_total",
                unit: "1",
                sum: {
                  dataPoints: [
                    {
                      asInt: pizzaSales,
                      timeUnixNano: now,
                      attributes: [
                        { key: "result", value: { stringValue: "SUCCESS" } },
                      ],
                    },
                    {
                      asInt: failedPizzaCreations,
                      timeUnixNano: now,
                      attributes: [
                        { key: "result", value: { stringValue: "FAILURE" } },
                      ],
                    },
                  ],
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                  isMonotonic: true,
                },
              },
              {
                name: "pizza_revenue",
                unit: "usd",
                sum: {
                  dataPoints: [
                    { asInt: Math.floor(totalRevenue), timeUnixNano: now },
                  ],
                  isMonotonic: true,
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                },
              },
              {
                name: "system_cpu_percent",
                unit: "%",
                gauge: {
                  dataPoints: [
                    { asDouble: getCpuUsagePercentage(), timeUnixNano: now },
                  ],
                },
              },
              {
                name: "system_memory_usuage",
                unit: "%",
                gauge: {
                  dataPoints: [
                    { asDouble: getMemoryUsagePercentage(), timeUnixNano: now },
                  ],
                },
              },
              {
                name: "active_users",
                unit: "1",
                gauge: {
                  dataPoints: [
                    {
                      asInt: getActiveUserCount(),
                      timeUnixNano: now,
                    },
                  ],
                },
              },
              {
                name: "total_auth_attempts",
                unit: "1",
                sum: {
                  dataPoints: [
                    {
                      asInt: authAttemptsSuccessful,
                      timeUnixNano: now,
                      attributes: [
                        { key: "result", value: { stringValue: "Success" } },
                      ],
                    },
                    {
                      asInt: authAttemptsFailure,
                      timeUnixNano: now,
                      attributes: [
                        { key: "result", value: { stringValue: "Failure" } },
                      ],
                    },
                  ],
                },
              },
              {
                name: "http_request_duration_ms",
                unit: "ms",
                sum: {
                  dataPoints: [
                    {
                      asInt: endpointLatency, // The 'ms' you've been adding up
                      timeUnixNano: now,
                    },
                  ],
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                  isMonotonic: true,
                },
              },
              {
                name: "pizza_request_duration_ms",
                unit: "ms",
                sum: {
                  dataPoints: [
                    {
                      asInt: pizzaLatency, // The 'ms' you've been adding up
                      timeUnixNano: now,
                    },
                  ],
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                  isMonotonic: true,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const body = JSON.stringify(metrics);
  fetch(`${config.endpointUrl}`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: `Bearer ${config.accountId}:${config.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(
            `Failed to push metrics data to Grafana: ${text}\n${body}`,
          );
        });
      } else {
        console.log(`Pushed metrics`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

// orderRouter.post('/', (req, res) => {
//     if (purchase pizza from factory) {
//       metrics.pizzaPurchase(success, latency, price);
//     } else {
//       metrics.pizzaPurchase(failure, latency, 0);
//     }
//   }
// );

setInterval(sendMetricsToGrafana, 10000);

module.exports = {
  incrementRequests,
  recordPizzaSale,
  incrementAuthAttemptsSuccessful,
  incrementAuthAttemptsFailure,
  incrementFailedPizzas,
  recordUserActivity,
};

//"https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/metrics"
