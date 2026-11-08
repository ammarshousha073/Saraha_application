
import { createClient } from 'redis';

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        reconnectStrategy(retries) {
            if (retries >= 3) {
                return new Error(
                    'Redis connection failed after 3 attempts'
                );
            }

            return Math.min(retries * 500, 2000);
        },
    },
});

let errorLogged = false;

redisClient.on('error', (error) => {
    if (!errorLogged) {
        console.error(
            `[Redis] Connection error: ${error.message}`
        );
        errorLogged = true;
    }
});

redisClient.on('ready', () => {
    errorLogged = false;
    console.log('[Redis] Connected successfully');
});

export const redisConnection = redisClient.connect();

// Set value with TTL (default: 10 minutes)
export const set = async ({ key, value, ttl = 600 }) => {
    await redisConnection;

    try {
        return await redisClient.set(key, value, {
            EX: ttl,
        });
    } catch (error) {
        throw new Error(`Redis SET failed: ${error.message}`);
    }
};

// Get value
export const get = async ({ key }) => {
    await redisConnection;

    try {
        return await redisClient.get(key);
    } catch (error) {
        throw new Error(`Redis GET failed: ${error.message}`);
    }
};

// Get remaining TTL in seconds
export const ttl = async ({ key }) => {
    await redisConnection;

    try {
        return await redisClient.ttl(key);
    } catch (error) {
        throw new Error(`Redis TTL failed: ${error.message}`);
    }
};

// Delete key
// Delete one or multiple keys
export const del = async ({ key }) => {
    await redisConnection;

    try {
        if (Array.isArray(key)) {
            if (key.length === 0) return 0;
            return await redisClient.del(key);
        }

        return await redisClient.del(key);
    } catch (error) {
        throw new Error(`Redis DEL failed: ${error.message}`);
    }
};

// Get keys by prefix
export const keys = async ({ prefix } = {}) => {
    await redisConnection;

    try {
        return await redisClient.keys(`${prefix}*`);
    } catch (error) {
        throw new Error(`Redis KEYS failed: ${error.message}`);
    }
};

export const incrBy = async ({ key , value=1 }={}) => {
    return await redisClient.incrBy(key,value)
}

// Set expiration for an existing key (in seconds)
export const expire = async ({ key, ttl }) => {
    await redisConnection;

    try {
        return await redisClient.expire(key, ttl);
    } catch (error) {
        throw new Error(`Redis EXPIRE failed: ${error.message}`);
    }
};

export const incrementWithExpiry = async ({
    key,
    ttl
} = {}) => {

    await redisConnection;

    const script = `
        local current = redis.call("INCR", KEYS[1])

        if current == 1 then
            redis.call("EXPIRE", KEYS[1], ARGV[1])
        end

        local remaining = redis.call("TTL", KEYS[1])

        return { current, remaining }
    `;

    try {
        const result = await redisClient.eval(script, {
            keys: [key],
            arguments: [String(ttl)]
        });

        return {
            count: Number(result[0]),
            ttl: Number(result[1])
        };

    } catch (error) {
        throw new Error(
            `Redis Rate Limit failed: ${error.message}`
        );
    }
};




export default redisClient;
