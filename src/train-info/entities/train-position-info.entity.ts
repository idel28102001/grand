import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PlacePosition } from '../enums/place-position.enum';
import { TrainTypeInfoEntity } from './train-type-info.entity';

@Entity('train-position-info')
export class TrainPositionInfoEntity {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ nullable: false, default: 0 })
	spots: number;

	@Column({
		type: 'enum',
		enum: PlacePosition,
	})
	position: PlacePosition;

	/**
	 * Plackart only, from the train page: how many free seats of this
	 * position are side seats (боковые) and how many are regular.
	 * null = not checked for this snapshot yet. A new snapshot (the search
	 * numbers changed) starts with null again.
	 */
	@Column({ type: 'int', nullable: true, default: null })
	sideSpots: number | null;

	@Column({ type: 'int', nullable: true, default: null })
	noSideSpots: number | null;

	@ManyToOne(() => TrainTypeInfoEntity, (item) => item.positions, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	type: TrainPositionInfoEntity;
}
