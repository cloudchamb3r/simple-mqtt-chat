import { useEffect, useState } from 'react';
import './App.css'
import { useMqttClient } from './hooks/useMqttClient';

function generateClientId(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}


function App() {
  const [clientId,] = useState<string>(generateClientId(5));
  const [history, setHistory] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const client = useMqttClient('127.0.0.1', 15675, '/ws', clientId);

  useEffect(() => {

    (async () => {
      await client.connect();
      console.log('connected ? ');

      client.subscribe('chat', (message) => {
        const obj = JSON.parse(message);
        setHistory((history) => {
          return [...history, `${obj.clientId}: ${obj.message}`];
        });
      });

    })();
  }, []);

  const handleSubmit = () => {
    if (message.length != 0) {
      client.send('chat', JSON.stringify({ clientId, message, sentDate: new Date() }));
      setMessage('');
    }
  }
  return (
    <>
      <div aria-label='chat-history' style={{ border: '1px solid black', minHeight: '480px' }}>
        {history.map((msg, idx) => (<div key={idx}>{msg}</div>))}
      </div>

      <div style={{ display: 'flex' }}>
        <input type="text" value={clientId} maxLength={5} style={{ width: 60 }} readOnly={true} />
        <input type="text" placeholder='여기에 메시지를 입력 🤓' value={message} onChange={(e) => { setMessage(e.target.value) }} onKeyDown={(e) => (e.key == 'Enter' && handleSubmit())} />
        <input type="button" value="전송" onClick={handleSubmit} />
      </div>
    </>
  )
}

export default App
