import { createClient } from 'redis';

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const client = createClient({
    password: 'exZFhnQJDE3x6m39WqePNBc4fVoxaXVO',
    socket: {
        host: 'redis-14712.c340.ap-northeast-2-1.ec2.cloud.redislabs.com',
        port: 14712
    }
});

// 에러 핸들링 및 재시도 로직
client.on('error', (err) => {
    console.error('Redis Client Error:', err);

    // Redis 연결 불가 또는 클라이언트 최대 한도 초과 시 재시도
    if ((err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message.includes('max number of clients reached')) && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1;
        console.log(`재시도 중... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(async () => {
            try {
                await client.connect();  // 재시도
            } catch (retryError) {
                console.error('재시도 중 오류 발생:', retryError);
            }
        }, 2000);  // 2초 후 재시도
    } 
});

export default client;