import * as fs from 'fs';
import * as path from 'path';

interface DirectoryStructure {
    [key: string]: DirectoryStructure;
}

const uploadStructure: DirectoryStructure = {
    avatars: {},
    products: {
        camping: {},
        gear: {}
    },
    news: {
        thumbnails: {},
        '2024': {
            '01': {},
            '02': {},
            '03': {},
            '04': {}
        }
    },
    blog: {
        thumbnails: {},
        '2024': {
            '01': {},
            '02': {},
            '03': {},
            '04': {}
        }
    }
};

function createDirectories(basePath: string, structure: DirectoryStructure) {
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
        console.log(`Created directory: ${basePath}`);
    }

    for (const [name, subStructure] of Object.entries(structure)) {
        const currentPath = path.join(basePath, name);

        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath, { recursive: true });
            console.log(`Created directory: ${currentPath}`);
        }

        if (Object.keys(subStructure).length > 0) {
            createDirectories(currentPath, subStructure);
        }
    }
}

const uploadsPath = path.join(process.cwd(), 'uploads');

try {
    console.log('Starting to create upload directories...');
    createDirectories(uploadsPath, uploadStructure);
    console.log('Successfully created all upload directories!');
} catch (error) {
    console.error('Error creating directories:', error);
} 