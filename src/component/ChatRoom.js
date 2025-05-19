import React, { useEffect, useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient = null;

const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");

  const [userData, setUserData] = useState({
    username: '',
    recipient: '',
    connected: false,
    content: ''
  });

  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const connect = () => {
    let Sock = new SockJS('http://localhost:8080/ws');
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData(prev => ({ ...prev, connected: true }));
    stompClient.subscribe('/chatroom/public', onMessageReceived);
    stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessage);
    userJoin();
  };

  const userJoin = () => {
    const chatMessage = {
      sender: userData.username,
      status: "JOIN"
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const onMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.sender)) {
          privateChats.set(payloadData.sender, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onPrivateMessage = (payload) => {
    const payloadData = JSON.parse(payload.body);
    if (privateChats.get(payloadData.sender)) {
      privateChats.get(payloadData.sender).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.sender, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, content: value });
  };

  const sendValue = () => {
    if (stompClient) {
      const chatMessage = {
        sender: userData.username,
        content: userData.content,
        status: "MESSAGE"
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, content: '' });
    }
  };

  const sendPrivateValue = () => {
    if (stompClient) {
      const chatMessage = {
        sender: userData.username,
        recipient: tab,
        content: userData.content,
        status: "MESSAGE"
      };

      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }

      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, content: '' });
    }
  };

  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  const registerUser = () => {
    connect();
  };

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li onClick={() => setTab("CHATROOM")} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
              {[...privateChats.keys()].map((name, index) => (
                <li onClick={() => setTab(name)} className={`member ${tab === name && "active"}`} key={index}>{name}</li>
              ))}
            </ul>
          </div>

          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {publicChats.map((chat, index) => (
                  <li className={`message ${chat.sender === userData.username && "self"}`} key={index}>
                    {chat.sender !== userData.username && <div className="avatar">{chat.sender}</div>}
                    <div className="message-data">{chat.content}</div>
                    {chat.sender === userData.username && <div className="avatar self">{chat.sender}</div>}
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input type="text" className="input-message" placeholder="Enter the message" value={userData.content} onChange={handleMessage} />
                <button type="button" className="send-button" onClick={sendValue}>Send</button>
              </div>
            </div>
          )}

          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li className={`message ${chat.sender === userData.username && "self"}`} key={index}>
                    {chat.sender !== userData.username && <div className="avatar">{chat.sender}</div>}
                    <div className="message-data">{chat.content}</div>
                    {chat.sender === userData.username && <div className="avatar self">{chat.sender}</div>}
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input type="text" className="input-message" placeholder="Enter the message" value={userData.content} onChange={handleMessage} />
                <button type="button" className="send-button" onClick={sendPrivateValue}>Send</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter your name"
            name="userName"
            value={userData.username}
            onChange={handleUsername}
            margin="normal"
          />
          <button type="button" onClick={registerUser}>Connect</button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
