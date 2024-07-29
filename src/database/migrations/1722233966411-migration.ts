import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1722233966411 implements MigrationInterface {
    name = 'migration1722233966411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "train-position-info" DROP CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1"`);
        await queryRunner.query(`ALTER TABLE "train-type-info" DROP CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f"`);
        await queryRunner.query(`ALTER TABLE "train-request" ALTER COLUMN "placeTypes" SET DEFAULT '{Купе,Плацкарт}'`);
        await queryRunner.query(`ALTER TABLE "train-request" ALTER COLUMN "placePositions" SET DEFAULT '{верх,низ}'`);
        await queryRunner.query(`ALTER TABLE "train-type-info" ALTER COLUMN "type" SET DEFAULT 'Плацкарт'`);
        await queryRunner.query(`ALTER TABLE "train-position-info" ADD CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1" FOREIGN KEY ("typeId") REFERENCES "train-type-info"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "train-type-info" ADD CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f" FOREIGN KEY ("infoId") REFERENCES "train-info"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "train-type-info" DROP CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f"`);
        await queryRunner.query(`ALTER TABLE "train-position-info" DROP CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1"`);
        await queryRunner.query(`ALTER TABLE "train-type-info" ALTER COLUMN "type" SET DEFAULT 'Плацкарт'-type-info_type_enum"`);
        await queryRunner.query(`ALTER TABLE "train-request" ALTER COLUMN "placePositions" SET DEFAULT '{верх,низ}'-request_placepositions_enum"[]`);
        await queryRunner.query(`ALTER TABLE "train-request" ALTER COLUMN "placeTypes" SET DEFAULT '{Купе,Плацкарт}'-request_placetypes_enum"[]`);
        await queryRunner.query(`ALTER TABLE "train-type-info" ADD CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f" FOREIGN KEY ("infoId") REFERENCES "train-info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "train-position-info" ADD CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1" FOREIGN KEY ("typeId") REFERENCES "train-type-info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
