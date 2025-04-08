//used this to avoid types error in jwt(imp as override the express)
export{};

declare global {
    namespace Express {
      export interface Request {
        userId?: string
      }
    }
    interface JwtPayLoad {
        id: string
    }
    namespace NodeJS{
      export interface ProcessEnv{
        DB_URL: string,
        JWT_SECRET: string
      }
    }
}