import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export class Config {
	private config: ConfigService;

	constructor() {
		this.config = new ConfigService();
	}

	get isDevelopment() {
		return this.get<string>('NODE_ENV') === 'development';
	}

	public get<T = any>(propertyPath: string, defaultValue?: T) {
		return this.config.get(propertyPath, defaultValue);
	}

	public getDatabaseOptions(): DataSourceOptions {
		return {
			type: 'postgres',
			host: this.get('POSTGRES_HOST'),
			port: Number(this.get('POSTGRES_PORT')),
			username: this.get('POSTGRES_USER'),
			password: this.get('POSTGRES_PASSWORD'),
			database: this.get('POSTGRES_DB'),
			entities: [__dirname + '/../**/**/*.entity{.ts,.js}'],
			migrations: [__dirname + '/../**/**/*-migration{.ts,.js}'],
			synchronize: false,
		};
	}
}

export const config = new Config();
