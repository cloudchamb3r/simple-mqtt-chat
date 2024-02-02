import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Client, Message } from 'paho-mqtt';

interface MqttClient {
    connect: () => Promise<void>;
    subscribe: (topic: string, callback: (message: string) => void) => void,
    send: (topic: string, message: string) => void
}

const useMqttClient: (host: string, port: number, path: string, clientId: string) => MqttClient
    = (host: string, port: number, path: string, clientId: string) => {
        const [callbackChain, setCallbackChain] = useState<((message: string) => void)[]>([]);
        const client = useRef<Client | null>(null);

        return {
            connect() {
                return new Promise<void>((resolve, reject) => {
                    client.current = new Client(host, port, path, clientId);

                    client.current.onConnectionLost = (e) => {
                        reject(e.errorMessage);
                    }

                    client.current.onMessageArrived = (message: Message) => {
                        const payload = message.payloadString;
                        setCallbackChain((cc) => {

                            for (const cb of cc) {
                                cb(payload);
                            }
                            return cc;
                        })
                    }
                    client.current?.connect({
                        onSuccess: () => {
                            resolve();
                        },
                        onFailure: (e) => {
                            reject(e.errorMessage);
                        },
                        timeout: 3,
                        keepAliveInterval: 30,
                    });
                });
            },
            subscribe(topic: string, callback: (message: string) => void) {
                setCallbackChain([...callbackChain, callback]);
                client.current?.subscribe(topic);
            },
            send(topic: string, message: string) {
                const pahoMessage = new Message(message);
                pahoMessage.destinationName = topic;
                client.current?.send(pahoMessage);
            }
        }
    };

export { useMqttClient };
export type { MqttClient };