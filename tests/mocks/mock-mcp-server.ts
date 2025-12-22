/**
 * Mock MCP Server for Integration Testing
 *
 * Simulates PostgreSQL, Notion, and other MCP servers for testing
 * without requiring actual external connections.
 */

import * as http from 'http';

/**
 * MCP Request structure
 */
interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP Response structure
 */
interface MCPResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Mock data for PostgreSQL queries
 */
const MOCK_POSTGRES_DATA = {
  users: [
    { id: 1, name: 'Test User 1', email: 'user1@example.com', created_at: '2024-01-01' },
    { id: 2, name: 'Test User 2', email: 'user2@example.com', created_at: '2024-01-02' },
    { id: 3, name: 'Test User 3', email: 'user3@example.com', created_at: '2024-01-03' },
  ],
  orders: [
    { id: 1, user_id: 1, total: 9999, status: 'completed', created_at: '2024-01-15' },
    { id: 2, user_id: 1, total: 4999, status: 'pending', created_at: '2024-01-16' },
    { id: 3, user_id: 2, total: 14999, status: 'completed', created_at: '2024-01-17' },
  ],
  products: [
    { id: 1, name: 'Product A', price: 2999, stock: 100 },
    { id: 2, name: 'Product B', price: 4999, stock: 50 },
    { id: 3, name: 'Product C', price: 9999, stock: 25 },
  ],
};

/**
 * Mock data for Notion pages
 */
const MOCK_NOTION_DATA = {
  pages: [
    {
      id: 'page-1',
      title: 'Project Roadmap',
      content: 'Q1 Goals: Launch MVP...',
      last_edited: '2024-01-15T10:00:00Z',
    },
    {
      id: 'page-2',
      title: 'Meeting Notes',
      content: 'Discussed architecture decisions...',
      last_edited: '2024-01-16T14:30:00Z',
    },
    {
      id: 'page-3',
      title: 'Technical Specs',
      content: 'API endpoints documentation...',
      last_edited: '2024-01-17T09:00:00Z',
    },
  ],
  databases: [
    { id: 'db-1', title: 'Tasks', item_count: 42 },
    { id: 'db-2', title: 'Team Members', item_count: 8 },
  ],
};

/**
 * Handle PostgreSQL MCP requests
 */
function handlePostgresRequest(request: MCPRequest): MCPResponse {
  const { method, params } = request;

  switch (method) {
    case 'list_tables':
      return {
        result: {
          tables: Object.keys(MOCK_POSTGRES_DATA),
        },
      };

    case 'describe_table':
      const tableName = params?.table as string;
      if (tableName && MOCK_POSTGRES_DATA[tableName as keyof typeof MOCK_POSTGRES_DATA]) {
        const sample = MOCK_POSTGRES_DATA[tableName as keyof typeof MOCK_POSTGRES_DATA][0];
        return {
          result: {
            columns: Object.keys(sample).map((key) => ({
              name: key,
              type: typeof sample[key as keyof typeof sample],
            })),
          },
        };
      }
      return {
        error: { code: 404, message: `Table '${tableName}' not found` },
      };

    case 'query':
      const sql = (params?.sql as string)?.toLowerCase() || '';

      // Simple SQL parsing for mock responses
      // Check COUNT first before other SELECT queries
      if (sql.includes('count(*)')) {
        return { result: { rows: [{ count: 42 }] } };
      }
      if (sql.includes('select') && sql.includes('from users')) {
        return { result: { rows: MOCK_POSTGRES_DATA.users } };
      }
      if (sql.includes('select') && sql.includes('from orders')) {
        return { result: { rows: MOCK_POSTGRES_DATA.orders } };
      }
      if (sql.includes('select') && sql.includes('from products')) {
        return { result: { rows: MOCK_POSTGRES_DATA.products } };
      }

      return { result: { rows: [] } };

    default:
      return {
        error: { code: 400, message: `Unknown method: ${method}` },
      };
  }
}

/**
 * Handle Notion MCP requests
 */
function handleNotionRequest(request: MCPRequest): MCPResponse {
  const { method, params } = request;

  switch (method) {
    case 'search':
      const query = (params?.query as string)?.toLowerCase() || '';
      const results = MOCK_NOTION_DATA.pages.filter(
        (page) =>
          page.title.toLowerCase().includes(query) || page.content.toLowerCase().includes(query)
      );
      return { result: { pages: results } };

    case 'get_page':
      const pageId = params?.page_id as string;
      const page = MOCK_NOTION_DATA.pages.find((p) => p.id === pageId);
      if (page) {
        return { result: page };
      }
      return {
        error: { code: 404, message: `Page '${pageId}' not found` },
      };

    case 'list_databases':
      return { result: { databases: MOCK_NOTION_DATA.databases } };

    case 'create_page':
      const newPage = {
        id: `page-${Date.now()}`,
        title: (params?.title as string) || 'Untitled',
        content: (params?.content as string) || '',
        last_edited: new Date().toISOString(),
      };
      MOCK_NOTION_DATA.pages.push(newPage);
      return { result: newPage };

    default:
      return {
        error: { code: 400, message: `Unknown method: ${method}` },
      };
  }
}

/**
 * Create a mock MCP server instance
 */
export function createMockMCPServer(
  serverType: 'postgres' | 'notion',
  port: number = 0
): Promise<{ server: http.Server; port: number; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const request: MCPRequest = JSON.parse(body);
          let response: MCPResponse;

          if (serverType === 'postgres') {
            response = handlePostgresRequest(request);
          } else if (serverType === 'notion') {
            response = handleNotionRequest(request);
          } else {
            response = { error: { code: 400, message: 'Unknown server type' } };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: { code: 400, message: 'Invalid request' },
            })
          );
        }
      });
    });

    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;

      resolve({
        server,
        port: actualPort,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((err) => {
              if (err) rejectClose(err);
              else resolveClose();
            });
          }),
      });
    });

    server.on('error', reject);
  });
}

/**
 * Mock MCP Client for testing
 */
export class MockMCPClient {
  private serverType: 'postgres' | 'notion';

  constructor(serverType: 'postgres' | 'notion') {
    this.serverType = serverType;
  }

  async call(method: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    const request: MCPRequest = { method, params };

    if (this.serverType === 'postgres') {
      return handlePostgresRequest(request);
    } else if (this.serverType === 'notion') {
      return handleNotionRequest(request);
    }

    return { error: { code: 400, message: 'Unknown server type' } };
  }
}

/**
 * Get mock PostgreSQL client
 */
export function getMockPostgresClient(): MockMCPClient {
  return new MockMCPClient('postgres');
}

/**
 * Get mock Notion client
 */
export function getMockNotionClient(): MockMCPClient {
  return new MockMCPClient('notion');
}
