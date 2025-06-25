#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

/**
 * Extract MCP output schemas from OpenAPI specification
 * This script generates JSON Schema files for use in MCP tool definitions
 */

console.log('🔄 Extracting MCP output schemas from OpenAPI specification...');

try {
  // Read the OpenAPI spec
  const openApiPath = path.join(process.cwd(), 'openapi.json');
  if (!fs.existsSync(openApiPath)) {
    throw new Error('openapi.json not found in project root');
  }

  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  console.log(`📖 Read OpenAPI spec version: ${openApiSpec.info.version}`);

  // Validate required schemas exist
  if (!openApiSpec.components?.schemas?.Profile) {
    throw new Error('Profile schema not found in OpenAPI spec');
  }
  if (!openApiSpec.components?.schemas?.Interest) {
    throw new Error('Interest schema not found in OpenAPI spec');
  }

  // Extract Profile schema
  const profileSchema = openApiSpec.components.schemas.Profile;
  const profileOutputSchema = {
    ...profileSchema,
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Gravatar Profile Response',
    $metadata: {
      generatedAt: new Date().toISOString(),
      openApiVersion: openApiSpec.info.version,
      sourceFile: 'openapi.json',
      description: 'Generated from OpenAPI Profile schema for MCP tool output validation',
    },
  };

  // Extract Interest schema and create wrapper for interests array response
  const interestSchema = openApiSpec.components.schemas.Interest;
  const interestsOutputSchema = {
    type: 'object',
    properties: {
      interests: {
        type: 'array',
        description: 'A list of interests',
        items: interestSchema,
      },
    },
    required: ['interests'],
    description: 'Interests array response structure',
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Gravatar Interests Response',
    $metadata: {
      generatedAt: new Date().toISOString(),
      openApiVersion: openApiSpec.info.version,
      sourceFile: 'openapi.json',
      description: 'Generated wrapper schema for Interest array responses in MCP tools',
    },
  };

  // Create schemas directory
  const schemasDir = path.join(process.cwd(), 'src', 'generated', 'schemas');
  fs.mkdirSync(schemasDir, { recursive: true });
  console.log(`📁 Created schemas directory: ${schemasDir}`);

  // Write Profile schema file
  const profileSchemaPath = path.join(schemasDir, 'profile-output-schema.json');
  fs.writeFileSync(profileSchemaPath, JSON.stringify(profileOutputSchema, null, 2));
  console.log(`✅ Generated: profile-output-schema.json`);

  // Write Interests schema file
  const interestsSchemaPath = path.join(schemasDir, 'interests-output-schema.json');
  fs.writeFileSync(interestsSchemaPath, JSON.stringify(interestsOutputSchema, null, 2));
  console.log(`✅ Generated: interests-output-schema.json`);

  // Summary
  console.log('\n🎉 Schema extraction completed successfully!');
  console.log(`📊 Generated schemas:`);
  console.log(
    `   - Profile schema: ${profileSchema.required?.length || 0} required fields, ${Object.keys(profileSchema.properties || {}).length} total fields`,
  );
  console.log(
    `   - Interest schema: ${interestSchema.required?.length || 0} required fields, ${Object.keys(interestSchema.properties || {}).length} total fields`,
  );
} catch (error) {
  console.error(
    '❌ Schema extraction failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
