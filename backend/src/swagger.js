const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ROBOX Robot Fleet API",
      version: "1.0.0",
      description: "API for managing the ROBOX Robot Fleet",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API Key authentication. Use 'robox-secret-key'",
        },
      },
      schemas: {
        Robot: {
          type: "object",
          required: ["name", "status", "battery", "location", "model"],
          properties: {
            id: {
              type: "string",
              description: "The auto-generated id of the robot",
            },
            name: {
              type: "string",
              description: "Name of the robot",
            },
            status: {
              type: "string",
              enum: ["active", "idle", "error"],
              description: "Current status of the robot",
            },
            battery: {
              type: "number",
              description: "Battery percentage (0-100)",
            },
            location: {
              type: "string",
              description: "Current location of the robot",
            },
            model: {
              type: "string",
              description: "Model type of the robot",
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    tags: [
      {
        name: "Robots",
        description: "Endpoints for managing robots",
      },
    ],
    paths: {
      "/robots": {
        get: {
          tags: ["Robots"],
          summary: "Get all robots",
          description: "Retrieve a list of all robots.",
          parameters: [
            {
              name: "status",
              in: "query",
              description: "Filter by robot status",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "location",
              in: "query",
              description: "Filter by robot location",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "A list of robots",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Robot" },
                      },
                    },
                  },
                },
              },
            },
            500: { description: "Internal server error" },
          },
        },
        post: {
          tags: ["Robots"],
          summary: "Add a new robot",
          description: "Create a new robot.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Robot" },
                example: {
                  name: "Robot X",
                  status: "active",
                  battery: 90,
                  location: "Warehouse A",
                  model: "RX-200",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Robot" },
                },
              },
            },
            400: { description: "Bad Request" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/robots/{id}": {
        get: {
          tags: ["Robots"],
          summary: "Get a robot by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Robot" },
                },
              },
            },
            404: { description: "Not Found" },
            500: { description: "Internal server error" },
          },
        },
        put: {
          tags: ["Robots"],
          summary: "Update robot fields",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["active", "idle", "error"],
                    },
                    battery: { type: "number" },
                    location: { type: "string" },
                    model: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Robot" },
                },
              },
            },
            400: { description: "Bad Request" },
            404: { description: "Not Found" },
            500: { description: "Internal server error" },
          },
        },
        delete: {
          tags: ["Robots"],
          summary: "Delete a robot",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: { $ref: "#/components/schemas/Robot" },
                    },
                  },
                },
              },
            },
            404: { description: "Not Found" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
