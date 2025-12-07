// Use these request functions from "./sdk.gen.ts" or "./index.ts":
//
//   /**
//    * Generate images from text prompts
//    *
//    * Creates one or more images from a text prompt using GPT Image-1 models
//    */
//   export function createImageGeneration(opts: CreateImageGenerationData): Promise<{
//     error?: CreateImageGenerationErrors[keyof CreateImageGenerationErrors],
//     data?: CreateImageGenerationResponses[keyof CreateImageGenerationResponses],
//     request: Request,
//     response: Response }>;
//
//
// NOTICE: Please use default values from original openapi schema:
//
//    {
//      "openapi": "3.0.3",
//      "info": {
//        "title": "CREAO Text2Img API",
//        "description": "API for generating and editing images using Gemini nano banana",
//        "version": "1.0.0"
//      },
//      "servers": [
//        {
//          "url": "https://api-production.creao.ai/execute-apis/v2",
//          "description": "Production server"
//        }
//      ],
//      "paths": {
//        "/official-api/gen-img": {
//          "post": {
//            "summary": "Generate images from text prompts",
//            "description": "Creates one or more images from a text prompt using GPT Image-1 models",
//            "operationId": "createImageGeneration",
//            "requestBody": {
//              "required": true,
//              "content": {
//                "application/json": {
//                  "schema": {
//                    "type": "object",
//                    "required": [
//                      "prompt"
//                    ],
//                    "properties": {
//                      "prompt": {
//                        "type": "string",
//                        "description": "Text description of the desired image. The maximum length is 32,000 characters.",
//                        "maxLength": 32000,
//                        "example": "A futuristic cityscape at sunset with flying cars"
//                      }
//                    }
//                  },
//                  "examples": {
//                    "basic": {
//                      "summary": "Basic image generation",
//                      "value": {
//                        "prompt": "a photo of an astronaut riding a horse on mars",
//                        "n": 1,
//                        "size": "1024x1024",
//                        "output_format": "png"
//                      }
//                    }
//                  }
//                }
//              }
//            },
//            "responses": {
//              "200": {
//                "description": "Images successfully generated",
//                "content": {
//                  "application/json": {
//                    "schema": {
//                      "type": "object",
//                      "properties": {
//                        "created": {
//                          "type": "integer",
//                          "description": "Unix timestamp (in seconds) when the image was created."
//                        },
//                        "data": {
//                          "type": "array",
//                          "description": "List of generated images",
//                          "items": {
//                            "type": "object",
//                            "properties": {
//                              "url": {
//                                "type": "string",
//                                "description": "image url"
//                              }
//                            }
//                          }
//                        }
//                      }
//                    }
//                  }
//                }
//              },
//              "400": {
//                "description": "Bad request - invalid parameters"
//              },
//              "401": {
//                "description": "Unauthorized - invalid or missing token"
//              },
//              "429": {
//                "description": "Rate limit exceeded"
//              },
//              "500": {
//                "description": "Internal server error"
//              }
//            },
//            "parameters": [
//              {
//                "$ref": "#/components/parameters/CreaoApiNameHeader"
//              },
//              {
//                "$ref": "#/components/parameters/CreaoApiPathHeader"
//              },
//              {
//                "$ref": "#/components/parameters/CreaoApiIdHeader"
//              }
//            ]
//          }
//        }
//      },
//      "components": {
//        "parameters": {
//          "CreaoApiNameHeader": {
//            "name": "X-CREAO-API-NAME",
//            "in": "header",
//            "required": true,
//            "schema": {
//              "type": "string",
//              "default": "NanoBanana"
//            },
//            "description": "API name identifier - must be \"NanoBanana\""
//          },
//          "CreaoApiIdHeader": {
//            "name": "X-CREAO-API-ID",
//            "in": "header",
//            "required": true,
//            "schema": {
//              "type": "string",
//              "default": "68f874c693fecd38dba9b929"
//            },
//            "description": "API ID identifier - must be \"68f874c693fecd38dba9b929\""
//          },
//          "CreaoApiPathHeader": {
//            "name": "X-CREAO-API-PATH",
//            "in": "header",
//            "required": true,
//            "schema": {
//              "type": "string",
//              "default": "/official-api/gen-img"
//            },
//            "description": "API path identifier - must be \"/official-api/gen-img\""
//          }
//        }
//      }
//    }
//
// 

export type ClientOptions = {
    baseUrl: 'https://api-production.creao.ai/execute-apis/v2' | (string & {});
};

/**
 * API name identifier - must be "NanoBanana"
 */
export type CreaoApiNameHeader = string;

/**
 * API ID identifier - must be "68f874c693fecd38dba9b929"
 */
export type CreaoApiIdHeader = string;

/**
 * API path identifier - must be "/official-api/gen-img"
 */
export type CreaoApiPathHeader = string;

export type CreateImageGenerationData = {
    body: {
        /**
         * Text description of the desired image. The maximum length is 32,000 characters.
         */
        prompt: string;
    };
    headers: {
        /**
         * API name identifier - must be "NanoBanana"
         */
        'X-CREAO-API-NAME': string;
        /**
         * API path identifier - must be "/official-api/gen-img"
         */
        'X-CREAO-API-PATH': string;
        /**
         * API ID identifier - must be "68f874c693fecd38dba9b929"
         */
        'X-CREAO-API-ID': string;
    };
    path?: never;
    query?: never;
    url: '/official-api/gen-img';
};

export type CreateImageGenerationErrors = {
    /**
     * Bad request - invalid parameters
     */
    400: unknown;
    /**
     * Unauthorized - invalid or missing token
     */
    401: unknown;
    /**
     * Rate limit exceeded
     */
    429: unknown;
    /**
     * Internal server error
     */
    500: unknown;
};

export type CreateImageGenerationResponses = {
    /**
     * Images successfully generated
     */
    200: {
        /**
         * Unix timestamp (in seconds) when the image was created.
         */
        created?: number;
        /**
         * List of generated images
         */
        data?: Array<{
            /**
             * image url
             */
            url?: string;
        }>;
    };
};

export type CreateImageGenerationResponse = CreateImageGenerationResponses[keyof CreateImageGenerationResponses];
