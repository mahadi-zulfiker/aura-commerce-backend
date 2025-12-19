declare const _default: () => {
    port: number;
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        refreshSecret: string | undefined;
        expiresIn: string;
    };
    stripe: {
        secretKey: string | undefined;
        webhookSecret: string | undefined;
    };
    frontend: {
        url: string | undefined;
    };
    email: {
        host: string | undefined;
        port: number;
        user: string | undefined;
        password: string | undefined;
    };
    cloudinary: {
        cloudName: string | undefined;
        apiKey: string | undefined;
        apiSecret: string | undefined;
    };
};
export default _default;
