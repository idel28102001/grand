import { TrainRequestEntity } from '../../train-request/entities/train-request.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class UsersCenterEntity {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@CreateDateColumn({ nullable: true })
	createdAt: number;

	@Column({ nullable: false, unique: true })
	telegramId: string;

	@Column({ nullable: true })
	phoneNumber: string;

	@Column({ nullable: true })
	username: string;

	@Column({ nullable: true })
	firstname: string;

	@Column({ nullable: true })
	lastname: string;

	@OneToMany(() => TrainRequestEntity, (train) => train.user, {onDelete: 'CASCADE',  onUpdate: 'CASCADE'})
	trainRequests: TrainRequestEntity[];
}
