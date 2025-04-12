import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1743978885078 implements MigrationInterface {
    name = 'migration1743978885078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."train-position-info_position_enum" AS ENUM('верх', 'низ', 'места')`);
        await queryRunner.query(`CREATE TABLE "train-position-info" ("id" SERIAL NOT NULL, "spots" integer NOT NULL DEFAULT '0', "position" "public"."train-position-info_position_enum" NOT NULL, "typeId" integer, CONSTRAINT "PK_295950c9eb02ed517b4e73604ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."train-type-info_type_enum" AS ENUM('Купе', 'Плацкарт', 'Люкс', 'СВ')`);
        await queryRunner.query(`CREATE TABLE "train-type-info" ("id" SERIAL NOT NULL, "price" double precision NOT NULL DEFAULT '0', "type" "public"."train-type-info_type_enum" NOT NULL DEFAULT 'Плацкарт', "infoId" integer, CONSTRAINT "PK_3bd1cca1b752d58ce2d600d1889" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "train-info" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "from" integer NOT NULL, "to" integer NOT NULL, "date" TIMESTAMP NOT NULL, CONSTRAINT "PK_1cb4e0e4e0997bd31a3591dc70d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."train-request_placetypes_enum" AS ENUM('Купе', 'Плацкарт', 'Люкс', 'СВ')`);
        await queryRunner.query(`CREATE TYPE "public"."train-request_placepositions_enum" AS ENUM('верх', 'низ', 'места')`);
        await queryRunner.query(`CREATE TABLE "train-request" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "from" integer NOT NULL, "to" integer NOT NULL, "date" TIMESTAMP NOT NULL, "minSpots" integer NOT NULL DEFAULT '1', "placeTypes" "public"."train-request_placetypes_enum" array NOT NULL DEFAULT '{Купе,Плацкарт}', "placePositions" "public"."train-request_placepositions_enum" array NOT NULL DEFAULT '{верх,низ}', "specificTime" TIMESTAMP, "userId" integer, CONSTRAINT "PK_9c1b76ffc17b762c75fbe9087cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP DEFAULT now(), "telegramId" character varying NOT NULL, "phoneNumber" character varying, "username" character varying, "firstname" character varying, "lastname" character varying, CONSTRAINT "UQ_df18d17f84763558ac84192c754" UNIQUE ("telegramId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "train-position-info" ADD CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1" FOREIGN KEY ("typeId") REFERENCES "train-type-info"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "train-type-info" ADD CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f" FOREIGN KEY ("infoId") REFERENCES "train-info"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "train-request" ADD CONSTRAINT "FK_9766b0a16419d7e37cf68a9e8a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "train-request" DROP CONSTRAINT "FK_9766b0a16419d7e37cf68a9e8a5"`);
        await queryRunner.query(`ALTER TABLE "train-type-info" DROP CONSTRAINT "FK_2862a3dbd46d6ae02536a2f7e4f"`);
        await queryRunner.query(`ALTER TABLE "train-position-info" DROP CONSTRAINT "FK_ab3ac03e3a6bf536b584f4a43b1"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "train-request"`);
        await queryRunner.query(`DROP TYPE "public"."train-request_placepositions_enum"`);
        await queryRunner.query(`DROP TYPE "public"."train-request_placetypes_enum"`);
        await queryRunner.query(`DROP TABLE "train-info"`);
        await queryRunner.query(`DROP TABLE "train-type-info"`);
        await queryRunner.query(`DROP TYPE "public"."train-type-info_type_enum"`);
        await queryRunner.query(`DROP TABLE "train-position-info"`);
        await queryRunner.query(`DROP TYPE "public"."train-position-info_position_enum"`);
    }

}
