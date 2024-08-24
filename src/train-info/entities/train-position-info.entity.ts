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

	@ManyToOne(() => TrainTypeInfoEntity, (item) => item.positions, {onDelete: 'CASCADE',  onUpdate: 'CASCADE'})
	type: TrainPositionInfoEntity;
}
