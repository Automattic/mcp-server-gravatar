#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

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

// Configuration for schemas to extract
const schemaConfigs: SchemaConfig[] = [
  {
    modelName: 'Profile',
    outputFileName: 'profile-output-schema',
    // No wrapInArray - use schema directly
  },
  {
    modelName: 'Interest',
    outputFileName: 'interests-output-schema',
    wrapInArray: {
      propertyName: 'interests',
      description: 'A list of interests',
    },
  },
];

console.log('🔄 Extracting MCP output schemas from OpenAPI specification...');

try {
  // Read the OpenAPI spec
  const openApiPath = path.join(process.cwd(), 'openapi.json');
  if (!fs.existsSync(openApiPath)) {
    throw new Error('openapi.json not found in project root');
  }

  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  console.log(`📖 Read OpenAPI spec version: ${openApiSpec.info.version}`);

  // Validate all required schemas exist
  for (const config of schemaConfigs) {
    if (!openApiSpec.components?.schemas?.[config.modelName]) {
      throw new Error(`${config.modelName} schema not found in OpenAPI spec`);
    }
  }

  // Create schemas directory
  const schemasDir = path.join(process.cwd(), 'src', 'generated', 'schemas');
  fs.mkdirSync(schemasDir, { recursive: true });
  console.log(`📁 Created schemas directory: ${schemasDir}`);

  const generatedSchemas: Array<{ name: string; requiredFields: number; totalFields: number }> = [];

  // Process each schema configuration
  for (const config of schemaConfigs) {
    const sourceSchema = openApiSpec.components.schemas[config.modelName];

    let outputSchema;

    if (config.wrapInArray) {
      // Create array wrapper schema
      outputSchema = {
        type: 'object',
        properties: {
          [config.wrapInArray.propertyName]: {
            type: 'array',
            description:
              config.wrapInArray.description || `A list of ${config.modelName.toLowerCase()}s`,
            items: sourceSchema,
          },
        },
        required: [config.wrapInArray.propertyName],
      };
    } else {
      // Use schema directly
      outputSchema = {
        ...sourceSchema,
      };
    }

    // Write schema file
    const schemaPath = path.join(schemasDir, `${config.outputFileName}.json`);
    fs.writeFileSync(schemaPath, JSON.stringify(outputSchema, null, 2));
    console.log(`✅ Generated: ${config.outputFileName}.json`);

    // Track for summary
    generatedSchemas.push({
      name: config.modelName,
      requiredFields: sourceSchema.required?.length || 0,
      totalFields: Object.keys(sourceSchema.properties || {}).length,
    });
  }

  // Summary
  console.log('\n🎉 Schema extraction completed successfully!');
  console.log(`📊 Generated ${generatedSchemas.length} schemas:`);
  for (const schema of generatedSchemas) {
    console.log(
      `   - ${schema.name} schema: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
    );
  }
} catch (error) {
  console.error(
    '❌ Schema extraction failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
