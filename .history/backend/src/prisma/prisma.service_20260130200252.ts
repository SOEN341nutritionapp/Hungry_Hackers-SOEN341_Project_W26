import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit OnModuleDestroy{
    constructor(){
        super({
            log:['query', 'info', 'warn', 'error'],

        });
}

async onModuleInit(){
    await

}

async onModuleDestroy(){
    await

}