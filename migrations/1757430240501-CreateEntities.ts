import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntities1757430240501 implements MigrationInterface {
    name = 'CreateEntities1757430240501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctor" ("id" SERIAL NOT NULL, "specialization" character varying NOT NULL, "userId" integer, CONSTRAINT "REL_e573a17ab8b6eea2b7fe9905fa" UNIQUE ("userId"), CONSTRAINT "PK_ee6bf6c8de78803212c548fcb94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient" ("id" SERIAL NOT NULL, "age" integer NOT NULL, "userId" integer, CONSTRAINT "REL_6636aefca0bdad8933c7cc3e39" UNIQUE ("userId"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_e573a17ab8b6eea2b7fe9905fa8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient" ADD CONSTRAINT "FK_6636aefca0bdad8933c7cc3e394" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient" DROP CONSTRAINT "FK_6636aefca0bdad8933c7cc3e394"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_e573a17ab8b6eea2b7fe9905fa8"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "patient"`);
        await queryRunner.query(`DROP TABLE "doctor"`);
    }

}
