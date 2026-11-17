import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1795430000000 implements MigrationInterface {
	name = 'migration1795430000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Request option: look for seats only in these sections (1–9).
		await queryRunner.query(
			`ALTER TABLE "train-request" ADD "sectionFrom" integer DEFAULT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-request" ADD "sectionTo" integer DEFAULT NULL`,
		);
		// Free seats from the train page, per class of a search snapshot.
		// Replaces the side-seat counts: every request filters these itself.
		await queryRunner.query(
			`ALTER TABLE "train-type-info" ADD "freeSeats" jsonb DEFAULT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-position-info" DROP COLUMN IF EXISTS "sideSpots"`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-position-info" DROP COLUMN IF EXISTS "noSideSpots"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "train-position-info" ADD "noSideSpots" integer DEFAULT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-position-info" ADD "sideSpots" integer DEFAULT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-type-info" DROP COLUMN "freeSeats"`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-request" DROP COLUMN "sectionTo"`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-request" DROP COLUMN "sectionFrom"`,
		);
	}
}
