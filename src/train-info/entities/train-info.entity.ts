import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainTypeInfoEntity } from './train-type-info.entity';

@Entity('train-info')
export class TrainInfoEntity {
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

	@OneToMany(() => TrainTypeInfoEntity, (item) => item.info, {
		eager: true,
		cascade: true,
		onDelete: 'CASCADE',  onUpdate: 'CASCADE'
	})
	types: TrainTypeInfoEntity[];
}
