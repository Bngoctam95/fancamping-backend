import { Types } from 'mongoose';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    _id: Types.ObjectId;
    email: string;
    name: string;
    role: string;
  };
}
