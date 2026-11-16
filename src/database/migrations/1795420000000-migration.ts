import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1795420000000 implements MigrationInterface {
	name = 'migration1795420000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// What each request was last notified about, so every request gets
		// its own notifications even when several watch the same route.
		await queryRunner.query(
			`ALTER TABLE "train-request" ADD "lastNotified" text DEFAULT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "train-request" DROP COLUMN "lastNotified"`,
		);
	}
}
