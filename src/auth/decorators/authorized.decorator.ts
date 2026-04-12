import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/generated/prisma/client";

export const Authorized = createParamDecorator(
    (data: keyof User, ctx: ExecutionContext) => {  
        const request = ctx.switchToHttp().getRequest() as any;

        const user = request.user as User;

        return data ? user?.[data] : user;
    },
  );