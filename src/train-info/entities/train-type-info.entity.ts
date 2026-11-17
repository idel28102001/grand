import {
	Column,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { PlaceType } from '../enums/place-type.enum';
import { TrainPositionInfoEntity } from './train-position-info.entity';
import { TrainInfoEntity } from './train-info.entity';
import type { FreeSeat } from '../../common/helpers/seat-details-parser';

@Entity('train-type-info')
export class TrainTypeInfoEntity {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ nullable: false, default: 0, type: 'float8' })
	price: number;

	@Column({
		type: 'enum',
		enum: PlaceType,
		default: PlaceType.SEAT,
	})
	type: PlaceType;

	/**
	 * Free seats of this class from the train page(s), one list per train
	 * leg: [{ n: 37, position: 'низ', side: true }, …]. Lets every request
	 * filter by side seats and sections without loading the page again.
	 * null = not loaded for this snapshot yet; a new snapshot (the search
	 * numbers changed) starts with null again.
	 */
	@Column({ type: 'jsonb', nullable: true, default: null })
	freeSeats: FreeSeat[][] | null;

	@OneToMany(() => TrainPositionInfoEntity, (item) => item.type, {
		eager: true,
		cascade: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	positions: TrainPositionInfoEntity[];

	@ManyToOne(() => TrainInfoEntity, (item) => item.types, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	info: TrainInfoEntity;
}
