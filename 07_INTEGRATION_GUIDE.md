# CloudPeers Integration Guide

## Overview

Complete guide for integrating the Events Platform with CloudPeers MCP (Model Context Protocol), enabling AI-to-AI service orchestration and discovery.

## Integration Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  CloudPeers Platform                       │
│  https://services.cloudpeers.com                          │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Registry   │  │ Marketplace  │  │  Observability  │ │
│  │   Service    │  │   Service    │  │    Service      │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│         │                  │                   │          │
└─────────┼──────────────────┼───────────────────┼──────────┘
          │                  │                   │
          │ Registration     │ Discovery         │ Metrics
          │                  │                   │
┌─────────▼──────────────────▼───────────────────▼──────────┐
│            Events Platform Service                         │
│  https://events.redheli.com                               │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  MCP Webhook Handler (/api/webhooks/mcp)            │ │
│  │  - Verify webhook signatures                         │ │
│  │  - Handle agent invocations                          │ │
│  │  - Process metric thresholds                         │ │
│  │  - Report service health                             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Metrics Reporter                                    │ │
│  │  - Event creation metrics                            │ │
│  │  - Registration metrics                              │ │
│  │  - Gallery access metrics                            │ │
│  │  - Performance metrics                               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Webhook Implementation

### Webhook Handler

**File**: `/gallery/src/app/api/webhooks/mcp/route.ts`

```typescript
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { handleAgentInvocation } from '@/lib/mcp/agent-handler';
import { handleMetricThreshold } from '@/lib/mcp/metric-handler';
import { recordMetric } from '@/lib/mcp/metrics';

/**
 * Verify webhook signature from CloudPeers
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    return (
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer)
    );
  } catch {
    return false;
  }
}

/**
 * MCP Webhook Handler
 * Receives events from CloudPeers platform
 */
export async function POST(req: NextRequest) {
  try {
    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('x-cloudpeers-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const secret = process.env.CLOUDPEERS_WEBHOOK_SECRET!;
    if (!verifyWebhookSignature(body, signature, secret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(body);
    const { event_type, payload, timestamp } = event;

    console.log(`[MCP] Received event: ${event_type}`, { timestamp });

    // Handle different event types
    switch (event_type) {
      case 'agent.invoked':
        // Another agent is calling our service
        const result = await handleAgentInvocation(payload);
        await recordMetric('agent_invocations', 1, {
          source: payload.source_agent,
          capability: payload.capability
        });
        return NextResponse.json(result);

      case 'metric.threshold':
        // Usage threshold reached
        await handleMetricThreshold(payload);
        return NextResponse.json({ acknowledged: true });

      case 'service.discovered':
        // User viewed our service in marketplace
        await recordMetric('service_discoveries', 1, {
          source: payload.source,
          user_id: payload.user_id
        });
        return NextResponse.json({ acknowledged: true });

      case 'context.created':
        // New MCP context created
        console.log('[MCP] New context created:', payload.context_id);
        return NextResponse.json({ acknowledged: true });

      case 'health_check':
        // Platform health check
        return NextResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0'
        });

      default:
        console.warn(`[MCP] Unknown event type: ${event_type}`);
        return NextResponse.json({ acknowledged: true });
    }

  } catch (error) {
    console.error('[MCP] Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: 'Red Helicopter Events',
    version: '1.0.0',
    webhook: 'active',
    timestamp: new Date().toISOString()
  });
}
```

### Agent Invocation Handler

**File**: `/gallery/src/lib/mcp/agent-handler.ts`

```typescript
import { createEvent } from '@/lib/events/create';
import { registerUser } from '@/lib/events/register';
import { createGallery } from '@/lib/gallery/create';
import { authorizeGalleryAccess } from '@/lib/gallery/authorize';

export interface AgentInvocationPayload {
  context_id: string;
  source_agent: string;
  capability: string;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Handle agent invocation from CloudPeers
 */
export async function handleAgentInvocation(
  payload: AgentInvocationPayload
) {
  const { capability, parameters, source_agent } = payload;

  console.log(`[Agent] Invocation from ${source_agent}: ${capability}`);

  try {
    switch (capability) {
      case 'event.create':
        return await handleEventCreate(parameters);

      case 'event.register':
        return await handleEventRegister(parameters);

      case 'gallery.create':
        return await handleGalleryCreate(parameters);

      case 'gallery.authorize':
        return await handleGalleryAuthorize(parameters);

      case 'event.analytics':
        return await handleEventAnalytics(parameters);

      default:
        return {
          error: 'Unknown capability',
          capability,
          supported: [
            'event.create',
            'event.register',
            'gallery.create',
            'gallery.authorize',
            'event.analytics'
          ]
        };
    }
  } catch (error) {
    console.error(`[Agent] Error handling ${capability}:`, error);
    return {
      error: 'Capability execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle event.create capability
 */
async function handleEventCreate(params: any) {
  const { eventConfig, templateOptions } = params;

  const event = await createEvent(eventConfig, templateOptions);

  return {
    eventId: event.id,
    eventUrl: event.url,
    registrationUrl: `${event.url}#register`,
    qrCodeUrl: `${event.url}/qr.png`,
    albumId: event.albumId
  };
}

/**
 * Handle event.register capability
 */
async function handleEventRegister(params: any) {
  const { eventId, userData } = params;

  const registration = await registerUser(eventId, userData);

  return {
    registrationId: registration.id,
    confirmationSent: registration.emailSent,
    galleryAccess: registration.galleryAccessGranted
  };
}

/**
 * Handle gallery.create capability
 */
async function handleGalleryCreate(params: any) {
  const { eventId, albumName, albumDescription } = params;

  const gallery = await createGallery(eventId, albumName, albumDescription);

  return {
    albumId: gallery.id,
    uploadUrl: gallery.uploadUrl,
    galleryUrl: gallery.viewUrl
  };
}

/**
 * Handle gallery.authorize capability
 */
async function handleGalleryAuthorize(params: any) {
  const { email, albumId } = params;

  const auth = await authorizeGalleryAccess(email, albumId);

  return {
    authorized: auth.authorized,
    magicLinkSent: auth.magicLinkSent,
    accessToken: auth.accessToken
  };
}

/**
 * Handle event.analytics capability
 */
async function handleEventAnalytics(params: any) {
  const { eventId, metrics } = params;

  // Fetch analytics from database
  const analytics = await getEventAnalytics(eventId, metrics);

  return analytics;
}
```

## Metrics Reporting

### Metrics Reporter

**File**: `/gallery/src/lib/mcp/metrics.ts`

```typescript
const CLOUDPEERS_API_BASE = 'https://services.cloudpeers.com/api';

export interface MetricData {
  metric_type: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Record metric to CloudPeers observability API
 */
export async function recordMetric(
  metricType: string,
  value: number,
  metadata?: Record<string, any>
): Promise<void> {
  const serviceId = process.env.CLOUDPEERS_SERVICE_ID;
  const apiKey = process.env.CLOUDPEERS_API_KEY;

  if (!serviceId || !apiKey) {
    console.warn('[Metrics] CloudPeers credentials not configured');
    return;
  }

  const metricData: MetricData = {
    metric_type: metricType,
    value,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  };

  try {
    const response = await fetch(
      `${CLOUDPEERS_API_BASE}/observability/services/${serviceId}/metrics`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(metricData)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Metrics] Failed to record metric:', error);
    }
  } catch (error) {
    console.error('[Metrics] Error recording metric:', error);
  }
}

/**
 * Batch record multiple metrics
 */
export async function recordMetricsBatch(
  metrics: MetricData[]
): Promise<void> {
  const serviceId = process.env.CLOUDPEERS_SERVICE_ID;
  const apiKey = process.env.CLOUDPEERS_API_KEY;

  if (!serviceId || !apiKey) return;

  try {
    const response = await fetch(
      `${CLOUDPEERS_API_BASE}/observability/services/${serviceId}/metrics/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ metrics })
      }
    );

    if (!response.ok) {
      console.error('[Metrics] Batch upload failed');
    }
  } catch (error) {
    console.error('[Metrics] Error in batch upload:', error);
  }
}
```

### Automatic Metric Tracking

**File**: `/gallery/src/lib/mcp/auto-metrics.ts`

```typescript
import { recordMetric } from './metrics';

/**
 * Middleware to auto-track API requests
 */
export function withMetrics<T>(
  handler: (...args: any[]) => Promise<T>,
  metricName: string
) {
  return async (...args: any[]): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await handler(...args);

      // Record success metric
      await recordMetric(metricName, 1, {
        duration_ms: Date.now() - startTime,
        status: 'success'
      });

      return result;
    } catch (error) {
      // Record failure metric
      await recordMetric(`${metricName}_errors`, 1, {
        duration_ms: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown'
      });

      throw error;
    }
  };
}

// Usage example:
export const createEvent = withMetrics(
  async (config: EventConfig) => {
    // Event creation logic
  },
  'events_created'
);
```

## Service Discovery

### Agent Card

**File**: `/gallery/public/.well-known/agent.json`

```json
{
  "agent_id": "cloudpeers-events-platform-001",
  "name": "CloudPeers Events",
  "version": "1.0.0",
  "description": "Event management platform with landing pages, registration system, and private photo galleries",
  "capabilities": [
    {
      "name": "event.create",
      "description": "Create a new event from template configuration",
      "parameters": {
        "eventConfig": {
          "type": "object",
          "required": true,
          "description": "Event configuration including branding, venue, and schedule"
        },
        "templateOptions": {
          "type": "object",
          "required": false,
          "description": "Template customization options"
        }
      },
      "response": {
        "eventId": "string",
        "eventUrl": "string",
        "registrationUrl": "string",
        "qrCodeUrl": "string"
      }
    },
    {
      "name": "event.register",
      "description": "Register a user for an event",
      "parameters": {
        "eventId": "string",
        "userData": "object"
      }
    },
    {
      "name": "gallery.create",
      "description": "Create a private photo gallery for an event",
      "parameters": {
        "eventId": "string",
        "albumName": "string",
        "albumDescription": "string"
      }
    },
    {
      "name": "gallery.authorize",
      "description": "Authorize user access to photo gallery via magic link",
      "parameters": {
        "email": "string",
        "albumId": "string"
      }
    }
  ],
  "semantic_tags": {
    "personas": ["event-organizer", "community-builder"],
    "experiences": ["event-management", "photo-sharing"],
    "capabilities": ["template-generation", "user-authentication"],
    "domains": ["event-planning", "community-engagement"]
  },
  "endpoints": {
    "webhook": "https://events-api.cloudpeers.com/api/webhooks/mcp",
    "health": "https://events-api.cloudpeers.com/api/health",
    "docs": "https://docs.cloudpeers.com/events"
  },
  "pricing": {
    "model": "token-based",
    "unit": "events",
    "cost_per_unit": 10
  },
  "support": {
    "email": "events-support@cloudpeers.com",
    "docs": "https://docs.cloudpeers.com/events",
    "status": "https://status.cloudpeers.com"
  }
}
```

## Testing Integration

### Test Webhook

```bash
# Test webhook signature verification
curl -X POST https://events.redheli.com/api/webhooks/mcp \
  -H "Content-Type: application/json" \
  -H "x-cloudpeers-signature: sha256=$(echo -n '{"event_type":"health_check"}' | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)" \
  -d '{"event_type":"health_check"}'
```

### Test Agent Invocation

```bash
# Test event.create capability
curl -X POST https://events.redheli.com/api/webhooks/mcp \
  -H "Content-Type: application/json" \
  -H "x-cloudpeers-signature: $SIGNATURE" \
  -d '{
    "event_type": "agent.invoked",
    "payload": {
      "context_id": "test-context-123",
      "source_agent": "test-agent",
      "capability": "event.create",
      "parameters": {
        "eventConfig": {
          "branding": {...},
          "event": {...},
          "venue": {...}
        }
      }
    }
  }'
```

### Test Metrics

```bash
# Manually record test metric
curl -X POST https://services.cloudpeers.com/api/observability/services/$SERVICE_ID/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "metric_type": "test_metric",
    "value": 1,
    "metadata": {"test": true}
  }'
```

## Monitoring

### View Service Metrics

```bash
# Get all metrics
curl https://services.cloudpeers.com/api/observability/services/$SERVICE_ID/metrics \
  -H "Authorization: Bearer $API_KEY"

# Get A2A interactions
curl https://services.cloudpeers.com/api/observability/services/$SERVICE_ID/interactions \
  -H "Authorization: Bearer $API_KEY"
```

### Dashboards

Access CloudPeers dashboards:
- **Service Dashboard**: `https://services.cloudpeers.com/admin/services/$SERVICE_ID`
- **Metrics**: `https://services.cloudpeers.com/api/observability/services/$SERVICE_ID/metrics`
- **Marketplace**: `https://services.cloudpeers.com/marketplace`

## Next Steps

1. Register service with CloudPeers
2. Implement webhook handler
3. Set up metrics reporting
4. Test agent invocations
5. Publish to marketplace

## Related Documentation

- **01_SERVICE_REGISTRATION.md** - Service registration details
- **02_SERVICE_ARCHITECTURE.md** - Overall architecture
- **06_DEPLOYMENT_WORKFLOW.md** - Deployment pipeline
