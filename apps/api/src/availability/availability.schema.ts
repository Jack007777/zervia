import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AvailabilityDocument = HydratedDocument<AvailabilityEntity>;

@Schema({ _id: false })
export class AvailabilityWindow {
  @Prop({ required: true })
  start!: string;

  @Prop({ required: true })
  end!: string;
}

const AvailabilityWindowSchema = SchemaFactory.createForClass(AvailabilityWindow);

@Schema({ _id: false })
export class WeeklyAvailability {
  @Prop({ required: true, min: 1, max: 7 })
  dayOfWeek!: number;

  @Prop()
  staffId?: string;

  @Prop({ type: [AvailabilityWindowSchema], default: [] })
  windows!: AvailabilityWindow[];
}

const WeeklyAvailabilitySchema = SchemaFactory.createForClass(WeeklyAvailability);

@Schema({ _id: false })
export class SpecialDateOverride {
  @Prop({ required: true })
  date!: string;

  @Prop()
  staffId?: string;

  @Prop({ default: false })
  isClosed!: boolean;

  @Prop({ type: [AvailabilityWindowSchema], default: [] })
  windows!: AvailabilityWindow[];
}

const SpecialDateOverrideSchema = SchemaFactory.createForClass(SpecialDateOverride);

@Schema({ timestamps: true, collection: 'availability' })
export class AvailabilityEntity {
  @Prop({ required: true, unique: true, index: true })
  businessId!: string;

  @Prop({ default: 'Europe/Berlin' })
  timezone!: string;

  @Prop({ type: [WeeklyAvailabilitySchema], default: [] })
  weeklySchedule!: WeeklyAvailability[];

  @Prop({ type: [SpecialDateOverrideSchema], default: [] })
  specialDateOverrides!: SpecialDateOverride[];
}

export const AvailabilitySchema = SchemaFactory.createForClass(AvailabilityEntity);
