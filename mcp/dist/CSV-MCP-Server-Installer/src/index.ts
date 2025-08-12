#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { z } from 'zod';

interface CSVRow {
  [key: string]: string;
}

class CSVMCPServer {
  private server: Server;
  private csvFilePath: string;
  private csvData: CSVRow[] = [];
  private columns: string[] = [];
  private isDataLoaded = false;

  constructor() {
    this.server = new Server(
      {
        name: 'csv-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.csvFilePath = path.join(process.cwd(), 'Rawdata_Total.csv');
    this.setupToolHandlers();
  }

  private async loadCSVData(): Promise<void> {
    if (this.isDataLoaded) return;

    try {
      await fs.access(this.csvFilePath);
      
      this.csvData = [];
      return new Promise((resolve, reject) => {
        createReadStream(this.csvFilePath)
          .pipe(csv())
          .on('headers', (headers) => {
            this.columns = headers;
          })
          .on('data', (row) => {
            this.csvData.push(row);
          })
          .on('end', () => {
            this.isDataLoaded = true;
            console.error(`Loaded ${this.csvData.length} rows from CSV`);
            resolve();
          })
          .on('error', reject);
      });
    } catch (error) {
      throw new Error(`CSV file not found at ${this.csvFilePath}. Please place your Rawdata_Total.csv file in the project root.`);
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read-csv',
            description: 'Read and display CSV contents with optional pagination',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of rows to return',
                  default: 10,
                },
                offset: {
                  type: 'number',
                  description: 'Number of rows to skip',
                  default: 0,
                },
              },
            },
          },
          {
            name: 'search-csv',
            description: 'Search for specific values in the CSV data',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term to look for',
                },
                column: {
                  type: 'string',
                  description: 'Specific column to search in (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'csv-info',
            description: 'Get information about the CSV file structure and columns',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'csv-stats',
            description: 'Get statistical analysis of a specific column',
            inputSchema: {
              type: 'object',
              properties: {
                column: {
                  type: 'string',
                  description: 'Name of the column to analyze',
                },
              },
              required: ['column'],
            },
          },
          {
            name: 'filter-csv',
            description: 'Filter CSV data based on column values',
            inputSchema: {
              type: 'object',
              properties: {
                column: {
                  type: 'string',
                  description: 'Name of the column to filter by',
                },
                value: {
                  type: 'string',
                  description: 'Value to filter for (partial match)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                },
              },
              required: ['column', 'value'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.loadCSVData();

      switch (request.params.name) {
        case 'read-csv':
          return await this.handleReadCSV(request.params.arguments);
        case 'search-csv':
          return await this.handleSearchCSV(request.params.arguments);
        case 'csv-info':
          return await this.handleCSVInfo();
        case 'csv-stats':
          return await this.handleCSVStats(request.params.arguments);
        case 'filter-csv':
          return await this.handleFilterCSV(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleReadCSV(args: any) {
    const limit = args?.limit || 10;
    const offset = args?.offset || 0;
    
    const slice = this.csvData.slice(offset, offset + limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total_rows: this.csvData.length,
            showing_rows: slice.length,
            offset: offset,
            columns: this.columns,
            data: slice,
          }, null, 2),
        },
      ],
    };
  }

  private async handleSearchCSV(args: any) {
    const query = args.query.toLowerCase();
    const column = args.column;
    const limit = args.limit || 10;
    
    let results: CSVRow[];
    
    if (column) {
      if (!this.columns.includes(column)) {
        throw new Error(`Column '${column}' not found. Available columns: ${this.columns.join(', ')}`);
      }
      results = this.csvData.filter(row => 
        row[column]?.toLowerCase().includes(query)
      );
    } else {
      results = this.csvData.filter(row =>
        Object.values(row).some(value =>
          value?.toLowerCase().includes(query)
        )
      );
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            column: column || 'all',
            total_matches: results.length,
            showing_results: Math.min(results.length, limit),
            results: results.slice(0, limit),
          }, null, 2),
        },
      ],
    };
  }

  private async handleCSVInfo() {
    const sampleSize = Math.min(5, this.csvData.length);
    const sample = this.csvData.slice(0, sampleSize);
    
    const columnInfo = this.columns.map(col => {
      const values = this.csvData.map(row => row[col]).filter(v => v !== '' && v !== null && v !== undefined);
      const uniqueValues = [...new Set(values)].slice(0, 10);
      const isNumeric = values.every(v => !isNaN(Number(v)) && v !== '');
      
      return {
        name: col,
        type: isNumeric ? 'numeric' : 'text',
        unique_values_sample: uniqueValues,
        non_empty_count: values.length,
      };
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            file_path: this.csvFilePath,
            total_rows: this.csvData.length,
            total_columns: this.columns.length,
            columns: columnInfo,
            sample_data: sample,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCSVStats(args: any) {
    const column = args.column;
    
    if (!this.columns.includes(column)) {
      throw new Error(`Column '${column}' not found. Available columns: ${this.columns.join(', ')}`);
    }
    
    const values = this.csvData
      .map(row => row[column])
      .filter(v => v !== '' && v !== null && v !== undefined);
    
    const numericValues = values
      .map(v => Number(v))
      .filter(v => !isNaN(v));
    
    if (numericValues.length === 0) {
      const uniqueValues = [...new Set(values)];
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              column: column,
              type: 'text',
              total_values: values.length,
              unique_values: uniqueValues.length,
              most_common: this.getMostCommon(values, 10),
            }, null, 2),
          },
        ],
      };
    }
    
    numericValues.sort((a, b) => a - b);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            column: column,
            type: 'numeric',
            count: numericValues.length,
            min: numericValues[0],
            max: numericValues[numericValues.length - 1],
            average: avg,
            median: this.getMedian(numericValues),
            sum: sum,
          }, null, 2),
        },
      ],
    };
  }

  private async handleFilterCSV(args: any) {
    const column = args.column;
    const value = args.value.toLowerCase();
    const limit = args.limit || 10;
    
    if (!this.columns.includes(column)) {
      throw new Error(`Column '${column}' not found. Available columns: ${this.columns.join(', ')}`);
    }
    
    const results = this.csvData.filter(row =>
      row[column]?.toLowerCase().includes(value)
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            column: column,
            filter_value: args.value,
            total_matches: results.length,
            showing_results: Math.min(results.length, limit),
            results: results.slice(0, limit),
          }, null, 2),
        },
      ],
    };
  }

  private getMostCommon(arr: string[], limit: number): Array<{ value: string; count: number }> {
    const counts: { [key: string]: number } = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  }

  private getMedian(arr: number[]): number {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CSV MCP server running on stdio');
  }
}

const server = new CSVMCPServer();
server.run().catch(console.error);
