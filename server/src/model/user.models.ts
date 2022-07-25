import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User{
    @Prop({ unique: true })
    email: string;

    password: string;

    @Prop({default: ''})
    lastName: string;

    @Prop({default: ''})
    firstName: string;

    @Prop({default: ''})
    DOB: string;

    @Prop({default: ''})
    gender: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
