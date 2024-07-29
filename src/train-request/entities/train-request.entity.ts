import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersCenterEntity } from '../../users-center/entities/users.entity';
import { PlaceType } from '../../train-info/enums/place-type.enum';
import { PlacePosition } from '../../train-info/enums/place-position.enum';

@Entity('train-request')
export class TrainRequestEntity {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@CreateDateColumn({ type: 'timestamp' })
	readonly createdAt: Date;

	@Column({ nullable: false })
	from: number;

	@Column({ nullable: false })
	to: number;

	@Column({ nullable: false })
	date: Date;

	@Column({ nullable: false, default: 1 })
	minSpots: number;

	@Column({
		type: 'enum',
		enum: PlaceType,
		array: true,
		default: [PlaceType.COUPE, PlaceType.SEAT],
	})
	placeTypes: PlaceType[];

	@Column({
		type: 'enum',
		enum: PlacePosition,
		array: true,
		default: [PlacePosition.TOP, PlacePosition.BOTTOM],
	})
	placePositions: PlacePosition[];

	@Column({ nullable: true, type: 'timestamp' })
	specificTime: Date | null;

	@ManyToOne(() => UsersCenterEntity, (user) => user.trainRequests, {
		eager: true,
	})
	user: UsersCenterEntity;
}
