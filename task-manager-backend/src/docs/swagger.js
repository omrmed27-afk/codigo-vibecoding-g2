const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
    description: 'REST API para gestión de tareas con PostgreSQL y Prisma v7',
  },
  servers: [
    { url: 'http://localhost:3000' },
  ],
  paths: {
    '/users/register': {
      post: {
        summary: 'Registrar un nuevo usuario',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          409: {
            description: 'El email ya está en uso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthToken' },
              },
            },
          },
          401: {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'Listar todas las tareas',
        tags: ['Tasks'],
        responses: {
          200: {
            description: 'Lista de tareas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear una tarea',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tarea creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        summary: 'Obtener detalle de una tarea',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Tarea encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: {
            description: 'Tarea no encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Actualizar una tarea',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tarea actualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: {
            description: 'Tarea no encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Eliminar una tarea',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: {
            description: 'Tarea eliminada',
          },
          404: {
            description: 'Tarea no encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          name: { type: 'string', example: 'María' },
          lastname: { type: 'string', example: 'García' },
          email: { type: 'string', format: 'email', example: 'maria@example.com' },
          created_at: { type: 'string', format: 'date-time', example: '2026-05-13T10:00:00.000Z' },
        },
      },
      UserRegisterInput: {
        type: 'object',
        required: ['name', 'lastname', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'María' },
          lastname: { type: 'string', example: 'García' },
          email: { type: 'string', format: 'email', example: 'maria@example.com' },
          password: { type: 'string', format: 'password', example: 'miPassword123' },
        },
      },
      UserLoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'maria@example.com' },
          password: { type: 'string', format: 'password', example: 'miPassword123' },
        },
      },
      AuthToken: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'a3f8c2d1e9b4...' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          title: { type: 'string', example: 'Comprar víveres' },
          description: { type: 'string', example: 'Leche, huevos, pan' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'done'], example: 'pending' },
          created_at: { type: 'string', format: 'date-time', example: '2026-05-05T10:00:00.000Z' },
        },
      },
      TaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Comprar víveres' },
          description: { type: 'string', example: 'Leche, huevos, pan' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'done'], example: 'pending' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Task not found' },
        },
      },
    },
  },
};

export default swaggerSpec;
