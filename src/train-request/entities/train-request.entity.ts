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

	/** Side seats (боковые) do not count; checked on the train page. */
	@Column({ nullable: false, default: false })
	excludeSide: boolean;

	/** Look for seats only in sections sectionFrom…sectionTo (1–9); null = all. */
	@Column({ type: 'int', nullable: true, default: null })
	sectionFrom: number | null;

	@Column({ type: 'int', nullable: true, default: null })
	sectionTo: number | null;

	/**
	 * Signature of the tickets this request was last notified about
	 * (trains, classes and seat counts that fit). A notification is sent
	 * only when the fitting tickets differ from it. null = never notified.
	 */
	@Column({ type: 'text', nullable: true, default: null })
	lastNotified: string | null;

	@ManyToOne(() => UsersCenterEntity, (user) => user.trainRequests, {
		eager: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	user: UsersCenterEntity;
}
