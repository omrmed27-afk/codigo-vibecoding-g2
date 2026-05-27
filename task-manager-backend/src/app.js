import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import taskRoutes from './tasks/task.routes.js';
import userRoutes from './users/user.routes.js';
import swaggerSpec from './docs/swagger.js';
import authenticate from './middleware/auth.middleware.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/tasks', authenticate, taskRoutes);
app.use('/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
