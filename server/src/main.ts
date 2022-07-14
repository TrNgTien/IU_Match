import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.client_email,
      projectId: process.env.project_id,
      privateKey: process.env.private_key.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.databaseURL,
  });
  console.log(admin.SDK_VERSION);
  await app.listen(5000);
  console.log(`Server is running on port http://localhost:5000`);
}
bootstrap();
