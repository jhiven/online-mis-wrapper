import fs from "node:fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Date")
);
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull());
const BLOB = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Blob")
);

const ast = await openapiTS(new URL(process.env.OPENAPI_URL ?? ""), {
  transform(schemaObject) {
    if (schemaObject.format === "date-time") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([DATE, NULL])
        : DATE;
    }
    if (schemaObject.format === "binary") {
      return {
        schema: schemaObject.nullable
          ? ts.factory.createUnionTypeNode([BLOB, NULL])
          : BLOB,
        questionToken: true,
      };
    }
  },
});

const contents = astToString(ast);

fs.writeFileSync(__dirname + "/openapi-schema.ts", contents);
