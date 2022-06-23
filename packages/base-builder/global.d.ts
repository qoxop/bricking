declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV?: 'development' | 'production';
        BRICKING_RC: string;
    }
}
