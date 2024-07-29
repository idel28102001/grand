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

	@OneToMany(() => TrainPositionInfoEntity, (item) => item.type, {
		eager: true,
		cascade: true,
	})
	positions: TrainPositionInfoEntity[];

	@ManyToOne(() => TrainInfoEntity, (item) => item.types)
	info: TrainInfoEntity;
}
