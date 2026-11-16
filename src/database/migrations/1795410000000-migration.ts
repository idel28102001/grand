import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1795410000000 implements MigrationInterface {
	name = 'migration1795410000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Request option: side seats (боковые) do not count.
		await queryRunner.query(
			`ALTER TABLE "train-request" ADD "excludeSide" boolean NOT NULL DEFAULT false`,
		);
		// Side-seat check of a search snapshot, so the train page is not
		// loaded again while the search numbers stay the same.
		await queryRunner.query(
			`ALTER TABLE "train-position-info" ADD "sideSpots" integer DEFAULT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-position-info" ADD "noSideSpots" integer DEFAULT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "train-position-info" DROP COLUMN "noSideSpots"`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-position-info" DROP COLUMN "sideSpots"`,
		);
		await queryRunner.query(
			`ALTER TABLE "train-request" DROP COLUMN "excludeSide"`,
		);
	}
}
