import { Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';

@Injectable()
export class FileService {
    async uploadFile(file: Express.Multer.File) {
        const uploadDir = path.join(process.cwd(), 'uploads'); //current working directory - текущий рабочий каталог
        const filePath = path.join(uploadDir, file.originalname);
        
        if(!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); //mkdirSync - создание каталога
        }

        fs.writeFileSync(filePath, file.buffer);
        return{ path: filePath };
    }
}
