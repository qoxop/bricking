import path from 'path'

export const normalizePath = (filepath: string) => filepath && filepath.replace(/\\+/g, '/');

export const humanlizePath = (filepath: string) => normalizePath(path.relative(process.cwd(), filepath));