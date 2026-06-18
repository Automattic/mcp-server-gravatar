#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import configData from './schemas.config.json' with { type: 'json' };

/**
 * Extract MCP output schemas from OpenAPI specification
 * This script generates JSON Schema files for use in MCP tool definitions
 */

interface SchemaConfig {
  modelName: string; // OpenAPI schema name (e.g., "Profile", "Interest")
  outputFileName: string; // Output file name (e.g., "profile-output-schema")
  wrapInArray?: {
    // Optional array wrapper
    propertyName: string; // Property name for the array (e.g., "interests")
    description?: string; // Description for the array property
  };
}

interface JsonSchema {
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: JsonSchema;
  [key: string]: unknown; // Allow additional JSON Schema properties
}

interface OpenApiSpec {
  info: {
    version: string;
  };
  components: {
    schemas: Record<string, JsonSchema>;
  };
}

/**
 * Load and parse the OpenAPI specification
 */
function loadOpenApiSpec(): OpenApiSpec {
  const openApiPath = path.join(process.cwd(), 'openapi.json');
  if (!fs.existsSync(openApiPath)) {
    throw new Error('openapi.json not found in project root');
  }

  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8')) as OpenApiSpec;
  console.log(`📖 Read OpenAPI spec version: ${openApiSpec.info.version}`);
  return openApiSpec;
}

/**
 * Validate that all required schemas exist in the OpenAPI spec
 */
function validateSchemas(openApiSpec: OpenApiSpec, configs: SchemaConfig[]): void {
  for (const config of configs) {
    if (!openApiSpec.components?.schemas?.[config.modelName]) {
      throw new Error(`${config.modelName} schema not found in OpenAPI spec`);
    }
  }
}

/**
 * Convert a single lower_snake_case property name to lowerCamelCase.
 *
 * This mirrors the casing convention used by the OpenAPI client generator
 * (openapi-generator-cli), whose ...FromJSON functions expose camelCase keys
 * (e.g. display_name -> displayName, verified_accounts -> verifiedAccounts).
 * Already-camelCase or single-word keys are returned unchanged.
 */
export function camelizeKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

/**
 * Recursively convert all property names in a JSON Schema from snake_case to
 * camelCase so the generated output schema matches the runtime objects produced
 * by the OpenAPI client (see camelizeKey). The transform walks the full JSON
 * Schema shape:
 *   - object `properties` keys are renamed and their subschemas recursed into
 *   - entries in `required` arrays are renamed
 *   - array `items` subschemas are recursed into
 *   - nested inline object subschemas are recursed into
 *
 * `$ref` values are left untouched: they reference component schema names, not
 * data property keys. The input is not mutated; a new schema object is returned.
 */
export function camelizeSchema<T>(schema: T): T {
  if (Array.isArray(schema)) {
    return schema.map(entry => camelizeSchema(entry)) as unknown as T;
  }

  if (schema === null || typeof schema !== 'object') {
    return schema;
  }

  const source = schema as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (key === 'properties' && value && typeof value === 'object' && !Array.isArray(value)) {
      // Rename each property key, recursing into its subschema.
      const renamed: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(value as Record<string, unknown>)) {
        renamed[camelizeKey(propName)] = camelizeSchema(propSchema);
      }
      result[key] = renamed;
    } else if (key === 'required' && Array.isArray(value)) {
      // Rename each required field name.
      result[key] = (value as unknown[]).map(entry =>
        typeof entry === 'string' ? camelizeKey(entry) : entry,
      );
    } else if (value && typeof value === 'object') {
      // Recurse into nested subschemas (items, inline objects, arrays, etc.).
      // `$ref` is a string and falls through to the else branch untouched.
      result[key] = camelizeSchema(value);
    } else {
      result[key] = value;
    }
  }

  return result as unknown as T;
}

/**
 * Generate output schema from source schema and configuration
 */
function generateSchema(sourceSchema: JsonSchema, config: SchemaConfig): JsonSchema {
  // Match the OpenAPI client generator's camelCase key convention so the
  // generated output schema validates the camelCase objects returned at runtime.
  const camelizedSource = camelizeSchema(sourceSchema);

  if (config.wrapInArray) {
    // Create array wrapper schema
    return {
      type: 'object',
      properties: {
        [config.wrapInArray.propertyName]: {
          type: 'array',
          description:
            config.wrapInArray.description || `A list of ${config.modelName.toLowerCase()}s`,
          items: camelizedSource,
        },
      },
      required: [config.wrapInArray.propertyName],
    };
  } else {
    // Use schema directly
    return {
      ...camelizedSource,
    };
  }
}

/**
 * Write schema to file
 */
function writeSchemaFile(schema: JsonSchema, outputFileName: string, schemasDir: string): void {
  const schemaPath = path.join(schemasDir, `${outputFileName}.json`);
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Generated: ${outputFileName}.json`);
}

/**
 * Create schemas directory if it doesn't exist
 */
function ensureSchemasDirectory(): string {
  const schemasDir = path.join(process.cwd(), 'src', 'generated', 'schemas');
  fs.mkdirSync(schemasDir, { recursive: true });
  console.log(`📁 Created schemas directory: ${schemasDir}`);
  return schemasDir;
}

/**
 * Print summary of generated schemas
 */
function printSummary(
  generatedSchemas: Array<{ name: string; requiredFields: number; totalFields: number }>,
): void {
  console.log('\n🎉 Schema extraction completed successfully!');
  console.log(`📊 Generated ${generatedSchemas.length} schemas:`);
  for (const schema of generatedSchemas) {
    console.log(
      `   - ${schema.name} schema: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
    );
  }
}

// Main execution
async function main(): Promise<void> {
  console.log('🔄 Extracting MCP output schemas from OpenAPI specification...');

  try {
    // Load configuration from external file
    const schemaConfigs: SchemaConfig[] = configData.schemas;

    // Load and validate OpenAPI spec
    const openApiSpec = loadOpenApiSpec();
    validateSchemas(openApiSpec, schemaConfigs);

    // Prepare output directory
    const schemasDir = ensureSchemasDirectory();

    const generatedSchemas: Array<{ name: string; requiredFields: number; totalFields: number }> =
      [];

    // Process each schema configuration
    for (const config of schemaConfigs) {
      const sourceSchema = openApiSpec.components.schemas[config.modelName];
      const outputSchema = generateSchema(sourceSchema, config);

      writeSchemaFile(outputSchema, config.outputFileName, schemasDir);

      // Track for summary
      generatedSchemas.push({
        name: config.modelName,
        requiredFields: sourceSchema.required?.length || 0,
        totalFields: Object.keys(sourceSchema.properties || {}).length,
      });
    }

    printSummary(generatedSchemas);
  } catch (error) {
    console.error(
      '❌ Schema extraction failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script only when executed directly, not when imported (e.g. by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
