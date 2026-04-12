import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy{
    constructor() {
        const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
        super({adapter});
    }
    async onModuleInit() {
        try {              
            await this.$connect();
            Logger.log('Connected to the database');
        } catch (error) {
            Logger.log('Error connecting to the database:', error);
            throw error;
        }    
    }       

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
